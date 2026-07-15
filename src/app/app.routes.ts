import type { Routes } from '@angular/router';

import { authenticatedGuard, roleGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/presentation').then(({ Login }) => Login),
    title: 'Entrar | Oficina SOAT',
  },
  {
    path: 'ativar-credencial',
    loadComponent: () =>
      import('./features/auth/presentation').then(
        ({ CredentialActivation }) => CredentialActivation,
      ),
    title: 'Ativar credencial | Oficina SOAT',
  },
  {
    path: 'administracao/ativacoes/nova',
    canActivate: [authenticatedGuard, roleGuard],
    data: { roles: ['administrativo'] },
    loadComponent: () =>
      import('./features/auth/presentation').then(({ ActivationRequest }) => ActivationRequest),
    title: 'Gerar token de ativação | Oficina SOAT',
  },
  {
    path: 'session',
    canActivate: [authenticatedGuard],
    loadComponent: () => import('./features/auth/presentation').then(({ Session }) => Session),
    title: 'Sessão | Oficina SOAT',
  },
  {
    path: 'acesso-negado',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/auth/presentation').then(({ AccessDenied }) => AccessDenied),
    title: 'Acesso não disponível | Oficina SOAT',
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
