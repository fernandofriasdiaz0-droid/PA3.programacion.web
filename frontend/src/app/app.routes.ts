import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar Sesión — Medisys PA3'
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Registro de Usuario — Medisys PA3'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard — Medisys PA3'
  },
  {
    path: 'citas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cita-list/cita-list.component').then((m) => m.CitaListComponent),
    title: 'Citas Médicas — Medisys PA3'
  },
  {
    path: 'citas/nueva',
    canActivate: [authGuard, roleGuard('admin', 'recepcionista')],
    loadComponent: () =>
      import('./features/cita-form/cita-form.component').then((m) => m.CitaFormComponent),
    title: 'Nueva Cita — Medisys PA3'
  },
  {
    path: 'citas/editar/:id',
    canActivate: [authGuard, roleGuard('admin', 'recepcionista')],
    loadComponent: () =>
      import('./features/cita-form/cita-form.component').then((m) => m.CitaFormComponent),
    title: 'Editar Cita — Medisys PA3'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
