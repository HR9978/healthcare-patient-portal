import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'portal',
    component: Shell,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    loadChildren: () =>
      import('./features/patient/patient.routes').then((m) => m.PATIENT_ROUTES),
  },
  {
    path: 'doctor',
    component: Shell,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    loadChildren: () =>
      import('./features/doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES),
  },
  {
    path: 'admin',
    component: Shell,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'unauthorized',
    title: 'Access denied',
    data: {
      icon: 'lock',
      title: 'Access denied',
      message: 'You do not have permission to view this page.',
    },
    loadComponent: () =>
      import('./features/misc/error-page').then((m) => m.ErrorPage),
  },
  {
    path: '**',
    title: 'Page not found',
    data: {
      icon: 'search_off',
      title: 'Page not found',
      message: 'The page you are looking for does not exist.',
    },
    loadComponent: () =>
      import('./features/misc/error-page').then((m) => m.ErrorPage),
  },
];
