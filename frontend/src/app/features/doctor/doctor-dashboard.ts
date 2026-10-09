import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentsOverview } from '../appointments/components/appointments-overview';

@Component({
  selector: 'app-doctor-dashboard',
  imports: [AppointmentsOverview],
  template: `
    <h1>Good day, Dr. {{ user()?.lastName }}</h1>
    <app-appointments-overview perspective="doctor" />
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
export class DoctorDashboard {
  readonly user = inject(AuthService).user;
}
