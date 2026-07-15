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
}

export interface ConsultarFilaQuery {
  readonly status?: ExecutionStatus;
  readonly correlationId?: string;
}

export interface ExecutionCommand {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly notes?: string;
}

export interface ExecutionGateway {
  consultarFila(query?: ConsultarFilaQuery): Promise<readonly FilaExecucao[]>;
  consultarExecucao(id: string): Promise<ExecutionDetails>;
  iniciarDiagnostico(command: ExecutionCommand): Promise<ExecutionDetails>;
  concluirDiagnostico(command: ExecutionCommand): Promise<ExecutionDetails>;
  iniciarReparo(command: ExecutionCommand): Promise<ExecutionDetails>;
  concluirReparo(command: ExecutionCommand): Promise<ExecutionDetails>;
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
