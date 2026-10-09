import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/services/auth.service';
import { BookingStore } from './booking.store';

@Component({
  selector: 'app-step-details',
  imports: [DatePipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  template: `
    @if (store.busy()) {
      <mat-progress-bar mode="indeterminate" />
    }
    <h2>Your details</h2>

    @if (store.doctor(); as d) {
      @if (store.slot(); as s) {
        <dl class="summary">
          <dt>Doctor</dt>
          <dd>Dr. {{ d.firstName }} {{ d.lastName }} · {{ d.specialty.name }}</dd>
          <dt>When</dt>
          <dd>{{ s.startsAt | date: 'EEEE, d MMMM y, h:mm a' : store.clinicTimezone() }}</dd>
          <dt>Patient</dt>
          <dd>{{ user()?.firstName }} {{ user()?.lastName }} ({{ user()?.email }})</dd>
        </dl>
      }
    }

    <mat-form-field appearance="outline" class="full">
      <mat-label>Reason for visit (optional)</mat-label>
      <textarea
        matInput
        rows="3"
        maxlength="500"
        [value]="store.reason()"
        (input)="store.reason.set($any($event.target).value)"
      ></textarea>
      <mat-hint>Please do not include sensitive medical details. This is a demo.</mat-hint>
    </mat-form-field>

    @if (store.error()) {
      <p class="error" role="alert">{{ store.error() }}</p>
    }

    <p class="hold">We'll hold this time for 15 minutes while you complete payment.</p>

    <div class="actions">
      <button mat-button type="button" [disabled]="store.busy()" (click)="store.goTo(1)">Back</button>
      <button mat-flat-button type="button" [disabled]="store.busy()" (click)="store.createAppointment()">
        Continue to payment
      </button>
    </div>
  `,
  styles: `
    .summary {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 6px 16px;
      margin: 0 0 16px;
    }
    .summary dt {
      font-weight: 600;
    }
    .summary dd {
      margin: 0;
    }
    .full {
      width: 100%;
    }
    .hold {
      opacity: 0.8;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class StepDetails {
  readonly store = inject(BookingStore);
  readonly user = inject(AuthService).user;
}
