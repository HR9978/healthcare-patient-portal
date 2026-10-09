import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Doctor dashboard',
    loadComponent: () => import('./doctor-dashboard').then((m) => m.DoctorDashboard),
  },
  {
    path: 'consultation/:id',
    title: 'Consultation',
    loadComponent: () => import('./consultation').then((m) => m.Consultation),
  },
  {
    path: 'profile',
    title: 'My profile',
    loadComponent: () => import('../profile/profile').then((m) => m.ProfilePage),
  },
];
