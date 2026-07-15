import type { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./features/auth/presentation').then(({ ActivationRequest }) => ActivationRequest),
    title: 'Gerar token de ativação | Oficina SOAT',
  },
  {
    path: 'session',
    loadComponent: () => import('./features/auth/presentation').then(({ Session }) => Session),
    title: 'Sessão | Oficina SOAT',
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
