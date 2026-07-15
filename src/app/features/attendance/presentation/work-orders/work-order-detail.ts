import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Alert, Loading } from '../../../../shared/ui';
import type { WorkOrderSummary } from '../../application';
import { GET_WORK_ORDER, WorkOrderOperationError } from '../../public-api';
import { workOrderStateLabels } from './work-orders';

@Component({
  selector: 'app-work-order-detail',
  imports: [Alert, DatePipe, Loading, RouterLink],
  template: `
    <section class="order-detail" aria-labelledby="order-title">
      <a routerLink="/ordens-servico">← Voltar para ordens</a>
      <h1 id="order-title">Ordem de serviço</h1>
      @if (loading()) {
        <app-loading label="Carregando ordem de serviço" />
      }
      @if (failure()) {
        <app-alert title="Não foi possível consultar" tone="danger"
          ><p>{{ failure() }}</p></app-alert
        >
      }
      @if (order(); as item) {
        <dl>
          <div>
            <dt>Identificador</dt>
            <dd>{{ item.id }}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{{ stateLabel(item.state) }}</dd>
          </div>
          <div>
            <dt>Problema relatado</dt>
            <dd>{{ item.problemDescription }}</dd>
          </div>
          <div>
            <dt>Criada em</dt>
            <dd>{{ item.createdAt | date: 'dd/MM/yyyy HH:mm:ss' }}</dd>
          </div>
        </dl>
        <app-alert title="Detalhes operacionais" tone="info"
          ><p>
            Histórico e ações da ordem serão adicionados na próxima tarefa, sempre conforme
            respostas aceitas pela API.
          </p></app-alert
        >
      }
    </section>
  `,
  styles: `
    .order-detail {
      display: grid;
      gap: var(--space-6);
    }
    dl {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-6);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }
    dl div {
      display: grid;
      grid-template-columns: minmax(8rem, 12rem) 1fr;
      gap: var(--space-3);
    }
    dt {
      font-weight: 700;
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderDetail implements OnInit {
  private readonly get = inject(GET_WORK_ORDER);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('ordemServicoId');
  protected readonly order = signal<WorkOrderSummary | null>(null);
  protected readonly loading = signal(false);
  protected readonly failure = signal<string | null>(null);
  ngOnInit(): void {
    void this.load();
  }
  private async load(): Promise<void> {
    if (!this.id) {
      this.failure.set('Identificador da ordem não informado.');
      return;
    }
    this.loading.set(true);
    try {
      this.order.set(await this.get.execute(this.id));
    } catch (error: unknown) {
      this.failure.set(
        error instanceof WorkOrderOperationError && error.reason === 'NOT_FOUND'
          ? 'Ordem de serviço não encontrada.'
          : 'Não foi possível consultar a ordem.',
      );
    } finally {
      this.loading.set(false);
    }
  }
  protected stateLabel(state: WorkOrderSummary['state']): string {
    return workOrderStateLabels[state];
  }
}
