import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { publicRequestContext } from '../../../core/http/request-context';
import type { AuthGateway, AuthSession, EmitirTokenCommand } from '../application';
import type { TokenResponse } from './generated/types.gen';

@Injectable({ providedIn: 'root' })
export class AuthApiAdapter implements AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async emitirToken(command: EmitirTokenCommand): Promise<AuthSession> {
    const headers = command.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': command.correlationId })
      : undefined;
    const data = await firstValueFrom(
      this.http.post<TokenResponse>(
        `${this.config.authBaseUrl}/auth/token`,
        { cpf: command.cpf, password: command.password },
        {
          context: publicRequestContext(),
          ...(headers ? { headers } : {}),
        },
      ),
    );

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresInSeconds: data.expires_in,
    };
  }
}
