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
      estoqueAtencoes: [],
    });
    expect((await executionPromise).nextExecutions[0]).toMatchObject({ id: 'ex-1', position: 1 });

    const billingPromise = adapter.billing();
    http.expectOne('https://api.example/api/v1/dashboard/faturamento').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      contagensOrcamentos: [],
      contagensPagamentos: [],
      atencoes: [],
    });
    expect((await billingPromise).attentions).toEqual([]);

    const usersPromise = adapter.users();
    http.expectOne('https://api.example/api/v1/dashboard/usuarios').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      contagensPorStatus: [],
      atencoes: [],
    });
    expect((await usersPromise).counts).toEqual([]);

    const credentialsPromise = adapter.credentials();
    http.expectOne('https://auth.example/auth/dashboard/credenciais').flush({
      generatedAt: '2026-07-17T12:00:01Z',
      dataAsOf: '2026-07-17T12:00:00Z',
      contagensPorStatus: [],
      atencoes: [],
    });
    expect((await credentialsPromise).counts).toEqual([]);
    http.verify();
  });
});
