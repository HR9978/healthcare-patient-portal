import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentsApi } from '../../core/services/api/appointments.api';
import { ClinicalApi } from '../../core/services/api/clinical.api';
import { NotificationService } from '../../core/services/notification.service';
import { apiMessage } from '../../shared/utils/api-error';

function createPrescriptionGroup(fb: NonNullableFormBuilder) {
  return fb.group({
    medication: ['', [Validators.required, Validators.maxLength(100)]],
    dosage: ['', [Validators.required, Validators.maxLength(100)]],
    frequency: ['', [Validators.required, Validators.maxLength(100)]],
    durationDays: [7, [Validators.required, Validators.min(1), Validators.max(365)]],
    instructions: ['', Validators.maxLength(500)],
  });
}

@Component({
  selector: 'app-consultation',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    @if (loading() || saving()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <h1>Consultation</h1>

    @if (unavailable()) {
      <mat-card>
        <mat-card-content>
          <p>This appointment is not available for consultation. It may be unpaid, already completed or cancelled.</p>
          <a mat-flat-button routerLink="/doctor/dashboard">Back to dashboard</a>
        </mat-card-content>
      </mat-card>
    } @else if (appointment(); as a) {
      <mat-card class="info">
        <mat-card-content>
          <strong>{{ a.patient.user.firstName }} {{ a.patient.user.lastName }}</strong>
          · {{ a.startsAt | date: 'EEE, d MMM y, h:mm a' }}
          @if (a.reason) {
            <div class="reason">Reason: {{ a.reason }}</div>
          }
        </mat-card-content>
      </mat-card>

      <p class="demo" role="note">
        <mat-icon aria-hidden="true">info</mat-icon>
        Demo only: do not enter real patient information.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <mat-form-field appearance="outline">
          <mat-label>Diagnosis</mat-label>
          <input matInput formControlName="diagnosis" maxlength="500" />
          @if (form.controls.diagnosis.hasError('required')) {
            <mat-error>Diagnosis is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Symptoms</mat-label>
          <textarea matInput rows="2" formControlName="symptoms" maxlength="1000"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Treatment plan</mat-label>
          <textarea matInput rows="2" formControlName="treatment" maxlength="1000"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Notes</mat-label>
          <textarea matInput rows="3" formControlName="notes" maxlength="2000"></textarea>
        </mat-form-field>

        <h2>Prescriptions</h2>
        @for (rx of prescriptions.controls; track rx; let i = $index) {
          <div class="rx" [formGroup]="rx">
            <mat-form-field appearance="outline">
              <mat-label>Medication</mat-label>
              <input matInput formControlName="medication" />
              @if (rx.controls.medication.hasError('required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Dosage</mat-label>
              <input matInput formControlName="dosage" placeholder="500 mg" />
              @if (rx.controls.dosage.hasError('required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Frequency</mat-label>
              <input matInput formControlName="frequency" placeholder="Twice daily" />
              @if (rx.controls.frequency.hasError('required')) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Days</mat-label>
              <input matInput type="number" formControlName="durationDays" min="1" max="365" />
              @if (rx.controls.durationDays.invalid) {
                <mat-error>1 to 365</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="wide">
              <mat-label>Instructions</mat-label>
              <input matInput formControlName="instructions" />
            </mat-form-field>
            <button
              mat-icon-button
              type="button"
              [attr.aria-label]="'Remove prescription ' + (i + 1)"
              (click)="removePrescription(i)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        }
        <button mat-stroked-button type="button" (click)="addPrescription()">
          <mat-icon>add</mat-icon>
          Add prescription
        </button>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <div class="actions">
          <a mat-button routerLink="/doctor/dashboard">Cancel</a>
          <button mat-flat-button type="submit" [disabled]="saving()">Complete consultation</button>
        </div>
      </form>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    .info {
      margin-bottom: 12px;
    }
    .reason {
      opacity: 0.8;
      margin-top: 4px;
    }
    .demo {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e8f0fe;
      color: #1f1f1f;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .rx {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) auto;
      gap: 0 12px;
      align-items: start;
      border-left: 3px solid #90a4ae;
      padding-left: 12px;
      margin-bottom: 8px;
    }
    .rx .wide {
      grid-column: 1 / -2;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class Consultation implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly clinicalApi = inject(ClinicalApi);
  private readonly notify = inject(NotificationService);

  readonly appointment = signal<Appointment | null>(null);
  readonly loading = signal(true);
  readonly unavailable = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    diagnosis: ['', [Validators.required, Validators.maxLength(500)]],
    symptoms: [''],
    treatment: [''],
    notes: [''],
    prescriptions: this.fb.array<ReturnType<typeof createPrescriptionGroup>>([]),
  });

  get prescriptions() {
    return this.form.controls.prescriptions;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.appointmentsApi.list().subscribe({
      next: (list) => {
        const found = list.find((a) => a.id === id);
        if (found && found.status === 'CONFIRMED') {
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

  addPrescription(): void {
    this.prescriptions.push(createPrescriptionGroup(this.fb));
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  submit(): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.clinicalApi
      .createRecord({
        appointmentId: appointment.id,
        diagnosis: value.diagnosis.trim(),
        symptoms: value.symptoms.trim() || undefined,
        treatment: value.treatment.trim() || undefined,
        notes: value.notes.trim() || undefined,
        prescriptions: value.prescriptions.map((p) => ({
          medication: p.medication.trim(),
          dosage: p.dosage.trim(),
          frequency: p.frequency.trim(),
          durationDays: Number(p.durationDays),
          instructions: p.instructions.trim() || undefined,
        })),
      })
      .subscribe({
        next: () => {
          this.notify.success('Consultation saved');
          void this.router.navigate(['/doctor/dashboard']);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(apiMessage(err, 'Could not save the consultation. Please try again.'));
        },
      });
  }
}
