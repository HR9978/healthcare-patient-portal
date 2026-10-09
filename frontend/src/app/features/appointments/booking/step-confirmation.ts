import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BookingStore } from './booking.store';

@Component({
  selector: 'app-step-confirmation',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="done">
      <mat-icon class="ok" aria-hidden="true">check_circle</mat-icon>
      <h2>Your appointment is confirmed</h2>
    </div>

    @if (store.appointment(); as a) {
      <dl class="summary">
        <dt>Doctor</dt>
        <dd>Dr. {{ a.doctor.user.firstName }} {{ a.doctor.user.lastName }} · {{ a.doctor.specialty.name }}</dd>
        <dt>When</dt>
        <dd>{{ a.startsAt | date: 'EEEE, d MMMM y, h:mm a' : store.clinicTimezone() }}</dd>
        @if (a.room) {
          <dt>Room</dt>
          <dd>{{ a.room.name }}</dd>
        }
        <dt>Paid</dt>
        <dd>{{ amount() | currency }}</dd>
        <dt>Reference</dt>
        <dd class="ref">{{ a.id }}</dd>
      </dl>
    }

    <div class="actions">
      <button mat-button type="button" (click)="store.reset()">Book another</button>
      <a mat-flat-button routerLink="/portal/dashboard">View my appointments</a>
    </div>
  `,
  styles: `
    .done {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ok {
      color: #1e8e3e;
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
    .summary {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 6px 16px;
    }
    .summary dt {
      font-weight: 600;
    }
    .summary dd {
      margin: 0;
    }
    .ref {
      font-family: monospace;
      font-size: 0.85rem;
      word-break: break-all;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
  `,
})
export class StepConfirmation {
  readonly store = inject(BookingStore);
  readonly amount = computed(() => Number(this.store.appointment()?.invoice?.amount ?? 0));
}
