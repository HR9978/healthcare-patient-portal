import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentsApi } from '../../core/services/api/appointments.api';
import { NotificationService } from '../../core/services/notification.service';
import { PaymentForm } from '../../shared/components/payment-form';
import { apiMessage } from '../../shared/utils/api-error';

@Component({
  selector: 'app-pay-appointment',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatProgressBarModule, PaymentForm],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    <h1>Complete your payment</h1>

    @if (unavailable()) {
      <mat-card>
        <mat-card-content>
          <p>
            This booking is no longer awaiting payment. Unpaid bookings are released after
            15 minutes, so it may have expired.
          </p>
          <a mat-flat-button routerLink="/portal/dashboard">Back to dashboard</a>
        </mat-card-content>
      </mat-card>
    } @else if (appointment(); as a) {
      <mat-card>
        <mat-card-content>
          <p>
            <strong>Dr. {{ a.doctor.user.firstName }} {{ a.doctor.user.lastName }}</strong>
            · {{ a.doctor.specialty.name }}<br />
            {{ a.startsAt | date: 'EEEE, d MMMM y, h:mm a' }}
          </p>
          <app-payment-form
            [amount]="amount()"
            [busy]="busy()"
            [error]="error()"
            (submitted)="pay($event)"
          />
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 700px;
      margin: 0 auto;
    }
  `,
})
export class PayAppointment implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AppointmentsApi);
  private readonly notify = inject(NotificationService);

  readonly appointment = signal<Appointment | null>(null);
  readonly loading = signal(true);
  readonly unavailable = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly amount = computed(() => Number(this.appointment()?.invoice?.amount ?? 0));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.list().subscribe({
      next: (list) => {
        const found = list.find((a) => a.id === id);
        if (found && found.status === 'PENDING' && found.invoice?.status === 'PENDING') {
          this.appointment.set(found);
        } else {
          this.unavailable.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.unavailable.set(true);
        this.loading.set(false);
      },
    });
  }

  pay(method: 'CARD' | 'INSURANCE'): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.pay(appointment.id, method).subscribe({
      next: () => {
        this.notify.success('Payment received. Your appointment is confirmed.');
        void this.router.navigate(['/portal/dashboard']);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(apiMessage(err, 'Payment could not be completed.'));
      },
    });
  }
}
