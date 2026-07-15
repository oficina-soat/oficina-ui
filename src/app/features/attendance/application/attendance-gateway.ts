export interface ClienteResumo {
  readonly id: string;
  readonly nome: string;
  readonly documento: string;
  readonly telefone?: string;
  readonly email?: string;
}

export interface VeiculoResumo {
  readonly id: string;
  readonly clienteId: string;
  readonly placa: string;
  readonly marca: string;
  readonly modelo: string;
  readonly ano?: number;
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

export interface CriarVeiculoCommand {
  readonly clienteId: string;
  readonly placa: string;
  readonly marca: string;
  readonly modelo: string;
  readonly ano?: number;
  readonly idempotencyKey: string;
}

export type VehicleFailureReason =
  | 'INVALID_INPUT'
  | 'DUPLICATE'
  | 'NOT_FOUND'
  | 'UNAUTHENTICATED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export class VehicleOperationError extends Error {
  constructor(
    readonly reason: VehicleFailureReason,
    readonly correlationId: string | null,
    readonly details: readonly string[] = [],
  ) {
    super(reason);
  }
}

export type WorkOrderState =
  | 'RECEBIDA'
  | 'EM_DIAGNOSTICO'
  | 'AGUARDANDO_APROVACAO'
  | 'EM_EXECUCAO'
  | 'FINALIZADA'
  | 'ENTREGUE';

export interface WorkOrderSummary {
  readonly id: string;
  readonly clienteId: string;
  readonly veiculoId: string;
  readonly problemDescription: string;
  readonly state: WorkOrderState;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListWorkOrdersQuery {
  readonly page?: number;
  readonly size?: number;
  readonly state?: WorkOrderState;
}

export interface OpenWorkOrderCommand {
  readonly clienteId: string;
  readonly veiculoId: string;
  readonly problemDescription: string;
  readonly idempotencyKey: string;
}

export type WorkOrderFailureReason =
  | 'INVALID_INPUT'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'UNAUTHENTICATED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export class WorkOrderOperationError extends Error {
  constructor(
    readonly reason: WorkOrderFailureReason,
    readonly correlationId: string | null,
    readonly details: readonly string[] = [],
  ) {
    super(reason);
  }
}

export interface AttendanceGateway {
  consultarClientes(query?: ConsultarClientesQuery): Promise<Pagina<ClienteResumo>>;
  criarCliente(command: CriarClienteCommand): Promise<ClienteResumo>;
  consultarCliente(clienteId: string): Promise<ClienteResumo>;
  consultarVeiculos(clienteId: string): Promise<readonly VeiculoResumo[]>;
  criarVeiculo(command: CriarVeiculoCommand): Promise<VeiculoResumo>;
  listarOrdensServico(query?: ListWorkOrdersQuery): Promise<Pagina<WorkOrderSummary>>;
  consultarOrdemServico(id: string): Promise<WorkOrderSummary>;
  abrirOrdemServico(command: OpenWorkOrderCommand): Promise<WorkOrderSummary>;
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

export interface ClientVehicles {
  readonly client: ClienteResumo;
  readonly vehicles: readonly VeiculoResumo[];
}

export class LoadClientVehicles {
  constructor(private readonly gateway: AttendanceGateway) {}

  async execute(clienteId: string): Promise<ClientVehicles> {
    const [client, vehicles] = await Promise.all([
      this.gateway.consultarCliente(clienteId),
      this.gateway.consultarVeiculos(clienteId),
    ]);
    return { client, vehicles };
  }
}

export class CreateVehicle {
  constructor(private readonly gateway: AttendanceGateway) {}

  execute(command: CriarVeiculoCommand): Promise<VeiculoResumo> {
    return this.gateway.criarVeiculo(command);
  }
}

export class ListWorkOrders {
  constructor(private readonly gateway: AttendanceGateway) {}
  execute(query: ListWorkOrdersQuery = {}): Promise<Pagina<WorkOrderSummary>> {
    return this.gateway.listarOrdensServico(query);
  }
}

export class GetWorkOrder {
  constructor(private readonly gateway: AttendanceGateway) {}
  execute(id: string): Promise<WorkOrderSummary> {
    return this.gateway.consultarOrdemServico(id);
  }
}

export class OpenWorkOrder {
  constructor(private readonly gateway: AttendanceGateway) {}
  execute(command: OpenWorkOrderCommand): Promise<WorkOrderSummary> {
    return this.gateway.abrirOrdemServico(command);
  }
}
