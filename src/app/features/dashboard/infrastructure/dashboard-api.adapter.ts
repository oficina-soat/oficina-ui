import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import type {
  BillingSnapshot,
  CredentialsSnapshot,
  DashboardGateway,
  ExecutionSnapshot,
  SnapshotMetadata,
  UsersSnapshot,
  WorkOrdersSnapshot,
} from '../application';
import type { DashboardCredenciaisResponse } from './generated/auth/types.gen';
import type { DashboardFaturamentoResponse } from './generated/billing/types.gen';
import type { DashboardExecucaoResponse } from './generated/execution/types.gen';
import type {
  DashboardOrdensServicoResponse,
  DashboardUsuariosResponse,
} from './generated/os/types.gen';

@Injectable({ providedIn: 'root' })
export class DashboardApiAdapter implements DashboardGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async workOrders(): Promise<WorkOrdersSnapshot> {
    const data = await firstValueFrom(
      this.http.get<DashboardOrdensServicoResponse>(
        `${this.config.apiBaseUrl}/dashboard/ordens-servico`,
      ),
    );
    return {
      ...metadata(data),
      counts: data.contagensPorEstado.map((item) => ({
        key: item.estado,
        quantity: item.quantidade,
      })),
      attentions: data.atencoes.map((item) => ({
        id: item.ordemServicoId,
        state: item.estado,
        description: item.descricaoProblema,
        enteredStateAt: item.entrouNoEstadoEm,
      })),
    };
  }

  async execution(): Promise<ExecutionSnapshot> {
    const data = await firstValueFrom(
      this.http.get<DashboardExecucaoResponse>(`${this.config.apiBaseUrl}/dashboard/execucao`),
    );
    return {
      ...metadata(data),
      queueTotal: data.totalFila,
      counts: data.contagensPorStatus.map((item) => ({
        key: item.status,
        quantity: item.quantidade,
      })),
      nextExecutions: data.proximasExecucoes.map((item) => ({
        id: item.execucaoId,
        workOrderId: item.ordemServicoId,
        status: item.status,
        position: item.posicao,
      })),
      stockAttentions: data.estoqueAtencoes.map((item) => ({
        id: item.pecaId,
        name: item.nome,
        balance: item.saldoAtual,
        threshold: item.limiteReposicao,
      })),
    };
  }

  async billing(): Promise<BillingSnapshot> {
    const data = await firstValueFrom(
      this.http.get<DashboardFaturamentoResponse>(
        `${this.config.apiBaseUrl}/dashboard/faturamento`,
      ),
    );
    return {
      ...metadata(data),
      budgetCounts: data.contagensOrcamentos.map((item) => ({
        key: item.status,
        quantity: item.quantidade,
      })),
      paymentCounts: data.contagensPagamentos.map((item) => ({
        key: item.status,
        quantity: item.quantidade,
      })),
      attentions: data.atencoes.map((item) => ({
        type: item.tipo,
        workOrderId: item.ordemServicoId,
        referenceId: item.referenciaId,
        status: item.status,
        value: item.valor,
        updatedAt: item.atualizadoEm,
      })),
    };
  }

  async users(): Promise<UsersSnapshot> {
    const data = await firstValueFrom(
      this.http.get<DashboardUsuariosResponse>(`${this.config.apiBaseUrl}/dashboard/usuarios`),
    );
    return {
      ...metadata(data),
      counts: data.contagensPorStatus.map((item) => ({
        key: item.status,
        quantity: item.quantidade,
      })),
      attentions: data.atencoes.map((item) => ({
        id: item.usuarioId,
        name: item.nome,
        status: item.status,
        updatedAt: item.atualizadoEm,
      })),
    };
  }

  async credentials(): Promise<CredentialsSnapshot> {
    const data = await firstValueFrom(
      this.http.get<DashboardCredenciaisResponse>(
        `${this.config.authBaseUrl}/auth/dashboard/credenciais`,
      ),
    );
    return {
      ...metadata(data),
      counts: data.contagensPorStatus.map((item) => ({
        key: item.status,
        quantity: item.quantidade,
      })),
      attentions: data.atencoes.map((item) => ({
        id: item.usuarioId,
        status: item.status,
        updatedAt: item.atualizadoEm,
      })),
    };
  }
}

const metadata = (data: {
  generatedAt: string;
  dataAsOf: string;
  refreshAfterSeconds?: number;
}): SnapshotMetadata => ({
  generatedAt: data.generatedAt,
  dataAsOf: data.dataAsOf,
  ...(data.refreshAfterSeconds === undefined
    ? {}
    : { refreshAfterSeconds: data.refreshAfterSeconds }),
});
