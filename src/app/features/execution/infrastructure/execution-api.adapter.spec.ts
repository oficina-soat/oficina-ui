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
});
