import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import type {
  AttendanceGateway,
  ClienteResumo,
  ConsultarClientesQuery,
  Pagina,
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
    const data = await firstValueFrom(
      this.http.get<ConsultarClientesResponse>(`${this.config.apiBaseUrl}/clientes`, {
        params,
        ...(headers ? { headers } : {}),
      }),
    );

    return {
      items: (data.items ?? []).map(mapCliente),
      page: data.page,
      size: data.size,
      totalItems: data.totalItems,
      totalPages: data.totalPages,
    };
  }
}
