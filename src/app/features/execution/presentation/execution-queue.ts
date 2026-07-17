import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Alert, DataTable, EmptyState, Loading } from '../../../shared/ui';
import {
  ExecutionOperationError,
  LIST_EXECUTION_QUEUE,
  type ExecutionStatus,
  type FilaExecucao,
} from '../public-api';

const statusLabels: Readonly<Record<ExecutionStatus, string>> = {
  CRIADA: 'Criada',
  EM_DIAGNOSTICO: 'Em diagnóstico',
  DIAGNOSTICO_CONCLUIDO: 'Diagnóstico concluído',
  EM_REPARO: 'Em reparo',
  REPARO_CONCLUIDO: 'Reparo concluído',
  CANCELADA: 'Cancelada',
};

const failureMessages = {
  INVALID_INPUT: 'O filtro informado não foi aceito.',
  UNAUTHENTICATED: 'Sua sessão expirou.',
  NOT_FOUND: 'A fila solicitada não foi encontrada.',
  CONFLICT: 'A fila não pôde ser consultada neste momento.',
  SERVICE_UNAVAILABLE: 'O serviço de execução está indisponível.',
  UNKNOWN: 'Não foi possível consultar a fila.',
} as const;

@Component({
  selector: 'app-execution-queue',
  imports: [Alert, DataTable, DatePipe, EmptyState, Loading, ReactiveFormsModule, RouterLink],
  template: `
    <section class="queue" aria-labelledby="queue-title">
      <header>
        <p class="eyebrow">Execução</p>
        <h1 id="queue-title">Fila do mecânico</h1>
        <p>A ordem e as posições são definidas pelo serviço de execução.</p>
      </header>

      <form class="controls" [formGroup]="filters" (ngSubmit)="load()">
        <div>
          <label for="execution-status">Status</label>
          <select id="execution-status" formControlName="status">
            <option value="">Pendências padrão da API</option>
            @for (status of statuses; track status[0]) {
              <option [value]="status[0]">{{ status[1] }}</option>
            }
          </select>
        </div>
        <button class="ui-button ui-button--secondary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Atualizando…' : 'Atualizar fila' }}
        </button>
      </form>

      @if (failure()) {
        <app-alert title="Não foi possível consultar a fila" tone="danger">
          <p>{{ failure() }}</p>
          @if (correlationId()) {
            <p>Referência: {{ correlationId() }}</p>
          }
        </app-alert>
      }
      @if (loading() && entries().length === 0) {
        <app-loading label="Carregando fila de execução" />
      } @else if (entries().length === 0 && !failure()) {
        <app-empty-state
          title="Fila vazia"
          description="Não há execuções para o filtro informado."
        />
      } @else if (entries().length > 0) {
        @if (loading()) {
          <app-loading label="Atualizando fila de execução" />
        }
        <app-data-table label="Fila de execução">
          <table>
            <thead>
              <tr>
                <th scope="col">Posição</th>
                <th scope="col">Prioridade</th>
                <th scope="col">OS</th>
                <th scope="col">Status</th>
                <th scope="col">Entrada</th>
                <th scope="col">Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.id) {
                <tr>
                  <td>{{ entry.posicao }}</td>
                  <td>{{ entry.prioridade ?? '—' }}</td>
                  <td>{{ shortId(entry.ordemServicoId) }}</td>
                  <td>{{ statusLabel(entry.status) }}</td>
                  <td>{{ entry.criadoEm | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td><a [routerLink]="['/execucoes', entry.id]">Atender</a></td>
                </tr>
              }
            </tbody>
          </table>
        </app-data-table>
      }
    </section>
  `,
  styles: `
    .queue {
      display: grid;
      gap: var(--space-6);
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
    .controls {
      display: flex;
      align-items: end;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }
    .controls div {
      display: grid;
      gap: var(--space-2);
    }
    label {
      font-weight: 700;
    }
    select {
      min-height: 2.75rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--color-neutral-500);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
    }
    @media (width <= 48rem) {
      .controls {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionQueue implements OnInit {
  private readonly list = inject(LIST_EXECUTION_QUEUE);
  protected readonly entries = signal<readonly FilaExecucao[]>([]);
  protected readonly loading = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  protected readonly statuses = Object.entries(statusLabels) as readonly [
    ExecutionStatus,
    string,
  ][];
  readonly filters = new FormGroup({
    status: new FormControl<ExecutionStatus | ''>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.failure.set(null);
    this.correlationId.set(null);
    const status = this.filters.controls.status.value;
    try {
      this.entries.set(await this.list.execute(status ? { status } : {}));
    } catch (error: unknown) {
      const failure =
        error instanceof ExecutionOperationError
          ? error
          : new ExecutionOperationError('UNKNOWN', null);
      this.failure.set(failureMessages[failure.reason]);
      this.correlationId.set(failure.correlationId);
    } finally {
      this.loading.set(false);
    }
  }

  protected statusLabel(status: ExecutionStatus): string {
    return statusLabels[status];
  }
  protected shortId(id: string): string {
    return id.slice(0, 8);
  }
}
