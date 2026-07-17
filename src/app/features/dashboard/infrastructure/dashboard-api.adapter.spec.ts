import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { DashboardApiAdapter } from './dashboard-api.adapter';

describe('DashboardApiAdapter', () => {
  it('consulta e mapeia os snapshots sem recalcular ou reordenar dados', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RUNTIME_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example/api/v1',
            authBaseUrl: 'https://auth.example',
          },
        },
      ],
    });
    const adapter = TestBed.inject(DashboardApiAdapter);
    const http = TestBed.inject(HttpTestingController);
    const ordersPromise = adapter.workOrders();
    http.expectOne('https://api.example/api/v1/dashboard/ordens-servico').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      refreshAfterSeconds: 30,
      contagensPorEstado: [{ estado: 'RECEBIDA', quantidade: 4 }],
      atencoes: [
        {
          ordemServicoId: 'os-1',
          estado: 'RECEBIDA',
          descricaoProblema: 'Ruído',
          entrouNoEstadoEm: '2026-07-17T11:00:00Z',
          acoesPermitidas: [],
        },
      ],
    });
    expect(await ordersPromise).toMatchObject({
      counts: [{ key: 'RECEBIDA', quantity: 4 }],
      attentions: [{ id: 'os-1', description: 'Ruído' }],
    });

    const executionPromise = adapter.execution();
    http.expectOne('https://api.example/api/v1/dashboard/execucao').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      contagensPorStatus: [],
      totalFila: 1,
      proximasExecucoes: [
        {
          execucaoId: 'ex-1',
          ordemServicoId: 'os-1',
          status: 'CRIADA',
          prioridade: 1,
          posicao: 1,
          criadoEm: '2026-07-17T10:00:00Z',
          atualizadoEm: '2026-07-17T10:00:00Z',
          acoesPermitidas: [],
        },
      ],
      estoqueAtencoes: [
        {
          pecaId: 'part-1',
          nome: 'Filtro',
          saldoAtual: 1,
          limiteReposicao: 2,
          atualizadoEm: '2026-07-17T10:00:00Z',
        },
      ],
    });
    const execution = await executionPromise;
    expect(execution.nextExecutions[0]).toMatchObject({ id: 'ex-1', position: 1 });
    expect(execution.stockAttentions[0]).toEqual({
      id: 'part-1',
      name: 'Filtro',
      balance: 1,
      threshold: 2,
    });

    const billingPromise = adapter.billing();
    http.expectOne('https://api.example/api/v1/dashboard/faturamento').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      contagensOrcamentos: [],
      contagensPagamentos: [],
      atencoes: [
        {
          tipo: 'PAGAMENTO',
          ordemServicoId: 'os-1',
          referenciaId: 'payment-1',
          status: 'RECUSADO',
          valor: 150,
          atualizadoEm: '2026-07-17T11:00:00Z',
          acoesPermitidas: [],
        },
      ],
    });
    expect((await billingPromise).attentions[0]).toMatchObject({
      type: 'PAGAMENTO',
      referenceId: 'payment-1',
      value: 150,
    });

    const usersPromise = adapter.users();
    http.expectOne('https://api.example/api/v1/dashboard/usuarios').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      contagensPorStatus: [],
      atencoes: [
        {
          usuarioId: 'user-1',
          nome: 'Maria',
          status: 'BLOQUEADO',
          atualizadoEm: '2026-07-17T11:00:00Z',
          acoesPermitidas: ['REATIVAR'],
        },
      ],
    });
    expect((await usersPromise).attentions[0]).toMatchObject({ id: 'user-1', name: 'Maria' });

    const credentialsPromise = adapter.credentials();
    http.expectOne('https://auth.example/auth/dashboard/credenciais').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      contagensPorStatus: [],
      atencoes: [
        {
          usuarioId: 'user-1',
          status: 'ATIVACAO_PENDENTE',
          atualizadoEm: '2026-07-17T11:00:00Z',
          acoesPermitidas: [],
        },
      ],
    });
    expect((await credentialsPromise).attentions[0]).toMatchObject({
      id: 'user-1',
      status: 'ATIVACAO_PENDENTE',
    });
    http.verify();
  });
});
