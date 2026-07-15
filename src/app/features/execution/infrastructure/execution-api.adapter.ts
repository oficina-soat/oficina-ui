import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { ApiError } from '../../../core/http/api-error';
import { idempotentCommandContext } from '../../../core/http/request-context';
import {
  ExecutionOperationError,
  type ConsultarFilaQuery,
  type ExecutionCommand,
  type ExecutionDetails,
  type ExecutionFailureReason,
  type ExecutionGateway,
  type FilaExecucao,
} from '../application';
import type {
  ConsultarFilaExecucaoResponse,
  Execucao,
  FilaExecucaoItem,
} from './generated/types.gen';

const mapFila = (item: FilaExecucaoItem): FilaExecucao => ({
  id: item.execucaoId,
  ordemServicoId: item.ordemServicoId,
  status: item.status,
  ...(item.prioridade === undefined ? {} : { prioridade: item.prioridade }),
  posicao: item.posicao,
  criadoEm: item.criadoEm,
});

const mapExecution = (item: Execucao): ExecutionDetails => ({
  id: item.execucaoId,
  ordemServicoId: item.ordemServicoId,
  status: item.status,
  prioridade: item.prioridade ?? 100,
  ...(item.diagnostico === undefined ? {} : { diagnostico: item.diagnostico }),
  ...(item.observacoesReparo === undefined ? {} : { observacoesReparo: item.observacoesReparo }),
  criadoEm: item.criadoEm,
  atualizadoEm: item.atualizadoEm,
  allowedActions: item.acoesPermitidas,
});

@Injectable({ providedIn: 'root' })
export class ExecutionApiAdapter implements ExecutionGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async consultarFila(query: ConsultarFilaQuery = {}): Promise<readonly FilaExecucao[]> {
    const params = query.status ? new HttpParams().set('status', query.status) : undefined;
    const headers = query.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': query.correlationId })
      : undefined;
    try {
      const data = await firstValueFrom(
        this.http.get<ConsultarFilaExecucaoResponse>(`${this.config.apiBaseUrl}/execucoes/fila`, {
          ...(params ? { params } : {}),
          ...(headers ? { headers } : {}),
        }),
      );
      return data.map(mapFila);
    } catch (error: unknown) {
      throw this.executionError(error);
    }
  }

  async consultarExecucao(id: string): Promise<ExecutionDetails> {
    try {
      return mapExecution(
        await firstValueFrom(
          this.http.get<Execucao>(`${this.config.apiBaseUrl}/execucoes/${encodeURIComponent(id)}`),
        ),
      );
    } catch (error: unknown) {
      throw this.executionError(error);
    }
  }

  iniciarDiagnostico(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.executeCommand(command, 'diagnostico/inicio', {});
  }
  concluirDiagnostico(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.executeCommand(
      command,
      'diagnostico/conclusao',
      command.notes ? { diagnostico: command.notes } : {},
    );
  }
  iniciarReparo(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.executeCommand(command, 'reparo/inicio', {});
  }
  concluirReparo(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.executeCommand(
      command,
      'reparo/conclusao',
      command.notes ? { observacoes: command.notes } : {},
    );
  }
  cancelar(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.executeCommand(
      command,
      'cancelamento',
      command.notes ? { motivo: command.notes } : {},
    );
  }

  private async executeCommand(
    command: ExecutionCommand,
    path: string,
    body: object,
  ): Promise<ExecutionDetails> {
    try {
      return mapExecution(
        await firstValueFrom(
          this.http.post<Execucao>(
            `${this.config.apiBaseUrl}/execucoes/${encodeURIComponent(command.id)}/${path}`,
            body,
            { context: idempotentCommandContext(command.idempotencyKey) },
          ),
        ),
      );
    } catch (error: unknown) {
      throw this.executionError(error);
    }
  }

  private executionError(error: unknown): ExecutionOperationError {
    if (!(error instanceof ApiError))
      return new ExecutionOperationError('SERVICE_UNAVAILABLE', null);
    const reasons: Readonly<Record<number, ExecutionFailureReason>> = {
      400: 'INVALID_INPUT',
      401: 'UNAUTHENTICATED',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
    };
    return new ExecutionOperationError(
      error.status === 0 || error.status >= 500
        ? 'SERVICE_UNAVAILABLE'
        : (reasons[error.status] ?? 'UNKNOWN'),
      error.correlationId,
    );
  }
}
