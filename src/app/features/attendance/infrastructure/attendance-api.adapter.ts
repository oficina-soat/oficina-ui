import type { RuntimeConfig } from '../../../core/config/runtime-config';
import { requestJson } from '../../../core/http/http-client';
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

export class AttendanceApiAdapter implements AttendanceGateway {
  constructor(private readonly config: RuntimeConfig) {}

  async consultarClientes(query: ConsultarClientesQuery = {}): Promise<Pagina<ClienteResumo>> {
    const url = new URL(`${this.config.apiBaseUrl}/clientes`);
    if (query.page !== undefined) url.searchParams.set('page', String(query.page));
    if (query.size !== undefined) url.searchParams.set('size', String(query.size));

    const data = await requestJson<ConsultarClientesResponse>(url.toString(), {
      headers: {
        ...(query.correlationId ? { 'X-Correlation-Id': query.correlationId } : {}),
      },
    });

    return {
      items: (data.items ?? []).map(mapCliente),
      page: data.page,
      size: data.size,
      totalItems: data.totalItems,
      totalPages: data.totalPages,
    };
  }
}
