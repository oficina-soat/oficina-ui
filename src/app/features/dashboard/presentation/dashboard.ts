import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { SessionStore } from '../../../core/auth/session.store';
import { Alert, Loading } from '../../../shared/ui';
import type { DashboardBlock, DashboardResult } from '../application';
import { LOAD_OPERATIONAL_DASHBOARD } from '../dashboard.providers';

const labels: Readonly<Record<string, string>> = {
  RECEBIDA: 'Recebida',
  EM_DIAGNOSTICO: 'Em diagnóstico',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  EM_EXECUCAO: 'Em execução',
  FINALIZADA: 'Finalizada',
  ENTREGUE: 'Entregue',
  CRIADA: 'Criada',
  DIAGNOSTICO_CONCLUIDO: 'Diagnóstico concluído',
  EM_REPARO: 'Em reparo',
  REPARO_CONCLUIDO: 'Reparo concluído',
  CANCELADA: 'Cancelada',
  GERADO: 'Gerado',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  CRIADO: 'Criado',
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
  NAO_ATIVADA: 'Não ativada',
  ATIVACAO_PENDENTE: 'Ativação pendente',
  ATIVA: 'Ativa',
  ORCAMENTO: 'Orçamento',
  PAGAMENTO: 'Pagamento',
};

@Component({
  selector: 'app-operational-dashboard',
  imports: [Alert, CurrencyPipe, DatePipe, Loading, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly loadDashboard = inject(LOAD_OPERATIONAL_DASHBOARD);
  private readonly session = inject(SessionStore);
  protected readonly loading = signal(false);
  protected readonly data = signal<DashboardResult>({});
  protected readonly hasData = computed(() => Object.keys(this.data()).length > 0);
  private readonly unavailable = signal<readonly DashboardBlock[]>([]);
  protected readonly expected = computed<readonly DashboardBlock[]>(() => {
    const roles = this.session.identity()?.roles ?? [];
    return [
      'workOrders',
      ...(roles.some((role) => role === 'administrativo' || role === 'mecanico')
        ? (['execution'] as const)
        : []),
      ...(roles.some((role) => role === 'administrativo' || role === 'recepcionista')
        ? (['billing'] as const)
        : []),
      ...(roles.includes('administrativo') ? (['users', 'credentials'] as const) : []),
    ];
  });
  protected readonly failedBlocks = this.unavailable.asReadonly();

  ngOnInit(): void {
    void this.refresh();
  }

  protected async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.loadDashboard.execute(this.session.identity()?.roles ?? []);
      this.unavailable.set(this.expected().filter((block) => result[block] === undefined));
      this.data.update((current) => ({ ...current, ...result }));
    } finally {
      this.loading.set(false);
    }
  }

  protected label(value: string): string {
    return labels[value] ?? value.replaceAll('_', ' ');
  }
  protected shortId(value: string): string {
    return value.slice(0, 8);
  }
}
