import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { apiErrorInterceptor, idempotencyInterceptor } from '../../../core/http/api.interceptors';
import { ExecutionApiAdapter } from './execution-api.adapter';

describe('ExecutionApiAdapter', () => {
  let httpTesting: HttpTestingController;
  let adapter: ExecutionApiAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor, apiErrorInterceptor])),
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
    httpTesting = TestBed.inject(HttpTestingController);
    adapter = TestBed.inject(ExecutionApiAdapter);
  });

  it('preserva o estado canônico retornado para a fila', async () => {
    const result = adapter.consultarFila();
    httpTesting.expectOne('https://api.example/api/v1/execucoes/fila').flush([
      {
        execucaoId: 'execucao-1',
        ordemServicoId: 'os-1',
        status: 'CRIADA',
        prioridade: 10,
        posicao: 1,
        criadoEm: '2026-07-15T12:00:00Z',
        atualizadoEm: '2026-07-15T12:00:00Z',
      },
    ]);

    await expect(result).resolves.toEqual([
      {
        id: 'execucao-1',
        ordemServicoId: 'os-1',
        status: 'CRIADA',
        prioridade: 10,
        posicao: 1,
        criadoEm: '2026-07-15T12:00:00Z',
      },
    ]);
  });

  it('consulta e executa comandos idempotentes sem decidir transições', async () => {
    const getResult = adapter.consultarExecucao('execucao/1');
    httpTesting.expectOne('https://api.example/api/v1/execucoes/execucao%2F1').flush({
      execucaoId: 'execucao-1',
      ordemServicoId: 'os-1',
      status: 'CRIADA',
      prioridade: 10,
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T12:00:00Z',
      acoesPermitidas: ['INICIAR_DIAGNOSTICO', 'CANCELAR'],
    });
    await expect(getResult).resolves.toMatchObject({
      id: 'execucao-1',
      status: 'CRIADA',
      allowedActions: ['INICIAR_DIAGNOSTICO', 'CANCELAR'],
    });

    const commandResult = adapter.concluirDiagnostico({
      id: 'execucao/1',
      idempotencyKey: 'diagnosis-key-123',
      notes: 'Correia danificada',
    });
    const request = httpTesting.expectOne(
      'https://api.example/api/v1/execucoes/execucao%2F1/diagnostico/conclusao',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Idempotency-Key')).toBe('diagnosis-key-123');
    expect(request.request.body).toEqual({ diagnostico: 'Correia danificada' });
    request.flush({
      execucaoId: 'execucao-1',
      ordemServicoId: 'os-1',
      status: 'DIAGNOSTICO_CONCLUIDO',
      prioridade: 10,
      diagnostico: 'Correia danificada',
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T13:00:00Z',
      acoesPermitidas: ['INICIAR_REPARO', 'CANCELAR'],
    });
    await expect(commandResult).resolves.toMatchObject({
      status: 'DIAGNOSTICO_CONCLUIDO',
      diagnostico: 'Correia danificada',
      allowedActions: ['INICIAR_REPARO', 'CANCELAR'],
    });

    const cancelResult = adapter.cancelar({
      id: 'execucao/1',
      idempotencyKey: 'cancel-key-123',
      notes: 'Cliente desistiu',
    });
    const cancelRequest = httpTesting.expectOne(
      'https://api.example/api/v1/execucoes/execucao%2F1/cancelamento',
    );
    expect(cancelRequest.request.headers.get('X-Idempotency-Key')).toBe('cancel-key-123');
    expect(cancelRequest.request.body).toEqual({ motivo: 'Cliente desistiu' });
    cancelRequest.flush({
      execucaoId: 'execucao-1',
      ordemServicoId: 'os-1',
      status: 'CANCELADA',
      prioridade: 10,
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T14:00:00Z',
      acoesPermitidas: [],
    });
    await expect(cancelResult).resolves.toMatchObject({
      status: 'CANCELADA',
      allowedActions: [],
    });
  });

  it('mapeia catálogo, saldo, movimentos e entrada preservando ações canônicas', async () => {
    const servicesResult = adapter.consultarServicos({ name: 'revisão', size: 50 });
    const servicesRequest = httpTesting.expectOne((request) => request.url.endsWith('/servicos'));
    expect(servicesRequest.request.params.get('nome')).toBe('revisão');
    expect(servicesRequest.request.params.get('ativo')).toBe('true');
    servicesRequest.flush({
      items: [{ servicoId: 'servico-1', nome: 'Revisão', valorBase: 150, ativo: true }],
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
    });
    await expect(servicesResult).resolves.toMatchObject({
      items: [{ id: 'servico-1', name: 'Revisão', basePrice: 150, active: true }],
    });

    const partsResult = adapter.consultarPecas({ name: 'bateria', page: 0 });
    const partsRequest = httpTesting.expectOne((request) => request.url.endsWith('/pecas'));
    expect(partsRequest.request.params.get('nome')).toBe('bateria');
    partsRequest.flush({
      items: [
        {
          pecaId: 'peca-1',
          nome: 'Bateria',
          codigo: 'BAT',
          valorUnitario: 300,
          ativo: true,
          criadoEm: '2026-01-01T00:00:00Z',
          atualizadoEm: '2026-01-01T00:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });
    await expect(partsResult).resolves.toMatchObject({
      items: [{ id: 'peca-1', code: 'BAT' }],
      totalElements: 1,
    });

    const balanceResult = adapter.consultarSaldo('peca-1');
    httpTesting.expectOne('https://api.example/api/v1/estoques/pecas/peca-1/saldo').flush({
      pecaId: 'peca-1',
      quantidadeDisponivel: 4,
      quantidadeReservada: 1,
      atualizadoEm: '2026-01-01T00:00:00Z',
      acoesPermitidas: ['REGISTRAR_ENTRADA'],
    });
    await expect(balanceResult).resolves.toMatchObject({
      available: 4,
      allowedActions: ['REGISTRAR_ENTRADA'],
    });

    const movementsResult = adapter.consultarMovimentos({ partId: 'peca-1', type: 'ENTRADA' });
    const movementsRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/estoques/movimentos'),
    );
    expect(movementsRequest.request.params.get('tipo')).toBe('ENTRADA');
    movementsRequest.flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    await expect(movementsResult).resolves.toMatchObject({ items: [] });

    const entryResult = adapter.registrarEntrada({
      partId: 'peca-1',
      quantity: 3,
      idempotencyKey: 'entry-key-123',
    });
    const entryRequest = httpTesting.expectOne(
      'https://api.example/api/v1/estoques/movimentos/entrada',
    );
    expect(entryRequest.request.headers.get('X-Idempotency-Key')).toBe('entry-key-123');
    entryRequest.flush({
      movimentoId: 'mov-1',
      pecaId: 'peca-1',
      tipo: 'ENTRADA',
      quantidade: 3,
      criadoEm: '2026-01-01T00:00:00Z',
    });
    await expect(entryResult).resolves.toMatchObject({ id: 'mov-1', type: 'ENTRADA' });
  });
});
