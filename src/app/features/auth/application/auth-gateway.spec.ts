import { describe, expect, it, vi } from 'vitest';

import type { AuthGateway, AuthSessionPort } from './auth-gateway';
import { AuthenticateUser, LogoutUser } from './auth-gateway';

describe('casos de uso de autenticação', () => {
  it('inicia a sessão somente depois de receber o token canônico', async () => {
    const gateway: AuthGateway = {
      emitirToken: vi.fn().mockResolvedValue({
        accessToken: 'jwt',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
      }),
    };
    const session: AuthSessionPort = { start: vi.fn(), clear: vi.fn() };

    await new AuthenticateUser(gateway, session).execute({
      cpf: '84191404067',
      password: 'secret',
    });

    expect(session.start).toHaveBeenCalledWith({
      accessToken: 'jwt',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
    });
  });

  it('delega o logout ao port de sessão', () => {
    const session: AuthSessionPort = { start: vi.fn(), clear: vi.fn() };
    new LogoutUser(session).execute();
    expect(session.clear).toHaveBeenCalledOnce();
  });
});
