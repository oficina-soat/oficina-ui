import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { ApiError } from '../../../core/http/api-error';
import { idempotentCommandContext } from '../../../core/http/request-context';
import {
  ClientOperationError,
  type ClientFailureReason,
  type AttendanceGateway,
  type ClienteResumo,
  type ConsultarClientesQuery,
  type CriarClienteCommand,
  type Pagina,
} from '../application';
import type { Cliente, ConsultarClientesResponse } from './generated/types.gen';

const mapCliente = (cliente: Cliente): ClienteResumo => ({
  id: cliente.clienteId,
  nome: cliente.nome,
  documento: cliente.documento,
  ...(cliente.telefone === undefined ? {} : { telefone: cliente.telefone }),
  ...(cliente.email === undefined ? {} : { email: cliente.email }),
});

@Injectable({ providedIn: 'root' })
export class AttendanceApiAdapter implements AttendanceGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async consultarClientes(query: ConsultarClientesQuery = {}): Promise<Pagina<ClienteResumo>> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    const headers = query.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': query.correlationId })
      : undefined;
    let data: ConsultarClientesResponse;
    try {
      data = await firstValueFrom(
        this.http.get<ConsultarClientesResponse>(`${this.config.apiBaseUrl}/clientes`, {
          params,
          ...(headers ? { headers } : {}),
        }),
      );
    } catch (error: unknown) {
      throw this.clientError(error);
    }

    return {
      items: (data.items ?? []).map(mapCliente),
      page: data.page,
      size: data.size,
      totalItems: data.totalItems,
      totalPages: data.totalPages,
    };
  }

  async criarCliente(command: CriarClienteCommand): Promise<ClienteResumo> {
    const headers = command.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': command.correlationId })
      : undefined;
    try {
      const data = await firstValueFrom(
        this.http.post<Cliente>(
          `${this.config.apiBaseUrl}/clientes`,
          {
            nome: command.nome,
            documento: command.documento,
            ...(command.telefone === undefined ? {} : { telefone: command.telefone }),
            ...(command.email === undefined ? {} : { email: command.email }),
          },
          {
            context: idempotentCommandContext(command.idempotencyKey),
            ...(headers ? { headers } : {}),
          },
        ),
      );
      return mapCliente(data);
    } catch (error: unknown) {
      throw this.clientError(error);
    }
  }

  private clientError(error: unknown): ClientOperationError {
    if (!(error instanceof ApiError)) return new ClientOperationError('SERVICE_UNAVAILABLE', null);
    const reasons: Readonly<Record<number, ClientFailureReason>> = {
      400: 'INVALID_INPUT',
      401: 'UNAUTHENTICATED',
      409: 'DUPLICATE',
    };
    return new ClientOperationError(
      error.status === 0 || error.status >= 500
        ? 'SERVICE_UNAVAILABLE'
        : (reasons[error.status] ?? 'UNKNOWN'),
      error.correlationId,
      error.details.map((detail) => detail.message),
    );
  }
}
