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

export interface ConsultarFilaQuery {
  readonly status?: ExecutionStatus;
  readonly correlationId?: string;
}

export interface ExecutionGateway {
  consultarFila(query?: ConsultarFilaQuery): Promise<readonly FilaExecucao[]>;
}

export type ExecutionFailureReason =
  'INVALID_INPUT' | 'UNAUTHENTICATED' | 'SERVICE_UNAVAILABLE' | 'UNKNOWN';

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
