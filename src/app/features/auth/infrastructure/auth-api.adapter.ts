import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { ApiError } from '../../../core/http/api-error';
import { publicRequestContext } from '../../../core/http/request-context';
import {
  AuthenticationError,
  type AuthenticationFailureReason,
  type ActivateCredentialCommand,
  type AuthGateway,
  type AuthSession,
  type CredentialActivation,
  CredentialActivationError,
  type CredentialActivationFailureReason,
  type EmitirTokenCommand,
  type RequestCredentialActivationCommand,
} from '../application';
import type { AtivacaoTokenResponse, TokenResponse } from './generated/types.gen';

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

  async solicitarAtivacao(
    command: RequestCredentialActivationCommand,
  ): Promise<CredentialActivation> {
    const headers = command.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': command.correlationId })
      : undefined;
    try {
      const data = await firstValueFrom(
        this.http.post<AtivacaoTokenResponse>(
          `${this.config.authBaseUrl}/auth/usuarios/${encodeURIComponent(command.userId)}/ativacao`,
          null,
          { ...(headers ? { headers } : {}) },
        ),
      );
      return { token: data.token, expiresAt: data.expiresAt };
    } catch (error: unknown) {
      throw this.activationError(error);
    }
  }

  async ativarCredencial(command: ActivateCredentialCommand): Promise<void> {
    const headers = command.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': command.correlationId })
      : undefined;
    try {
      await firstValueFrom(
        this.http.post<void>(
          `${this.config.authBaseUrl}/auth/ativacoes`,
          { token: command.token, password: command.password },
          {
            context: publicRequestContext(),
            ...(headers ? { headers } : {}),
          },
        ),
      );
    } catch (error: unknown) {
      throw this.activationError(error);
    }
  }

  private failureReason(error: ApiError): AuthenticationFailureReason {
    if (error.reason?.startsWith('CPF inválido') || error.status === 400) return 'INVALID_INPUT';
    if (error.reason === 'Usuário inativo') return 'ACCOUNT_UNAVAILABLE';
    if (error.status === 401) return 'INVALID_CREDENTIALS';
    return 'SERVICE_UNAVAILABLE';
  }

  private activationError(error: unknown): CredentialActivationError {
    if (!(error instanceof ApiError)) {
      return new CredentialActivationError('SERVICE_UNAVAILABLE', null);
    }
    const reasons: Readonly<Record<number, CredentialActivationFailureReason>> = {
      400: 'INVALID_INPUT',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'USER_NOT_FOUND',
      409: 'ACCOUNT_UNAVAILABLE',
    };
    return new CredentialActivationError(
      reasons[error.status] ?? 'SERVICE_UNAVAILABLE',
      error.correlationId,
    );
  }
}
