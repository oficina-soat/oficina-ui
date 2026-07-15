import type { RuntimeConfig } from '../../../core/config/runtime-config';
import { requestJson } from '../../../core/http/http-client';
import type { AuthGateway, AuthSession, EmitirTokenCommand } from '../application';
import type { TokenResponse } from './generated/types.gen';

export class AuthApiAdapter implements AuthGateway {
  constructor(private readonly config: RuntimeConfig) {}

  async emitirToken(command: EmitirTokenCommand): Promise<AuthSession> {
    const data = await requestJson<TokenResponse>(`${this.config.authBaseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(command.correlationId ? { 'X-Correlation-Id': command.correlationId } : {}),
      },
      body: JSON.stringify({ cpf: command.cpf, password: command.password }),
    });

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresInSeconds: data.expires_in,
    };
  }
}
