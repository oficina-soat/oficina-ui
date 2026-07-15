import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionStore } from '../auth/session.store';
import type { ApiError } from './api-error';
import {
  apiErrorInterceptor,
  authInterceptor,
  correlationInterceptor,
  idempotencyInterceptor,
} from './api.interceptors';
import { idempotentCommandContext, publicRequestContext } from './request-context';

describe('interceptors HTTP', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([
            authInterceptor,
            correlationInterceptor,
            idempotencyInterceptor,
            apiErrorInterceptor,
          ]),
        ),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
  });

  it('propaga sessão em memória e gera correlação sem idempotência em leitura', () => {
    session.setAccessToken('jwt-operacional');
    http.get('/api/v1/clientes').subscribe();

    const request = httpTesting.expectOne('/api/v1/clientes');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-operacional');
    expect(request.request.headers.get('X-Correlation-Id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(request.request.headers.has('X-Idempotency-Key')).toBe(false);
    request.flush({});
  });

  it('preserva a chave criada para o comando mutável e permite requisição pública', () => {
    session.setAccessToken('jwt-operacional');
    const context = idempotentCommandContext('command-key-123');
    http.post('/api/v1/clientes', {}, { context }).subscribe();
    const command = httpTesting.expectOne('/api/v1/clientes');
    expect(command.request.headers.get('X-Idempotency-Key')).toBe('command-key-123');
    command.flush({});

    http.post('/auth/token', {}, { context: publicRequestContext() }).subscribe();
    const publicRequest = httpTesting.expectOne('/auth/token');
    expect(publicRequest.request.headers.has('Authorization')).toBe(false);
    publicRequest.flush({});
  });

  it('converte o erro canônico sem perder detalhes e correlação', async () => {
    const result = http.get('/api/v1/clientes');
    const promise = new Promise<ApiError>((resolve) => {
      result.subscribe({ error: (error: ApiError) => resolve(error) });
    });
    httpTesting.expectOne('/api/v1/clientes').flush(
      {
        code: 'VALIDATION_ERROR',
        message: 'Requisição inválida.',
        correlationId: 'corr-body',
        details: [{ field: 'documento', code: 'REQUIRED', message: 'Campo obrigatório.' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(promise).resolves.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Requisição inválida.',
      correlationId: 'corr-body',
      details: [{ field: 'documento', code: 'REQUIRED', message: 'Campo obrigatório.' }],
    });
  });
});
