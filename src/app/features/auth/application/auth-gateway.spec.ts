import { describe, expect, it, vi } from 'vitest';

import type { AuthGateway, AuthSessionPort } from './auth-gateway';
import {
  ActivateCredential,
  AuthenticateUser,
  LogoutUser,
  RequestCredentialActivation,
} from './auth-gateway';

const gateway = (overrides: Partial<AuthGateway> = {}): AuthGateway => ({
  emitirToken: vi.fn(),
  solicitarAtivacao: vi.fn(),
  ativarCredencial: vi.fn(),
  ...overrides,
});

describe('casos de uso de autenticação', () => {
  it('inicia a sessão somente depois de receber o token canônico', async () => {
    const authGateway = gateway({
      emitirToken: vi.fn().mockResolvedValue({
        accessToken: 'jwt',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
      }),
    });
    const session: AuthSessionPort = { start: vi.fn(), clear: vi.fn() };

    await new AuthenticateUser(authGateway, session).execute({
      cpf: '84191404067',
      password: 'secret',
    });

    expect(session.start).toHaveBeenCalledWith({
      accessToken: 'jwt',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
    });
  });

  it('delega a geração do token sem persistir o segredo', async () => {
    const authGateway = gateway({
      solicitarAtivacao: vi
        .fn()
        .mockResolvedValue({ token: 'segredo', expiresAt: '2026-07-15T18:00:00Z' }),
    });

    await expect(
      new RequestCredentialActivation(authGateway).execute({ userId: 'usuario-1' }),
    ).resolves.toEqual({ token: 'segredo', expiresAt: '2026-07-15T18:00:00Z' });
  });

  it('delega a conclusão da ativação ao backend', async () => {
    const authGateway = gateway({ ativarCredencial: vi.fn().mockResolvedValue(undefined) });
    const command = { token: 'token-de-ativacao', password: 'senha-segura' };

    await new ActivateCredential(authGateway).execute(command);

    expect(authGateway.ativarCredencial).toHaveBeenCalledWith(command);
  });

  it('delega o logout ao port de sessão', () => {
    const session: AuthSessionPort = { start: vi.fn(), clear: vi.fn() };
    new LogoutUser(session).execute();
    expect(session.clear).toHaveBeenCalledOnce();
  });
});
