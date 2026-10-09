import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { IssuedPrescription } from '../../core/models/clinical.model';
import { ClinicalApi } from '../../core/services/api/clinical.api';

@Component({
  selector: 'app-prescriptions',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatProgressBarModule],
  template: `
    <h1>Prescriptions</h1>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (failed()) {
      <p class="error" role="alert">
        Could not load your prescriptions.
        <button mat-button type="button" (click)="load()">Retry</button>
      </p>
    } @else if (!loading() && prescriptions().length === 0) {
      <p>No prescriptions yet.</p>
    }

    <div class="grid">
      @for (p of prescriptions(); track p.id) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ p.medication }}</mat-card-title>
            <mat-card-subtitle>Issued {{ p.issuedAt | date: 'mediumDate' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{ p.dosage }} · {{ p.frequency }} · {{ p.durationDays }} days</p>
            @if (p.instructions) {
              <p>{{ p.instructions }}</p>
            }
            <small>
              Prescribed by Dr. {{ p.doctor.user.firstName }} {{ p.doctor.user.lastName }}
              ({{ p.doctor.specialty.name }})
            </small>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class Prescriptions implements OnInit {
  private readonly api = inject(ClinicalApi);

  readonly prescriptions = signal<IssuedPrescription[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.prescriptions().subscribe({
      next: (list) => {
        this.prescriptions.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
