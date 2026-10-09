import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { PaymentMethod } from '../../core/services/api/appointments.api';

/** Mock payment form shared by the booking wizard and the "Pay now" page. */
@Component({
  selector: 'app-payment-form',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
  ],
  template: `
    @if (busy()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <p class="demo" role="note">
      <mat-icon aria-hidden="true">info</mat-icon>
      Demo payment: nothing is charged and card details are never sent anywhere.
      Use made-up values only.
    </p>

    <p>Amount due: <strong>{{ amount() | currency }}</strong></p>

    <mat-radio-group
      aria-label="Payment method"
      [value]="method()"
      (change)="method.set($event.value)"
    >
      <mat-radio-button value="CARD">Card</mat-radio-button>
      <mat-radio-button value="INSURANCE">Insurance (demo)</mat-radio-button>
    </mat-radio-group>

    @if (method() === 'CARD') {
      <form [formGroup]="card" class="card-form" novalidate>
        <mat-form-field appearance="outline">
          <mat-label>Name on card</mat-label>
          <input matInput formControlName="name" autocomplete="off" />
          @if (card.controls.name.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Card number</mat-label>
          <input matInput formControlName="number" inputmode="numeric" autocomplete="off" />
          @if (card.controls.number.invalid) {
            <mat-error>Enter 13 to 19 digits</mat-error>
          }
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Expiry (MM/YY)</mat-label>
            <input matInput formControlName="expiry" autocomplete="off" />
            @if (card.controls.expiry.invalid) {
              <mat-error>Use MM/YY</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>CVC</mat-label>
            <input matInput formControlName="cvc" inputmode="numeric" autocomplete="off" />
            @if (card.controls.cvc.invalid) {
              <mat-error>3 or 4 digits</mat-error>
            }
          </mat-form-field>
        </div>
      </form>
    }

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    <div class="actions">
      <button mat-flat-button type="button" [disabled]="busy()" (click)="pay()">
        {{ method() === 'CARD' ? 'Pay ' + (amount() | currency) : 'Confirm with insurance' }}
      </button>
    </div>
  `,
  styles: `
    .demo {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e8f0fe;
      color: #1f1f1f;
      padding: 8px 12px;
      border-radius: 4px;
    }
    mat-radio-group {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .card-form {
      display: flex;
      flex-direction: column;
      max-width: 420px;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class PaymentForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly amount = input.required<number>();
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly submitted = output<PaymentMethod>();

  readonly method = signal<PaymentMethod>('CARD');

  // Validated for realism only; these values are never sent to the API.
  readonly card = this.fb.group({
    name: ['', Validators.required],
    number: ['', [Validators.required, Validators.pattern(/^[0-9 ]{13,19}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  pay(): void {
    if (this.method() === 'CARD' && this.card.invalid) {
      this.card.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.method());
  }
}
