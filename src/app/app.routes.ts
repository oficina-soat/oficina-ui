import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/presentation').then(({ Login }) => Login),
    title: 'Entrar | Oficina SOAT',
  },
  {
    path: 'session',
    loadComponent: () => import('./features/auth/presentation').then(({ Session }) => Session),
    title: 'Sessão | Oficina SOAT',
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
