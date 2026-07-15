import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { ExecutionApiAdapter } from './execution-api.adapter';

describe('ExecutionApiAdapter', () => {
  let httpTesting: HttpTestingController;
  let adapter: ExecutionApiAdapter;

  beforeEach(() => {
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
});
