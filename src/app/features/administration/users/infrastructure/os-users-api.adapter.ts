import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RUNTIME_CONFIG } from '../../../../core/config/runtime-config';
import { idempotentCommandContext } from '../../../../core/http/request-context';
import type {
  CreateUserCommand,
  ListUsersQuery,
  OperationalUser,
  OperationalUsersGateway,
  UpdateUserCommand,
  UserPage,
  UserStateCommand,
} from '../application';
import type {
  PageResponse,
  Usuario,
  UsuarioCreateRequest,
  UsuarioUpdateRequest,
} from './generated/os/types.gen';
import { mapOperationalUser, mapUserPage } from './user-administration.mappers';

type UserPageResponse = PageResponse & { readonly items: readonly Usuario[] };

@Injectable({ providedIn: 'root' })
export class OsUsersApiAdapter implements OperationalUsersGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async list(query: ListUsersQuery): Promise<UserPage> {
    let params = new HttpParams();
    const values: readonly (readonly [string, string | number | undefined])[] = [
      ['page', query.page],
      ['size', query.size],
      ['nome', query.name],
      ['documento', query.document],
      ['status', query.status],
      ['papel', query.role],
    ];
    for (const [name, value] of values) {
      if (value !== undefined && value !== '') params = params.set(name, String(value));
    }
    const response = await firstValueFrom(
      this.http.get<UserPageResponse>(`${this.config.apiBaseUrl}/usuarios`, { params }),
    );
    return mapUserPage(response);
  }

  async get(userId: string): Promise<OperationalUser> {
    const response = await firstValueFrom(
      this.http.get<Usuario>(`${this.config.apiBaseUrl}/usuarios/${encodeURIComponent(userId)}`),
    );
    return mapOperationalUser(response);
  }

  async create(command: CreateUserCommand): Promise<OperationalUser> {
    const body: UsuarioCreateRequest = {
      nome: command.name,
      documento: command.document,
      papeis: [...command.roles],
    };
    const response = await firstValueFrom(
      this.http.post<Usuario>(`${this.config.apiBaseUrl}/usuarios`, body, {
        context: idempotentCommandContext(command.idempotencyKey),
      }),
    );
    return mapOperationalUser(response);
  }

  async update(command: UpdateUserCommand): Promise<OperationalUser> {
    const body: UsuarioUpdateRequest = {
      nome: command.name,
      documento: command.document,
      papeis: [...command.roles],
    };
    const response = await firstValueFrom(
      this.http.put<Usuario>(
        `${this.config.apiBaseUrl}/usuarios/${encodeURIComponent(command.userId)}`,
        body,
      ),
    );
    return mapOperationalUser(response);
  }

  block(command: UserStateCommand): Promise<OperationalUser> {
    return this.changeState(command, 'bloqueio');
  }

  reactivate(command: UserStateCommand): Promise<OperationalUser> {
    return this.changeState(command, 'reativacao');
  }

  async inactivate(userId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.config.apiBaseUrl}/usuarios/${encodeURIComponent(userId)}`),
    );
  }

  private async changeState(
    command: UserStateCommand,
    action: 'bloqueio' | 'reativacao',
  ): Promise<OperationalUser> {
    const response = await firstValueFrom(
      this.http.post<Usuario>(
        `${this.config.apiBaseUrl}/usuarios/${encodeURIComponent(command.userId)}/${action}`,
        null,
        { context: idempotentCommandContext(command.idempotencyKey) },
      ),
    );
    return mapOperationalUser(response);
  }
}
