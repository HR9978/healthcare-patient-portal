import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BookingStore } from './booking.store';
import { StepConfirmation } from './step-confirmation';
import { StepDetails } from './step-details';
import { StepDoctor } from './step-doctor';
import { StepPayment } from './step-payment';
import { StepSlot } from './step-slot';

@Component({
  selector: 'app-book-wizard',
  imports: [
    MatCardModule,
    MatIconModule,
    StepDoctor,
    StepSlot,
    StepDetails,
    StepPayment,
    StepConfirmation,
  ],
  providers: [BookingStore],
  template: `
    <h1>Book an appointment</h1>

    <ol class="steps" aria-label="Booking progress">
      @for (label of steps; track label; let i = $index) {
        <li
          [class.active]="i === store.stepIndex()"
          [class.done]="i < store.stepIndex()"
          [attr.aria-current]="i === store.stepIndex() ? 'step' : null"
        >
          <span class="dot">
            @if (i < store.stepIndex()) {
              <mat-icon>check</mat-icon>
            } @else {
              {{ i + 1 }}
            }
          </span>
          <span class="label">{{ label }}</span>
        </li>
      }
    </ol>

    <mat-card>
      <mat-card-content>
        @switch (store.stepIndex()) {
          @case (0) { <app-step-doctor /> }
          @case (1) { <app-step-slot /> }
          @case (2) { <app-step-details /> }
          @case (3) { <app-step-payment /> }
          @case (4) { <app-step-confirmation /> }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    .steps {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      list-style: none;
      padding: 0;
      margin: 0 0 20px;
    }
    .steps li {
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.6;
    }
    .steps li.active,
    .steps li.done {
      opacity: 1;
    }
    .steps li.active .label {
      font-weight: 600;
    }
    .dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      border: 2px solid currentColor;
    }
    .dot mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `,
})
export class BookWizard {
  readonly store = inject(BookingStore);
  readonly steps = ['Doctor', 'Date & time', 'Details', 'Payment', 'Confirmation'];
}
