import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import {
  Appointment,
  AppointmentStatus,
} from '../../../core/models/appointment.model';
import { AppointmentsApi } from '../../../core/services/api/appointments.api';
import { NotificationService } from '../../../core/services/notification.service';

export type Perspective = 'patient' | 'doctor' | 'admin';

@Component({
  selector: 'app-appointments-overview',
  imports: [DatePipe, MatCardModule, MatTableModule, MatButtonModule, MatProgressBarModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <section class="stats" aria-label="Summary">
      <mat-card>
        <mat-card-content>
          <div class="number">{{ upcomingCount() }}</div>
          <div>Upcoming</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <div class="number">{{ appointments().length }}</div>
          <div>Total</div>
        </mat-card-content>
      </mat-card>
    </section>

    <mat-card>
      <mat-card-header>
        <mat-card-title>Appointments</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (failed()) {
          <p class="error" role="alert">
            Could not load appointments.
            <button mat-button type="button" (click)="load()">Retry</button>
          </p>
        } @else if (!loading() && appointments().length === 0) {
          <p class="empty">No appointments yet.</p>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="appointments()">
              <ng-container matColumnDef="when">
                <th mat-header-cell *matHeaderCellDef>When</th>
                <td mat-cell *matCellDef="let a">{{ a.startsAt | date: 'EEE, d MMM y, h:mm a' }}</td>
              </ng-container>

              <ng-container matColumnDef="doctor">
                <th mat-header-cell *matHeaderCellDef>Doctor</th>
                <td mat-cell *matCellDef="let a">
                  Dr. {{ a.doctor.user.firstName }} {{ a.doctor.user.lastName }}
                  <small class="muted">· {{ a.doctor.specialty.name }}</small>
                </td>
              </ng-container>

              <ng-container matColumnDef="patient">
                <th mat-header-cell *matHeaderCellDef>Patient</th>
                <td mat-cell *matCellDef="let a">
                  {{ a.patient.user.firstName }} {{ a.patient.user.lastName }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let a">
                  <span class="pill" [class]="a.status.toLowerCase()">{{ label(a.status) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="reason">
                <th mat-header-cell *matHeaderCellDef>Reason</th>
                <td mat-cell *matCellDef="let a">{{ a.reason || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let a">
                  @if (canCancel(a)) {
                    <button mat-button type="button" (click)="cancel(a)">Cancel</button>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns()"></tr>
              <tr mat-row *matRowDef="let row; columns: columns()"></tr>
            </table>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .number {
      font-size: 2rem;
      font-weight: 500;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
    .muted {
      opacity: 0.7;
    }
    .empty {
      padding: 16px 0;
      opacity: 0.8;
    }
    .error {
      color: #b3261e;
    }
    .pill {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      background: #e0e0e0;
      color: #1f1f1f;
    }
    .pill.pending { background: #fff3cd; }
    .pill.confirmed { background: #d1e7dd; }
    .pill.completed { background: #cfe2ff; }
    .pill.cancelled, .pill.no_show { background: #f8d7da; }
  `,
})
export class AppointmentsOverview implements OnInit {
  private readonly api = inject(AppointmentsApi);
  private readonly notify = inject(NotificationService);

  readonly perspective = input.required<Perspective>();

  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly columns = computed(() => {
    switch (this.perspective()) {
      case 'patient':
        return ['when', 'doctor', 'status', 'reason', 'actions'];
      case 'doctor':
        return ['when', 'patient', 'status', 'reason', 'actions'];
      default:
        return ['when', 'doctor', 'patient', 'status', 'actions'];
    }
  });

  readonly upcomingCount = computed(
    () => this.appointments().filter((a) => this.isUpcoming(a)).length,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.list().subscribe({
      next: (list) => {
        this.appointments.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  label(status: AppointmentStatus): string {
    const text = status.replace('_', ' ').toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  canCancel(a: Appointment): boolean {
    return this.isUpcoming(a) && new Date(a.startsAt) > new Date();
  }

  cancel(a: Appointment): void {
    // A Material confirm dialog will replace this later.
    if (!confirm('Cancel this appointment?')) {
      return;
    }
    this.api.cancel(a.id).subscribe({
      next: () => {
        this.notify.success('Appointment cancelled');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        const message = err.error?.message;
        this.notify.error(typeof message === 'string' ? message : 'Could not cancel the appointment');
      },
    });
  }

  private isUpcoming(a: Appointment): boolean {
    return (
      (a.status === 'PENDING' || a.status === 'CONFIRMED') &&
      new Date(a.endsAt) > new Date()
    );
  }
}
