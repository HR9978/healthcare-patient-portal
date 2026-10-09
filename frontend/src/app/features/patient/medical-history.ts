import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MedicalRecord } from '../../core/models/clinical.model';
import { ClinicalApi } from '../../core/services/api/clinical.api';

@Component({
  selector: 'app-medical-history',
  imports: [DatePipe, MatButtonModule, MatExpansionModule, MatProgressBarModule],
  template: `
    <h1>Medical history</h1>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (failed()) {
      <p class="error" role="alert">
        Could not load your history.
        <button mat-button type="button" (click)="load()">Retry</button>
      </p>
    } @else if (!loading() && records().length === 0) {
      <p>No visit records yet. They appear here after a doctor completes your consultation.</p>
    }

    <mat-accordion>
      @for (r of records(); track r.id) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>{{ r.diagnosis }}</mat-panel-title>
            <mat-panel-description>
              {{ r.createdAt | date: 'mediumDate' }} · Dr. {{ r.doctor.user.lastName }}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <dl>
            <dt>Doctor</dt>
            <dd>Dr. {{ r.doctor.user.firstName }} {{ r.doctor.user.lastName }} · {{ r.doctor.specialty.name }}</dd>
            @if (r.symptoms) {
              <dt>Symptoms</dt>
              <dd>{{ r.symptoms }}</dd>
            }
            @if (r.treatment) {
              <dt>Treatment</dt>
              <dd>{{ r.treatment }}</dd>
            }
            @if (r.notes) {
              <dt>Notes</dt>
              <dd>{{ r.notes }}</dd>
            }
          </dl>

          @if (r.prescriptions.length > 0) {
            <h3>Prescriptions</h3>
            <ul>
              @for (p of r.prescriptions; track p.id) {
                <li>{{ p.medication }}: {{ p.dosage }}, {{ p.frequency }}, for {{ p.durationDays }} days</li>
              }
            </ul>
          }
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 6px 16px;
    }
    dt {
      font-weight: 600;
    }
    dd {
      margin: 0;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class MedicalHistory implements OnInit {
  private readonly api = inject(ClinicalApi);

  readonly records = signal<MedicalRecord[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api.records().subscribe({
      next: (list) => {
        this.records.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
