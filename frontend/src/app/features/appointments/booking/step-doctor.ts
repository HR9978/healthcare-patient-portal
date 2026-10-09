import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { BookingStore } from './booking.store';

@Component({
  selector: 'app-step-doctor',
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  template: `
    <h2>Choose a doctor</h2>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Search by name</mat-label>
        <input matInput #search [value]="store.searchText()" (keyup.enter)="apply(search.value)" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Specialty</mat-label>
        <mat-select [value]="store.specialtyId()" (selectionChange)="setSpecialty($event.value)">
          <mat-option [value]="null">All specialties</mat-option>
          @for (s of store.specialties(); track s.id) {
            <mat-option [value]="s.id">{{ s.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <button mat-stroked-button type="button" (click)="apply(search.value)">Search</button>
    </div>

    @if (store.doctorsLoading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (store.doctorsFailed()) {
      <p class="error" role="alert">
        Could not load doctors.
        <button mat-button type="button" (click)="store.loadDoctors()">Retry</button>
      </p>
    } @else if (!store.doctorsLoading() && store.doctors().length === 0) {
      <p>No doctors match your search.</p>
    }

    <div class="grid">
      @for (d of store.doctors(); track d.id) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Dr. {{ d.firstName }} {{ d.lastName }}</mat-card-title>
            <mat-card-subtitle>{{ d.specialty.name }} · {{ d.yearsExperience }} years</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{ d.bio }}</p>
            <p class="fee">Consultation: {{ d.consultationFee | currency }}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-flat-button type="button" (click)="store.selectDoctor(d)">Select</button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }
    .fee {
      font-weight: 500;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class StepDoctor implements OnInit {
  readonly store = inject(BookingStore);

  ngOnInit(): void {
    if (this.store.specialties().length === 0) {
      this.store.loadSpecialties();
    }
    if (this.store.doctors().length === 0) {
      this.store.loadDoctors();
    }
  }

  apply(text: string): void {
    this.store.searchText.set(text.trim());
    this.store.loadDoctors();
  }

  setSpecialty(id: string | null): void {
    this.store.specialtyId.set(id);
    this.store.loadDoctors();
  }
}
