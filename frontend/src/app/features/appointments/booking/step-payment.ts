import { Component, computed, inject } from '@angular/core';
import { PaymentForm } from '../../../shared/components/payment-form';
import { BookingStore } from './booking.store';

@Component({
  selector: 'app-step-payment',
  imports: [PaymentForm],
  template: `
    <h2>Payment</h2>
    <app-payment-form
      [amount]="amount()"
      [busy]="store.busy()"
      [error]="store.error()"
      (submitted)="store.pay($event)"
    />
  `,
})
export class StepPayment {
  readonly store = inject(BookingStore);

  readonly amount = computed(() =>
    Number(
      this.store.appointment()?.invoice?.amount ??
        this.store.doctor()?.consultationFee ??
        0,
    ),
  );
}
