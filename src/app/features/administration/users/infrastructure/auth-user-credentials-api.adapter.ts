import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RUNTIME_CONFIG } from '../../../../core/config/runtime-config';
import type { CredentialActivation, UserCredential, UserCredentialsGateway } from '../application';
import type { AtivacaoTokenResponse, CredencialStatusResponse } from './generated/auth/types.gen';
import { mapUserCredential } from './user-administration.mappers';

@Injectable({ providedIn: 'root' })
export class AuthUserCredentialsApiAdapter implements UserCredentialsGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async get(userId: string): Promise<UserCredential> {
    const response = await firstValueFrom(
      this.http.get<CredencialStatusResponse>(
        `${this.config.authBaseUrl}/auth/usuarios/${encodeURIComponent(userId)}/credencial`,
      ),
    );
    return mapUserCredential(response);
  }

  async requestActivation(userId: string): Promise<CredentialActivation> {
    const response = await firstValueFrom(
      this.http.post<AtivacaoTokenResponse>(
        `${this.config.authBaseUrl}/auth/usuarios/${encodeURIComponent(userId)}/ativacao`,
        null,
      ),
    );
    return { activationToken: response.token, expiresAt: response.expiresAt };
  }
}
