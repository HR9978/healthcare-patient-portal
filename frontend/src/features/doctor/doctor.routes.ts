import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Doctor dashboard',
    loadComponent: () => import('./doctor-dashboard').then((m) => m.DoctorDashboard),
  },
];
