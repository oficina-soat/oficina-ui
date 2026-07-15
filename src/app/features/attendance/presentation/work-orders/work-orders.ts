import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Alert, DataTable, EmptyState, Loading, Pagination } from '../../../../shared/ui';
import type { Pagina, WorkOrderState, WorkOrderSummary } from '../../application';
import {
  LIST_WORK_ORDERS,
  WorkOrderOperationError,
  type WorkOrderFailureReason,
} from '../../public-api';

export const workOrderStateLabels: Readonly<Record<WorkOrderState, string>> = {
  RECEBIDA: 'Recebida',
  EM_DIAGNOSTICO: 'Em diagnóstico',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  EM_EXECUCAO: 'Em execução',
  FINALIZADA: 'Finalizada',
  ENTREGUE: 'Entregue',
};

const errorMessages: Readonly<Record<WorkOrderFailureReason, string>> = {
  INVALID_INPUT: 'O filtro informado não foi aceito.',
  CONFLICT: 'A operação entrou em conflito.',
  NOT_FOUND: 'A ordem de serviço não foi encontrada.',
  UNAUTHENTICATED: 'Sua sessão expirou.',
  SERVICE_UNAVAILABLE: 'O serviço de ordens está indisponível.',
  UNKNOWN: 'Não foi possível consultar as ordens.',
};

@Component({
  selector: 'app-work-orders',
  imports: [Alert, DataTable, EmptyState, Loading, Pagination, ReactiveFormsModule, RouterLink],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrders implements OnInit {
  private readonly list = inject(LIST_WORK_ORDERS);
  protected readonly page = signal<Pagina<WorkOrderSummary> | null>(null);
  protected readonly loading = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  protected readonly states = Object.entries(workOrderStateLabels) as readonly [
    WorkOrderState,
    string,
  ][];
  readonly filters = new FormGroup({
    state: new FormControl<WorkOrderState | ''>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.load(0);
  }

  protected async load(page: number): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.failure.set(null);
    this.correlationId.set(null);
    try {
      const state = this.filters.controls.state.value;
      this.page.set(await this.list.execute({ page, size: 20, ...(state ? { state } : {}) }));
    } catch (error: unknown) {
      const failure =
        error instanceof WorkOrderOperationError
          ? error
          : new WorkOrderOperationError('UNKNOWN', null);
      this.failure.set(errorMessages[failure.reason]);
      this.correlationId.set(failure.correlationId);
    } finally {
      this.loading.set(false);
    }
  }

  protected stateLabel(state: WorkOrderState): string {
    return workOrderStateLabels[state];
  }
  protected shortId(id: string): string {
    return id.slice(0, 8);
  }
}
