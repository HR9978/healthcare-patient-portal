import { Component } from '@angular/core';
import { AppointmentsOverview } from '../appointments/components/appointments-overview';

@Component({
  selector: 'app-admin-dashboard',
  imports: [AppointmentsOverview],
  template: `
    <h1>Administration</h1>
    <app-appointments-overview perspective="admin" />
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
export class AdminDashboard {}
