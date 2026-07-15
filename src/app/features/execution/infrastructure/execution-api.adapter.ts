import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { ApiError } from '../../../core/http/api-error';
import {
  ExecutionOperationError,
  type ConsultarFilaQuery,
  type ExecutionFailureReason,
  type ExecutionGateway,
  type FilaExecucao,
} from '../application';
import type { ConsultarFilaExecucaoResponse, FilaExecucaoItem } from './generated/types.gen';

const mapFila = (item: FilaExecucaoItem): FilaExecucao => ({
  id: item.execucaoId,
  ordemServicoId: item.ordemServicoId,
  status: item.status,
  ...(item.prioridade === undefined ? {} : { prioridade: item.prioridade }),
  posicao: item.posicao,
  criadoEm: item.criadoEm,
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
      if (!(error instanceof ApiError))
        throw new ExecutionOperationError('SERVICE_UNAVAILABLE', null);
      const reasons: Readonly<Record<number, ExecutionFailureReason>> = {
        400: 'INVALID_INPUT',
        401: 'UNAUTHENTICATED',
      };
      throw new ExecutionOperationError(
        error.status === 0 || error.status >= 500
          ? 'SERVICE_UNAVAILABLE'
          : (reasons[error.status] ?? 'UNKNOWN'),
        error.correlationId,
      );
    }
  }
}
