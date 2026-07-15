import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { ApiError } from '../../../core/http/api-error';
import { publicRequestContext } from '../../../core/http/request-context';
import {
  AuthenticationError,
  type AuthenticationFailureReason,
  type AuthGateway,
  type AuthSession,
  type EmitirTokenCommand,
} from '../application';
import type { TokenResponse } from './generated/types.gen';

@Injectable({ providedIn: 'root' })
export class AuthApiAdapter implements AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async emitirToken(command: EmitirTokenCommand): Promise<AuthSession> {
    const headers = command.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': command.correlationId })
      : undefined;
    let data: TokenResponse;
    try {
      data = await firstValueFrom(
        this.http.post<TokenResponse>(
          `${this.config.authBaseUrl}/auth/token`,
          { cpf: command.cpf, password: command.password },
          {
            context: publicRequestContext(),
            ...(headers ? { headers } : {}),
          },
        ),
      );
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw new AuthenticationError(this.failureReason(error), error.correlationId);
      }
      throw new AuthenticationError('SERVICE_UNAVAILABLE', null);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresInSeconds: data.expires_in,
    };
  }

  private failureReason(error: ApiError): AuthenticationFailureReason {
    if (error.reason?.startsWith('CPF inválido') || error.status === 400) return 'INVALID_INPUT';
    if (error.reason === 'Usuário inativo') return 'ACCOUNT_UNAVAILABLE';
    if (error.status === 401) return 'INVALID_CREDENTIALS';
    return 'SERVICE_UNAVAILABLE';
  }
}
