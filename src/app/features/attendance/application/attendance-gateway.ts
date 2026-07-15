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

export interface AttendanceGateway {
  consultarClientes(query?: ConsultarClientesQuery): Promise<Pagina<ClienteResumo>>;
}
