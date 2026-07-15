import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { apiErrorInterceptor } from '../../../core/http/api.interceptors';
import { AuthenticationError } from '../application';
import { AuthApiAdapter } from './auth-api.adapter';

describe('AuthApiAdapter', () => {
  let httpTesting: HttpTestingController;
  let adapter: AuthApiAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
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
    adapter = TestBed.inject(AuthApiAdapter);
  });

  it('mapeia o contrato de token sem expor o DTO', async () => {
    const result = adapter.emitirToken({
      cpf: '12345678901',
      password: 'segredo',
      correlationId: 'corr-1',
    });
    const request = httpTesting.expectOne('https://auth.example/auth/token');
    expect(request.request.headers.get('X-Correlation-Id')).toBe('corr-1');
    request.flush({ access_token: 'jwt', token_type: 'Bearer', expires_in: 900 });

    await expect(result).resolves.toEqual({
      accessToken: 'jwt',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
    });
  });

  it('mapeia conta inativa, bloqueada ou sem credencial para indisponível', async () => {
    const result = adapter.emitirToken({ cpf: '12345678901', password: 'segredo' });
    httpTesting
      .expectOne('https://auth.example/auth/token')
      .flush(
        { message: 'Credenciais inválidas', motivo: 'Usuário inativo' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expect(result).rejects.toEqual(new AuthenticationError('ACCOUNT_UNAVAILABLE', null));
  });
});
