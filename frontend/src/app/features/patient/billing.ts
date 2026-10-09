import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Invoice, InvoiceStatus } from '../../core/models/billing.model';
import { BillingApi } from '../../core/services/api/billing.api';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Unpaid',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Void',
};

@Component({
  selector: 'app-billing',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  template: `
    <h1>Billing</h1>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <section class="stats" aria-label="Summary">
      <mat-card>
        <mat-card-content>
          <div class="number">{{ totalPaid() | currency }}</div>
          <div>Paid</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <div class="number">{{ outstanding() | currency }}</div>
          <div>Outstanding</div>
        </mat-card-content>
      </mat-card>
    </section>

    <mat-card>
      <mat-card-header>
        <mat-card-title>Invoices</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (failed()) {
          <p class="error" role="alert">
            Could not load invoices.
            <button mat-button type="button" (click)="load()">Retry</button>
          </p>
        } @else if (!loading() && invoices().length === 0) {
          <p>No invoices yet.</p>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="invoices()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let i">{{ i.createdAt | date: 'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let i">
                  @if (i.appointment) {
                    Consultation with Dr. {{ i.appointment.doctor.user.lastName }}
                    <small class="muted">· {{ i.appointment.startsAt | date: 'd MMM y' }}</small>
                  } @else {
                    —
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let i">{{ i.amount | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let i">
                  <span class="pill" [class]="i.status.toLowerCase()">{{ label(i.status) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let i">
                  @if (canPay(i)) {
                    <a mat-flat-button [routerLink]="['/portal/pay', i.appointment.id]">Pay now</a>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .number {
      font-size: 1.8rem;
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
    .pill.paid { background: #d1e7dd; }
    .pill.refunded { background: #cfe2ff; }
    .pill.failed { background: #f8d7da; }
  `,
})
export class Billing implements OnInit {
  private readonly api = inject(BillingApi);

  readonly columns = ['date', 'description', 'amount', 'status', 'actions'];

  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly totalPaid = computed(() => this.sum('PAID'));
  readonly outstanding = computed(() =>
    this.invoices()
      .filter((i) => i.status === 'PENDING' && i.appointment?.status === 'PENDING')
      .reduce((total, i) => total + Number(i.amount), 0),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.invoices().subscribe({
      next: (list) => {
        this.invoices.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  label(status: InvoiceStatus): string {
    return STATUS_LABEL[status];
  }

  canPay(invoice: Invoice): boolean {
    return invoice.status === 'PENDING' && invoice.appointment?.status === 'PENDING';
  }

  private sum(status: InvoiceStatus): number {
    return this.invoices()
      .filter((i) => i.status === status)
      .reduce((total, i) => total + Number(i.amount), 0);
  }
}
