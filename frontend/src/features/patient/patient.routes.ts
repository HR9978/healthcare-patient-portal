import { Routes } from '@angular/router';

export const PATIENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'My dashboard',
    loadComponent: () => import('./patient-dashboard').then((m) => m.PatientDashboard),
  },
];
