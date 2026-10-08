import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentsOverview } from '../appointments/components/appointments-overview';

@Component({
  selector: 'app-patient-dashboard',
  imports: [AppointmentsOverview],
  template: `
    <h1>Welcome, {{ user()?.firstName }}</h1>
    <app-appointments-overview perspective="patient" />
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }
  `,
})
export class PatientDashboard {
  readonly user = inject(AuthService).user;
}
