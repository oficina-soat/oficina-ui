import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Alert, Confirmation, DataTable, FormField, Loading } from '../../../../shared/ui';
import type { WorkOrderHistoryEntry, WorkOrderState, WorkOrderSummary } from '../../application';
import {
  CANCEL_WORK_ORDER,
  CHANGE_WORK_ORDER_STATE,
  GET_WORK_ORDER,
  GET_WORK_ORDER_HISTORY,
  WorkOrderOperationError,
} from '../../public-api';
import { workOrderStateLabels } from './work-orders';

const commandMessages = {
  INVALID_INPUT: 'Revise os dados informados.',
  CONFLICT: 'A ação não é válida para o estado atual da OS.',
  NOT_FOUND: 'A ordem de serviço não foi encontrada.',
  UNAUTHENTICATED: 'Sua sessão expirou.',
  SERVICE_UNAVAILABLE: 'O serviço de ordens está indisponível.',
  UNKNOWN: 'Não foi possível executar a ação.',
} as const;

@Component({
  selector: 'app-work-order-detail',
  imports: [
    Alert,
    Confirmation,
    DataTable,
    DatePipe,
    FormField,
    Loading,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <section class="order-detail" aria-labelledby="order-title">
      <a routerLink="/ordens-servico">← Voltar para ordens</a>
      <h1 id="order-title">Ordem de serviço</h1>
      @if (loading()) {
        <app-loading label="Carregando ordem de serviço" />
      }
      @if (failure()) {
        <app-alert title="Não foi possível concluir a operação" tone="danger">
          <p>{{ failure() }}</p>
        </app-alert>
      }
      @if (success()) {
        <app-alert title="Operação concluída" tone="success">
          <p>{{ success() }}</p>
        </app-alert>
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

        <section aria-labelledby="history-title">
          <h2 id="history-title">Histórico</h2>
          @if (history().length === 0) {
            <p>Nenhum histórico disponível.</p>
          } @else {
            <app-data-table label="Histórico da ordem de serviço">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (entry of history(); track entry.occurredAt + entry.state) {
                    <tr>
                      <td>{{ entry.occurredAt | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                      <td>{{ stateLabel(entry.state) }}</td>
                      <td>{{ entry.reason ?? '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </app-data-table>
          }
        </section>

        <section class="actions" aria-labelledby="actions-title">
          <h2 id="actions-title">Ações da OS</h2>
          <p>A API valida se a ação é permitida para o estado atual.</p>
          <form [formGroup]="stateForm" (ngSubmit)="changeState()" novalidate>
            <app-form-field
              inputId="next-state"
              label="Novo estado"
              [required]="true"
              [error]="
                stateForm.controls.state.touched && stateForm.controls.state.invalid
                  ? 'Selecione um estado.'
                  : undefined
              "
            >
              <select id="next-state" formControlName="state">
                <option value="">Selecione</option>
                @for (state of states; track state[0]) {
                  @if (stateAllowed(state[0])) {
                    <option [value]="state[0]">{{ state[1] }}</option>
                  }
                }
              </select>
            </app-form-field>
            <app-form-field inputId="state-reason" label="Motivo">
              <input id="state-reason" formControlName="reason" />
            </app-form-field>
            <button class="ui-button ui-button--primary" type="submit" [disabled]="saving()">
              Alterar estado
            </button>
          </form>

          <div class="cancel-action" [hidden]="!item.allowedActions.includes('CANCELAR')">
            <app-form-field inputId="cancel-reason" label="Motivo do cancelamento">
              <input id="cancel-reason" [formControl]="cancelReason" />
            </app-form-field>
            <button
              class="ui-button ui-button--danger"
              type="button"
              [disabled]="saving()"
              (click)="confirmingCancel.set(true)"
            >
              Solicitar cancelamento
            </button>
          </div>
        </section>
      }
    </section>
    <app-confirmation
      [open]="confirmingCancel()"
      title="Cancelar ordem de serviço"
      description="A solicitação será enviada para processamento pelo backend. Deseja continuar?"
      confirmLabel="Solicitar cancelamento"
      (confirmed)="cancel()"
      (cancelled)="confirmingCancel.set(false)"
    />
  `,
  styles: `
    .order-detail {
      display: grid;
      gap: var(--space-6);
    }
    dl,
    .actions {
      display: grid;
      gap: var(--space-4);
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
    form,
    .cancel-action {
      display: grid;
      gap: var(--space-4);
      max-width: 40rem;
    }
    .cancel-action {
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-neutral-300);
    }
    .ui-button {
      justify-self: start;
    }
    @media (width <= 48rem) {
      dl div {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderDetail implements OnInit {
  private readonly get = inject(GET_WORK_ORDER);
  private readonly getHistory = inject(GET_WORK_ORDER_HISTORY);
  private readonly change = inject(CHANGE_WORK_ORDER_STATE);
  private readonly cancelOrder = inject(CANCEL_WORK_ORDER);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('ordemServicoId');
  protected readonly order = signal<WorkOrderSummary | null>(null);
  protected readonly history = signal<readonly WorkOrderHistoryEntry[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly confirmingCancel = signal(false);
  protected readonly states = Object.entries(workOrderStateLabels) as readonly [
    WorkOrderState,
    string,
  ][];
  readonly stateForm = new FormGroup({
    state: new FormControl<WorkOrderState | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reason: new FormControl('', { nonNullable: true }),
  });
  readonly cancelReason = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    void this.load();
  }

  protected async changeState(): Promise<void> {
    const id = this.id;
    if (!id || this.stateForm.invalid || this.saving()) {
      this.stateForm.markAllAsTouched();
      return;
    }
    const state = this.stateForm.controls.state.value;
    if (!state) return;
    await this.execute(async () => {
      this.order.set(
        await this.change.execute({
          id,
          state,
          idempotencyKey: crypto.randomUUID(),
          ...this.optionalReason(this.stateForm.controls.reason.value),
        }),
      );
      this.history.set(await this.getHistory.execute(id));
      this.stateForm.reset({ state: '', reason: '' });
      this.success.set('Estado atualizado conforme resposta da API.');
    });
  }

  protected async cancel(): Promise<void> {
    this.confirmingCancel.set(false);
    const id = this.id;
    if (!id || this.saving()) return;
    await this.execute(async () => {
      const operation = await this.cancelOrder.execute({
        id,
        idempotencyKey: crypto.randomUUID(),
        ...this.optionalReason(this.cancelReason.value),
      });
      this.cancelReason.reset('');
      this.success.set(
        `Cancelamento ${operation.status.toLocaleLowerCase('pt-BR')} para processamento.`,
      );
    });
  }

  private async load(): Promise<void> {
    if (!this.id) {
      this.failure.set('Identificador da ordem não informado.');
      return;
    }
    this.loading.set(true);
    try {
      const [order, history] = await Promise.all([
        this.get.execute(this.id),
        this.getHistory.execute(this.id),
      ]);
      this.order.set(order);
      this.history.set(history);
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.loading.set(false);
    }
  }

  private async execute(command: () => Promise<void>): Promise<void> {
    this.saving.set(true);
    this.failure.set(null);
    this.success.set(null);
    try {
      await command();
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.saving.set(false);
    }
  }

  private report(error: unknown): void {
    const failure =
      error instanceof WorkOrderOperationError
        ? error
        : new WorkOrderOperationError('UNKNOWN', null);
    this.failure.set(commandMessages[failure.reason]);
  }

  private optionalReason(value: string): { reason?: string } {
    const reason = value.trim();
    return reason ? { reason } : {};
  }

  protected stateLabel(state: WorkOrderState): string {
    return workOrderStateLabels[state];
  }

  protected stateAllowed(state: WorkOrderState): boolean {
    const actions = this.order()?.allowedActions ?? [];
    const required = {
      EM_DIAGNOSTICO: ['INICIAR_DIAGNOSTICO', 'RETOMAR_DIAGNOSTICO'],
      AGUARDANDO_APROVACAO: ['CONCLUIR_DIAGNOSTICO'],
      EM_EXECUCAO: ['INICIAR_EXECUCAO'],
      FINALIZADA: ['FINALIZAR'],
      ENTREGUE: ['ENTREGAR'],
      RECEBIDA: [],
    } as const;
    return required[state].some((action) => actions.includes(action));
  }
}
