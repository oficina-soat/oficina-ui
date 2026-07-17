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
  type MovementQuery,
  type Page,
  type StockBalance,
  type StockEntryCommand,
  type StockMovement,
  type StockPart,
  type StockQuery,
  type CatalogQuery,
  type CatalogService,
} from '../application';
import type {
  ConsultarFilaExecucaoResponse,
  Execucao,
  FilaExecucaoItem,
  MovimentoEstoque,
  MovimentoEstoquePage,
  Peca,
  PecaPage,
  Servico,
  ServicoPage,
  SaldoEstoque,
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
const mapPart = (item: Peca): StockPart => ({
  id: item.pecaId,
  name: item.nome,
  code: item.codigo,
  unitPrice: item.valorUnitario,
  active: item.ativo,
});
const mapService = (item: Servico): CatalogService => ({
  id: item.servicoId,
  name: item.nome,
  ...(item.descricao === undefined ? {} : { description: item.descricao }),
  basePrice: item.valorBase,
  active: item.ativo,
});
const mapBalance = (item: SaldoEstoque): StockBalance => ({
  partId: item.pecaId,
  available: item.quantidadeDisponivel,
  reserved: item.quantidadeReservada,
  updatedAt: item.atualizadoEm,
  allowedActions: item.acoesPermitidas,
});
const mapMovement = (item: MovimentoEstoque): StockMovement => ({
  id: item.movimentoId,
  partId: item.pecaId,
  ...(item.ordemServicoId ? { workOrderId: item.ordemServicoId } : {}),
  type: item.tipo,
  quantity: item.quantidade,
  ...(item.motivo ? { reason: item.motivo } : {}),
  createdAt: item.criadoEm,
});
const mapPage = <T, R>(
  page: { items: T[]; page: number; size: number; totalElements: number; totalPages: number },
  mapper: (item: T) => R,
): Page<R> => ({
  ...page,
  items: page.items.map(mapper),
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
  concluirReparo(command: ExecutionCommand): Promise<ExecutionDetails> {
    return this.executeCommand(
      command,
      'reparo/conclusao',
      command.notes ? { observacoes: command.notes } : {},
    );
  }
  async consultarServicos(query: CatalogQuery = {}): Promise<Page<CatalogService>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 20))
      .set('ativo', 'true');
    if (query.name) params = params.set('nome', query.name);
    try {
      return mapPage(
        await firstValueFrom(
          this.http.get<ServicoPage>(`${this.config.apiBaseUrl}/servicos`, { params }),
        ),
        mapService,
      );
    } catch (error: unknown) {
      throw this.executionError(error);
    }
  }

  async consultarPecas(query: StockQuery = {}): Promise<Page<StockPart>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 20));
    if (query.name) params = params.set('nome', query.name);
    if (query.code) params = params.set('codigo', query.code);
    if (query.active !== undefined) params = params.set('ativo', String(query.active));
    try {
      return mapPage(
        await firstValueFrom(
          this.http.get<PecaPage>(`${this.config.apiBaseUrl}/pecas`, { params }),
        ),
        mapPart,
      );
    } catch (error: unknown) {
      throw this.executionError(error);
    }
  }

  async consultarSaldo(partId: string): Promise<StockBalance> {
    try {
      return mapBalance(
        await firstValueFrom(
          this.http.get<SaldoEstoque>(
            `${this.config.apiBaseUrl}/estoques/pecas/${encodeURIComponent(partId)}/saldo`,
          ),
        ),
      );
    } catch (error: unknown) {
      throw this.executionError(error);
    }
  }

  async consultarMovimentos(query: MovementQuery): Promise<Page<StockMovement>> {
    let params = new HttpParams()
      .set('pecaId', query.partId)
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 20));
    if (query.type) params = params.set('tipo', query.type);
    try {
      return mapPage(
        await firstValueFrom(
          this.http.get<MovimentoEstoquePage>(`${this.config.apiBaseUrl}/estoques/movimentos`, {
            params,
          }),
        ),
        mapMovement,
      );
    } catch (error: unknown) {
      throw this.executionError(error);
    }
  }

  async registrarEntrada(command: StockEntryCommand): Promise<StockMovement> {
    try {
      return mapMovement(
        await firstValueFrom(
          this.http.post<MovimentoEstoque>(
            `${this.config.apiBaseUrl}/estoques/movimentos/entrada`,
            {
              pecaId: command.partId,
              quantidade: command.quantity,
              ...(command.reason ? { motivo: command.reason } : {}),
            },
            { context: idempotentCommandContext(command.idempotencyKey) },
          ),
        ),
      );
    } catch (error: unknown) {
      throw this.executionError(error);
    }
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
