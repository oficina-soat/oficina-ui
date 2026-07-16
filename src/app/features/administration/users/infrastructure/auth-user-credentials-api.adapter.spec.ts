import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RUNTIME_CONFIG } from '../../../../core/config/runtime-config';
import { AuthUserCredentialsApiAdapter } from './auth-user-credentials-api.adapter';

describe('AuthUserCredentialsApiAdapter', () => {
  let http: HttpTestingController;
  let adapter: AuthUserCredentialsApiAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: RUNTIME_CONFIG,
          useValue: { apiBaseUrl: '', authBaseUrl: 'https://auth.example' },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    adapter = TestBed.inject(AuthUserCredentialsApiAdapter);
  });

  afterEach(() => http.verify());

  it('mapeia somente metadados sanitizados da credencial', async () => {
    const result = adapter.get('user/1');
    http.expectOne('https://auth.example/auth/usuarios/user%2F1/credencial').flush({
      status: 'ATIVACAO_PENDENTE',
      expiresAt: '2026-07-17T00:00:00Z',
      acoesPermitidas: ['SOLICITAR_ATIVACAO'],
    });
    await expect(result).resolves.toEqual({
      status: 'ATIVACAO_PENDENTE',
      expiresAt: '2026-07-17T00:00:00Z',
      allowedActions: ['SOLICITAR_ATIVACAO'],
    });
  });

  it('mantém o segredo de ativação restrito à resposta do comando', async () => {
    const result = adapter.requestActivation('user-1');
    const request = http.expectOne('https://auth.example/auth/usuarios/user-1/ativacao');
    expect(request.request.method).toBe('POST');
    request.flush({ token: 'single-use-secret', expiresAt: '2026-07-17T00:00:00Z' });
    await expect(result).resolves.toEqual({
      activationToken: 'single-use-secret',
      expiresAt: '2026-07-17T00:00:00Z',
    });
  });
});
