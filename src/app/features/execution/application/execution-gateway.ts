export type ExecutionStatus =
  | 'CRIADA'
  | 'EM_DIAGNOSTICO'
  | 'DIAGNOSTICO_CONCLUIDO'
  | 'EM_REPARO'
  | 'REPARO_CONCLUIDO'
  | 'CANCELADA';

export interface FilaExecucao {
  readonly id: string;
  readonly ordemServicoId: string;
  readonly status: ExecutionStatus;
  readonly prioridade?: number;
  readonly posicao: number;
  readonly criadoEm: string;
}

export interface ExecutionDetails {
  readonly id: string;
  readonly ordemServicoId: string;
  readonly status: ExecutionStatus;
  readonly prioridade: number;
  readonly diagnostico?: string;
  readonly observacoesReparo?: string;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
  readonly allowedActions: readonly ExecutionAction[];
}
export type ExecutionAction =
  | 'INICIAR_DIAGNOSTICO'
  | 'CONCLUIR_DIAGNOSTICO'
  | 'INICIAR_REPARO'
  | 'CONCLUIR_REPARO'
  | 'CANCELAR';

export interface ConsultarFilaQuery {
  readonly status?: ExecutionStatus;
  readonly correlationId?: string;
}

export interface ExecutionCommand {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly notes?: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface StockPart {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly unitPrice: number;
  readonly active: boolean;
}
export interface CatalogService {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly basePrice: number;
  readonly active: boolean;
}
export interface CatalogQuery {
  readonly name?: string;
  readonly page?: number;
  readonly size?: number;
}
export type StockAction = 'REGISTRAR_ENTRADA';
export interface StockBalance {
  readonly partId: string;
  readonly available: number;
  readonly reserved: number;
  readonly updatedAt: string;
  readonly allowedActions: readonly StockAction[];
}
export type StockMovementType = 'ENTRADA' | 'RESERVA' | 'CONSUMO' | 'ESTORNO';
export interface StockMovement {
  readonly id: string;
  readonly partId: string;
  readonly workOrderId?: string;
  readonly type: StockMovementType;
  readonly quantity: number;
  readonly reason?: string;
  readonly createdAt: string;
}
export interface StockQuery {
  readonly name?: string;
  readonly code?: string;
  readonly page?: number;
  readonly size?: number;
  readonly active?: boolean;
}
export interface MovementQuery {
  readonly partId: string;
  readonly type?: StockMovementType;
  readonly page?: number;
  readonly size?: number;
}
export interface StockEntryCommand {
  readonly partId: string;
  readonly quantity: number;
  readonly reason?: string;
  readonly idempotencyKey: string;
}

export interface ExecutionGateway {
  consultarFila(query?: ConsultarFilaQuery): Promise<readonly FilaExecucao[]>;
  consultarExecucao(id: string): Promise<ExecutionDetails>;
  iniciarDiagnostico(command: ExecutionCommand): Promise<ExecutionDetails>;
  concluirDiagnostico(command: ExecutionCommand): Promise<ExecutionDetails>;
  iniciarReparo(command: ExecutionCommand): Promise<ExecutionDetails>;
  concluirReparo(command: ExecutionCommand): Promise<ExecutionDetails>;
  cancelar(command: ExecutionCommand): Promise<ExecutionDetails>;
  consultarServicos(query?: CatalogQuery): Promise<Page<CatalogService>>;
  consultarPecas(query?: StockQuery): Promise<Page<StockPart>>;
  consultarSaldo(partId: string): Promise<StockBalance>;
  consultarMovimentos(query: MovementQuery): Promise<Page<StockMovement>>;
  registrarEntrada(command: StockEntryCommand): Promise<StockMovement>;
}

export class ListCatalogServices {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(query: CatalogQuery = {}): Promise<Page<CatalogService>> {
    return this.gateway.consultarServicos(query);
  }
}

export class ListStockParts {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(query: StockQuery = {}): Promise<Page<StockPart>> {
    return this.gateway.consultarPecas(query);
  }
}
export class GetStockBalance {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(partId: string): Promise<StockBalance> {
    return this.gateway.consultarSaldo(partId);
  }
}
export class ListStockMovements {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(query: MovementQuery): Promise<Page<StockMovement>> {
    return this.gateway.consultarMovimentos(query);
  }
}
export class RegisterStockEntry {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(command: StockEntryCommand): Promise<StockMovement> {
    return this.gateway.registrarEntrada(command);
  }
}

export type ExecutionFailureReason =
  | 'INVALID_INPUT'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export class ExecutionOperationError extends Error {
  constructor(
    readonly reason: ExecutionFailureReason,
    readonly correlationId: string | null,
  ) {
    super(reason);
  }
}

export class ListExecutionQueue {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(query: ConsultarFilaQuery = {}): Promise<readonly FilaExecucao[]> {
    return this.gateway.consultarFila(query);
  }
}

export class GetExecution {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(id: string): Promise<ExecutionDetails> {
    return this.gateway.consultarExecucao(id);
  }
}

export class StartDiagnosis {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.gateway.iniciarDiagnostico(command);
  }
}

export class CompleteDiagnosis {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.gateway.concluirDiagnostico(command);
  }
}

export class StartRepair {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.gateway.iniciarReparo(command);
  }
}

export class CompleteRepair {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.gateway.concluirReparo(command);
  }
}

export class CancelExecution {
  constructor(private readonly gateway: ExecutionGateway) {}
  execute(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.gateway.cancelar(command);
  }
}
