import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentsOverview } from '../appointments/components/appointments-overview';

@Component({
  selector: 'app-patient-dashboard',
  imports: [AppointmentsOverview, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="head">
      <h1>Welcome, {{ user()?.firstName }}</h1>
      <a mat-flat-button routerLink="/portal/book">
        <mat-icon>add</mat-icon>
        Book an appointment
      </a>
    </div>
    <app-appointments-overview perspective="patient" />
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
  `,
})
export class PatientDashboard {
  readonly user = inject(AuthService).user;
}
