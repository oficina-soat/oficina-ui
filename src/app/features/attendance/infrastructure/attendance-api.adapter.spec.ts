import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { AttendanceApiAdapter } from './attendance-api.adapter';

describe('AttendanceApiAdapter', () => {
  let httpTesting: HttpTestingController;
  let adapter: AttendanceApiAdapter;

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
    adapter = TestBed.inject(AttendanceApiAdapter);
  });

  it('mapeia a página de clientes para o modelo da aplicação', async () => {
    const result = adapter.consultarClientes({ page: 0, size: 20 });
    const request = httpTesting.expectOne('https://api.example/api/v1/clientes?page=0&size=20');
    request.flush({
      items: [
        {
          clienteId: 'cliente-1',
          nome: 'Ana',
          documento: '12345678901',
          criadoEm: '2026-07-15T12:00:00Z',
          atualizadoEm: '2026-07-15T12:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    });

    const page = await result;
    expect(page.items).toEqual([{ id: 'cliente-1', nome: 'Ana', documento: '12345678901' }]);
    expect(page.totalItems).toBe(1);
  });
});
