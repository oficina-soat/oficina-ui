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
