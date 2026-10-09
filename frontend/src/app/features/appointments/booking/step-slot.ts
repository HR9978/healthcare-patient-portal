import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { addDays, toDateInputValue } from '../../../shared/utils/clinic-time';
import { BookingStore } from './booking.store';

@Component({
  selector: 'app-step-slot',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    @if (store.doctor(); as d) {
      <h2>Pick a date and time</h2>
      <p>With Dr. {{ d.firstName }} {{ d.lastName }} · {{ d.specialty.name }}</p>
    }

    @if (store.notice()) {
      <p class="notice" role="alert">{{ store.notice() }}</p>
    }

    <mat-form-field appearance="outline">
      <mat-label>Appointment date</mat-label>
      <input
        matInput
        type="date"
        [min]="min"
        [max]="max"
        [value]="store.date()"
        (change)="store.setDate($any($event.target).value)"
      />
      <mat-hint>Doctors are available Monday to Friday</mat-hint>
    </mat-form-field>

    @if (store.slotsLoading()) {
      <mat-progress-bar mode="indeterminate" />
    } @else if (store.slotsError()) {
      <p class="error" role="alert">{{ store.slotsError() }}</p>
    } @else if (store.date() && store.slots().length === 0) {
      <p>No appointments are available on this day. Please try another date.</p>
    }

    <div class="slots" role="group" aria-label="Available time slots">
      @for (s of store.slots(); track s.startsAt) {
        <button
          mat-stroked-button
          type="button"
          [disabled]="!s.available"
          [class.selected]="store.slot()?.startsAt === s.startsAt"
          [attr.aria-pressed]="store.slot()?.startsAt === s.startsAt"
          (click)="store.selectSlot(s)"
        >
          @if (store.slot()?.startsAt === s.startsAt) {
            <mat-icon>check</mat-icon>
          }
          {{ s.startsAt | date: 'h:mm a' : store.clinicTimezone() }}
        </button>
      }
    </div>

    <div class="actions">
      <button mat-button type="button" (click)="store.goTo(0)">Back</button>
      <button mat-flat-button type="button" [disabled]="!store.slot()" (click)="store.goTo(2)">
        Continue
      </button>
    </div>
  `,
  styles: `
    .slots {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }
    .slots button.selected {
      background-color: #d0e4ff;
      font-weight: 600;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
    .notice {
      background: #fff3cd;
      color: #1f1f1f;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class StepSlot {
  readonly store = inject(BookingStore);
  readonly min = toDateInputValue(new Date());
  readonly max = toDateInputValue(addDays(new Date(), 90));
}
