import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  LIST_CLIENTS,
  LIST_WORK_ORDERS,
  type WorkOrderSummary,
} from '../features/attendance/public-api';
import { Alert, Loading } from '../shared/ui';

const stateLabels: Readonly<Record<WorkOrderSummary['state'], string>> = {
  RECEBIDA: 'Recebida',
  EM_DIAGNOSTICO: 'Em diagnóstico',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  EM_EXECUCAO: 'Em execução',
  FINALIZADA: 'Finalizada',
  ENTREGUE: 'Entregue',
};

@Component({
  selector: 'app-dashboard',
  imports: [Alert, Loading, RouterLink],
  template: `
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header>
        <p class="eyebrow">Oficina SOAT</p>
        <h1 id="dashboard-title">Visão operacional</h1>
        <p>Acompanhe os dados disponíveis e acesse os fluxos da oficina.</p>
      </header>

      @if (loading()) {
        <app-loading label="Carregando visão operacional" />
      } @else {
        @if (partialFailure()) {
          <app-alert title="Alguns dados não puderam ser carregados" tone="warning">
            <p>Os atalhos continuam disponíveis. Atualize a página para tentar novamente.</p>
          </app-alert>
        }

        <div class="summary" aria-label="Resumo operacional">
          <article>
            <span>Clientes</span>
            <strong>{{ clientCount() ?? '—' }}</strong>
            <a routerLink="/clientes">Consultar clientes</a>
          </article>
          <article>
            <span>Ordens de serviço</span>
            <strong>{{ workOrderCount() ?? '—' }}</strong>
            <a routerLink="/ordens-servico">Consultar ordens</a>
          </article>
        </div>

        <section class="recent" aria-labelledby="recent-title">
          <div class="section-heading">
            <h2 id="recent-title">Ordens recentes</h2>
            <a routerLink="/ordens-servico">Ver todas</a>
          </div>
          @if (recentOrders().length === 0) {
            <p>Nenhuma ordem disponível para exibição.</p>
          } @else {
            <ul>
              @for (order of recentOrders(); track order.id) {
                <li>
                  <a [routerLink]="['/ordens-servico', order.id]">
                    <span>OS {{ order.id.slice(0, 8) }}</span>
                    <strong>{{ stateLabel(order.state) }}</strong>
                    <small>{{ order.problemDescription }}</small>
                  </a>
                </li>
              }
            </ul>
          }
        </section>
      }
    </section>
  `,
  styles: `
    .dashboard {
      display: grid;
      gap: var(--space-8);
    }
    header h1,
    header p {
      margin-block: 0 var(--space-2);
    }
    .eyebrow {
      color: var(--color-brand-600);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-4);
    }
    .summary article {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-6);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .summary strong {
      color: var(--color-brand-700);
      font-size: 2.5rem;
    }
    .recent {
      padding: var(--space-6);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }
    .recent ul {
      display: grid;
      gap: var(--space-2);
      padding: 0;
      list-style: none;
    }
    .recent li a {
      display: grid;
      grid-template-columns: 10rem 12rem minmax(0, 1fr);
      gap: var(--space-3);
      padding: var(--space-3);
      color: inherit;
      border-bottom: 1px solid var(--color-neutral-300);
      text-decoration: none;
    }
    @media (width <= 48rem) {
      .summary {
        grid-template-columns: 1fr;
      }
      .recent li a {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly listClients = inject(LIST_CLIENTS);
  private readonly listWorkOrders = inject(LIST_WORK_ORDERS);
  protected readonly loading = signal(false);
  protected readonly partialFailure = signal(false);
  protected readonly clientCount = signal<number | null>(null);
  protected readonly workOrderCount = signal<number | null>(null);
  protected readonly recentOrders = signal<readonly WorkOrderSummary[]>([]);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const [clients, workOrders] = await Promise.allSettled([
      this.listClients.execute({ page: 0, size: 1 }),
      this.listWorkOrders.execute({ page: 0, size: 3 }),
    ]);
    if (clients.status === 'fulfilled') this.clientCount.set(clients.value.totalItems);
    if (workOrders.status === 'fulfilled') {
      this.workOrderCount.set(workOrders.value.totalItems);
      this.recentOrders.set(workOrders.value.items);
    }
    this.partialFailure.set(clients.status === 'rejected' || workOrders.status === 'rejected');
    this.loading.set(false);
  }

  protected stateLabel(state: WorkOrderSummary['state']): string {
    return stateLabels[state];
  }
}
