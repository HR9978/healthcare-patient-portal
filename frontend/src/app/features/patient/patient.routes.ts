import { Routes } from '@angular/router';

export const PATIENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'My dashboard',
    loadComponent: () => import('./patient-dashboard').then((m) => m.PatientDashboard),
  },
  {
    path: 'book',
    title: 'Book an appointment',
    loadComponent: () =>
      import('../appointments/booking/book-wizard').then((m) => m.BookWizard),
  },
  {
    path: 'pay/:id',
    title: 'Payment',
    loadComponent: () => import('./pay-appointment').then((m) => m.PayAppointment),
  },
  {
    path: 'medical-history',
    title: 'Medical history',
    loadComponent: () => import('./medical-history').then((m) => m.MedicalHistory),
  },
  {
    path: 'prescriptions',
    title: 'Prescriptions',
    loadComponent: () => import('./prescriptions').then((m) => m.Prescriptions),
  },
  {
    path: 'billing',
    title: 'Billing',
    loadComponent: () => import('./billing').then((m) => m.Billing),
  },
  {
    path: 'profile',
    title: 'My profile',
    loadComponent: () => import('../profile/profile').then((m) => m.ProfilePage),
  },
];
