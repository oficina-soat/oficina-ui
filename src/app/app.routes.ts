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
        loadComponent: () => import('./layout/dashboard').then(({ Dashboard }) => Dashboard),
        title: 'Visão operacional | Oficina SOAT',
        data: { breadcrumb: 'Início' },
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/attendance/presentation').then(({ Clients }) => Clients),
        title: 'Clientes | Oficina SOAT',
        data: { breadcrumb: 'Clientes' },
      },
      {
        path: 'clientes/:clienteId/veiculos',
        loadComponent: () =>
          import('./features/attendance/presentation').then(({ Vehicles }) => Vehicles),
        title: 'Veículos do cliente | Oficina SOAT',
        data: { breadcrumb: 'Veículos' },
      },
      {
        path: 'ordens-servico',
        loadComponent: () =>
          import('./features/attendance/presentation').then(({ WorkOrders }) => WorkOrders),
        title: 'Ordens de serviço | Oficina SOAT',
        data: { breadcrumb: 'Ordens de serviço' },
      },
      {
        path: 'ordens-servico/nova',
        loadComponent: () =>
          import('./features/attendance/presentation').then(({ NewWorkOrder }) => NewWorkOrder),
        title: 'Abrir ordem de serviço | Oficina SOAT',
        data: { breadcrumb: 'Abrir ordem de serviço' },
      },
      {
        path: 'ordens-servico/:ordemServicoId',
        loadComponent: () =>
          import('./features/attendance/presentation').then(
            ({ WorkOrderDetail }) => WorkOrderDetail,
          ),
        title: 'Consultar ordem de serviço | Oficina SOAT',
        data: { breadcrumb: 'Consultar ordem de serviço' },
      },
      {
        path: 'faturamento',
        canActivate: [roleGuard],
        data: { roles: ['administrativo', 'recepcionista'], breadcrumb: 'Faturamento' },
        loadComponent: () =>
          import('./features/billing/presentation').then(({ Billing }) => Billing),
        title: 'Orçamento e pagamento | Oficina SOAT',
      },
      {
        path: 'estoque',
        canActivate: [roleGuard],
        data: { roles: ['administrativo', 'mecanico'], breadcrumb: 'Estoque' },
        loadComponent: () => import('./features/execution/presentation').then(({ Stock }) => Stock),
        title: 'Estoque | Oficina SOAT',
      },
      {
        path: 'fila-execucao',
        canActivate: [roleGuard],
        data: { roles: ['mecanico'], breadcrumb: 'Fila de execução' },
        loadComponent: () =>
          import('./features/execution/presentation').then(({ ExecutionQueue }) => ExecutionQueue),
        title: 'Fila de execução | Oficina SOAT',
      },
      {
        path: 'execucoes/:execucaoId',
        canActivate: [roleGuard],
        data: { roles: ['mecanico'], breadcrumb: 'Execução' },
        loadComponent: () =>
          import('./features/execution/presentation').then(
            ({ ExecutionDetail }) => ExecutionDetail,
          ),
        title: 'Execução da oficina | Oficina SOAT',
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
