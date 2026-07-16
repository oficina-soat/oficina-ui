import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadRuntimeConfig } from './runtime-config';

const respond = (body: unknown, status = 200): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
};

describe('runtime config', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('aceita somente endpoints relativos ou HTTPS contratados', async () => {
    respond({
      apiBaseUrl: 'https://api.example/api/v1',
      authBaseUrl: 'https://api.example',
      observability: {
        endpoint: 'https://telemetry.example/events',
        environment: 'lab',
        release: 'abc123',
      },
    });

    await expect(loadRuntimeConfig()).resolves.toEqual({
      apiBaseUrl: 'https://api.example/api/v1',
      authBaseUrl: 'https://api.example',
      observability: {
        endpoint: 'https://telemetry.example/events',
        environment: 'lab',
        release: 'abc123',
      },
    });
  });

  it.each([
    { apiBaseUrl: 'javascript:alert(1)', authBaseUrl: '' },
    { apiBaseUrl: '/api/v1', authBaseUrl: 'http://insecure.example' },
    { apiBaseUrl: '/api/v1', authBaseUrl: '', token: 'não permitido' },
    {
      apiBaseUrl: '/api/v1',
      authBaseUrl: '',
      observability: {
        endpoint: 'http://telemetry.example/events',
        environment: 'lab',
        release: 'abc123',
      },
    },
  ])('rejeita configuração insegura ou com campos adicionais', async (config) => {
    respond(config);
    await expect(loadRuntimeConfig()).rejects.toThrow('Configuração de runtime inválida.');
  });

  it('rejeita indisponibilidade sem expor o corpo da resposta', async () => {
    respond({ secret: 'não deve aparecer' }, 503);
    await expect(loadRuntimeConfig()).rejects.toThrow(
      'Configuração de runtime indisponível: HTTP 503',
    );
  });
});
