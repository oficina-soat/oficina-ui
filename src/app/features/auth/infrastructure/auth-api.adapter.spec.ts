import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthApiAdapter } from './auth-api.adapter';

describe('AuthApiAdapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('mapeia o contrato de token sem expor o DTO', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ access_token: 'jwt', token_type: 'Bearer', expires_in: 900 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const session = await new AuthApiAdapter({
      apiBaseUrl: 'https://api.example/api/v1',
      authBaseUrl: 'https://auth.example',
    }).emitirToken({ cpf: '12345678901', password: 'segredo', correlationId: 'corr-1' });

    expect(session).toEqual({ accessToken: 'jwt', tokenType: 'Bearer', expiresInSeconds: 900 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
