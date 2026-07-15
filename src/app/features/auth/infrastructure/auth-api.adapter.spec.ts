import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { apiErrorInterceptor } from '../../../core/http/api.interceptors';
import { SKIP_AUTH } from '../../../core/http/request-context';
import { AuthenticationError, CredentialActivationError } from '../application';
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

  it('gera token de ativação em chamada autenticada', async () => {
    const result = adapter.solicitarAtivacao({ userId: 'usuario/1', correlationId: 'corr-2' });
    const request = httpTesting.expectOne(
      'https://auth.example/auth/usuarios/usuario%2F1/ativacao',
    );
    expect(request.request.context.get(SKIP_AUTH)).toBe(false);
    expect(request.request.headers.get('X-Correlation-Id')).toBe('corr-2');
    request.flush({ token: 'token-unico', expiresAt: '2026-07-15T18:00:00Z' });

    await expect(result).resolves.toEqual({
      token: 'token-unico',
      expiresAt: '2026-07-15T18:00:00Z',
    });
  });

  it('conclui ativação como chamada pública', async () => {
    const result = adapter.ativarCredencial({ token: 'token-unico', password: 'senha-segura' });
    const request = httpTesting.expectOne('https://auth.example/auth/ativacoes');
    expect(request.request.body).toEqual({ token: 'token-unico', password: 'senha-segura' });
    expect(request.request.context.get(SKIP_AUTH)).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(result).resolves.toBeUndefined();
  });

  it('mapeia token de ativação inválido sem expor o motivo do backend', async () => {
    const result = adapter.ativarCredencial({ token: 'token-invalido', password: 'senha-segura' });
    httpTesting
      .expectOne('https://auth.example/auth/ativacoes')
      .flush(
        { message: 'Requisição inválida', motivo: 'Token expirado' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expect(result).rejects.toEqual(new CredentialActivationError('INVALID_INPUT', null));
  });
});
