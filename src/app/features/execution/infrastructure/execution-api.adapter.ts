import type { RuntimeConfig } from '../../../core/config/runtime-config';
import { requestJson } from '../../../core/http/http-client';
import type { ConsultarFilaQuery, ExecutionGateway, FilaExecucao } from '../application';
import type { ConsultarFilaExecucaoResponse, FilaExecucaoItem } from './generated/types.gen';

const mapFila = (item: FilaExecucaoItem): FilaExecucao => ({
  id: item.execucaoId,
  ordemServicoId: item.ordemServicoId,
  status: item.status,
  ...(item.prioridade === undefined ? {} : { prioridade: item.prioridade }),
  posicao: item.posicao,
  criadoEm: item.criadoEm,
});

export class ExecutionApiAdapter implements ExecutionGateway {
  constructor(private readonly config: RuntimeConfig) {}

  async consultarFila(query: ConsultarFilaQuery = {}): Promise<readonly FilaExecucao[]> {
    const url = new URL(`${this.config.apiBaseUrl}/execucoes/fila`);
    if (query.status) url.searchParams.set('status', query.status);

    const data = await requestJson<ConsultarFilaExecucaoResponse>(url.toString(), {
      headers: {
        ...(query.correlationId ? { 'X-Correlation-Id': query.correlationId } : {}),
      },
    });
    return data.map(mapFila);
  }
}
