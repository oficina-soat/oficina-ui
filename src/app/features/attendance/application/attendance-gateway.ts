export interface ClienteResumo {
  readonly id: string;
  readonly nome: string;
  readonly documento: string;
  readonly telefone?: string;
  readonly email?: string;
}

export interface Pagina<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ConsultarClientesQuery {
  readonly page?: number;
  readonly size?: number;
  readonly correlationId?: string;
}

export interface CriarClienteCommand {
  readonly nome: string;
  readonly documento: string;
  readonly telefone?: string;
  readonly email?: string;
  readonly idempotencyKey: string;
  readonly correlationId?: string;
}

export type ClientFailureReason =
  'INVALID_INPUT' | 'DUPLICATE' | 'UNAUTHENTICATED' | 'SERVICE_UNAVAILABLE' | 'UNKNOWN';

export class ClientOperationError extends Error {
  constructor(
    readonly reason: ClientFailureReason,
    readonly correlationId: string | null,
    readonly details: readonly string[] = [],
  ) {
    super(reason);
  }
}

export interface AttendanceGateway {
  consultarClientes(query?: ConsultarClientesQuery): Promise<Pagina<ClienteResumo>>;
  criarCliente(command: CriarClienteCommand): Promise<ClienteResumo>;
}

export class ListClients {
  constructor(private readonly gateway: AttendanceGateway) {}

  execute(query: ConsultarClientesQuery = {}): Promise<Pagina<ClienteResumo>> {
    return this.gateway.consultarClientes(query);
  }
}

export class CreateClient {
  constructor(private readonly gateway: AttendanceGateway) {}

  execute(command: CriarClienteCommand): Promise<ClienteResumo> {
    return this.gateway.criarCliente(command);
  }
}
