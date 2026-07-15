import type { Routes } from '@angular/router';

import { authenticatedGuard, roleGuard } from './core/auth/auth.guards';
import { OperationalShell } from './layout/operational-shell';

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
    path: '',
    component: OperationalShell,
    canActivate: [authenticatedGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'session' },
      {
        path: 'session',
        loadComponent: () => import('./features/auth/presentation').then(({ Session }) => Session),
        title: 'Sessão | Oficina SOAT',
        data: { breadcrumb: 'Início' },
      },
      {
        path: 'administracao/ativacoes/nova',
        canActivate: [roleGuard],
        data: { roles: ['administrativo'], breadcrumb: 'Ativação de credencial' },
        loadComponent: () =>
          import('./features/auth/presentation').then(({ ActivationRequest }) => ActivationRequest),
        title: 'Gerar token de ativação | Oficina SOAT',
      },
      {
        path: 'acesso-negado',
        loadComponent: () =>
          import('./features/auth/presentation').then(({ AccessDenied }) => AccessDenied),
        title: 'Acesso não disponível | Oficina SOAT',
        data: { breadcrumb: 'Acesso não disponível' },
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./layout/not-found').then(({ NotFound }) => NotFound),
    title: 'Página não encontrada | Oficina SOAT',
  },
];
