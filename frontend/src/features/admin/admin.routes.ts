import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Admin dashboard',
    loadComponent: () => import('./admin-dashboard').then((m) => m.AdminDashboard),
  },
];
