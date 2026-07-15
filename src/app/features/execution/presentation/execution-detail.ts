import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Alert, FormField, Loading } from '../../../shared/ui';
import {
  CANCEL_EXECUTION,
  COMPLETE_DIAGNOSIS,
  COMPLETE_REPAIR,
  ExecutionOperationError,
  GET_EXECUTION,
  START_DIAGNOSIS,
  START_REPAIR,
  type ExecutionDetails,
  type ExecutionStatus,
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
  INVALID_INPUT: 'Revise as informações enviadas.',
  UNAUTHENTICATED: 'Sua sessão expirou.',
  NOT_FOUND: 'A execução não foi encontrada.',
  CONFLICT: 'A ação não é válida para o estado atual da execução.',
  SERVICE_UNAVAILABLE: 'O serviço de execução está indisponível.',
  UNKNOWN: 'Não foi possível executar a ação.',
} as const;

interface ExecutionAction {
  execute(command: {
    id: string;
    idempotencyKey: string;
    notes?: string;
  }): Promise<ExecutionDetails>;
}

@Component({
  selector: 'app-execution-detail',
  imports: [Alert, DatePipe, FormField, Loading, ReactiveFormsModule, RouterLink],
  template: `
    <section class="execution" aria-labelledby="execution-title">
      <a routerLink="/fila-execucao">← Voltar para fila</a>
      <h1 id="execution-title">Execução da oficina</h1>
      @if (loading()) {
        <app-loading label="Carregando execução" />
      }
      @if (failure()) {
        <app-alert title="Operação não concluída" tone="danger"
          ><p>{{ failure() }}</p></app-alert
        >
      }
      @if (success()) {
        <app-alert title="Operação concluída" tone="success"
          ><p>{{ success() }}</p></app-alert
        >
      }
      @if (execution(); as item) {
        <dl>
          <div>
            <dt>Execução</dt>
            <dd>{{ item.id }}</dd>
          </div>
          <div>
            <dt>Ordem de serviço</dt>
            <dd>
              <a [routerLink]="['/ordens-servico', item.ordemServicoId]">{{
                item.ordemServicoId
              }}</a>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ statusLabel(item.status) }}</dd>
          </div>
          <div>
            <dt>Prioridade</dt>
            <dd>{{ item.prioridade }}</dd>
          </div>
          <div>
            <dt>Atualizada em</dt>
            <dd>{{ item.atualizadoEm | date: 'dd/MM/yyyy HH:mm:ss' }}</dd>
          </div>
          @if (item.diagnostico) {
            <div>
              <dt>Diagnóstico</dt>
              <dd>{{ item.diagnostico }}</dd>
            </div>
          }
          @if (item.observacoesReparo) {
            <div>
              <dt>Observações do reparo</dt>
              <dd>{{ item.observacoesReparo }}</dd>
            </div>
          }
        </dl>

        @if (item.allowedActions.length > 0) {
          <section class="actions" aria-labelledby="actions-title">
            <h2 id="actions-title">Ações operacionais</h2>
            <p>A API valida cada comando conforme o estado atual.</p>
            @if (
              item.allowedActions.includes('INICIAR_DIAGNOSTICO') ||
              item.allowedActions.includes('CONCLUIR_DIAGNOSTICO')
            ) {
              <div class="action-group">
                <h3>Diagnóstico</h3>
                @if (item.allowedActions.includes('INICIAR_DIAGNOSTICO')) {
                  <button
                    class="ui-button ui-button--secondary"
                    type="button"
                    [disabled]="saving()"
                    (click)="run(startDiagnosis, 'Diagnóstico iniciado.')"
                  >
                    Iniciar diagnóstico
                  </button>
                }
                @if (item.allowedActions.includes('CONCLUIR_DIAGNOSTICO')) {
                  <app-form-field inputId="diagnosis-notes" label="Diagnóstico encontrado">
                    <textarea
                      id="diagnosis-notes"
                      rows="4"
                      [formControl]="diagnosisNotes"
                    ></textarea>
                  </app-form-field>
                  <button
                    class="ui-button ui-button--primary"
                    type="button"
                    [disabled]="saving()"
                    (click)="run(completeDiagnosis, 'Diagnóstico concluído.', diagnosisNotes.value)"
                  >
                    Concluir diagnóstico
                  </button>
                }
              </div>
            }
            @if (
              item.allowedActions.includes('INICIAR_REPARO') ||
              item.allowedActions.includes('CONCLUIR_REPARO')
            ) {
              <div class="action-group">
                <h3>Reparo</h3>
                @if (item.allowedActions.includes('INICIAR_REPARO')) {
                  <button
                    class="ui-button ui-button--secondary"
                    type="button"
                    [disabled]="saving()"
                    (click)="run(startRepair, 'Reparo iniciado.')"
                  >
                    Iniciar reparo
                  </button>
                }
                @if (item.allowedActions.includes('CONCLUIR_REPARO')) {
                  <app-form-field inputId="repair-notes" label="Observações do reparo">
                    <textarea id="repair-notes" rows="4" [formControl]="repairNotes"></textarea>
                  </app-form-field>
                  <button
                    class="ui-button ui-button--primary"
                    type="button"
                    [disabled]="saving()"
                    (click)="run(completeRepair, 'Reparo concluído.', repairNotes.value)"
                  >
                    Concluir reparo
                  </button>
                }
              </div>
            }
            @if (item.allowedActions.includes('CANCELAR')) {
              <div class="action-group">
                <h3>Cancelamento</h3>
                <app-form-field inputId="cancel-reason" label="Motivo do cancelamento">
                  <textarea id="cancel-reason" rows="3" [formControl]="cancelReason"></textarea>
                </app-form-field>
                <button
                  class="ui-button ui-button--danger"
                  type="button"
                  [disabled]="saving()"
                  (click)="run(cancelExecution, 'Execução cancelada.', cancelReason.value)"
                >
                  Cancelar execução
                </button>
              </div>
            }
          </section>
        }
      }
    </section>
  `,
  styles: `
    .execution {
      display: grid;
      gap: var(--space-6);
    }
    dl,
    .actions,
    .action-group {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-6);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }
    dl div {
      display: grid;
      grid-template-columns: minmax(9rem, 13rem) 1fr;
      gap: var(--space-3);
    }
    dt,
    h3 {
      font-weight: 700;
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    .actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .actions > h2,
    .actions > p {
      grid-column: 1 / -1;
      margin: 0;
    }
    .action-group {
      border: 1px solid var(--color-neutral-300);
    }
    .ui-button {
      justify-self: start;
    }
    @media (width <= 48rem) {
      .actions {
        grid-template-columns: 1fr;
      }
      dl div {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionDetail implements OnInit {
  private readonly get = inject(GET_EXECUTION);
  protected readonly startDiagnosis = inject(START_DIAGNOSIS);
  protected readonly completeDiagnosis = inject(COMPLETE_DIAGNOSIS);
  protected readonly startRepair = inject(START_REPAIR);
  protected readonly completeRepair = inject(COMPLETE_REPAIR);
  protected readonly cancelExecution = inject(CANCEL_EXECUTION);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('execucaoId');
  protected readonly execution = signal<ExecutionDetails | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  readonly diagnosisNotes = new FormControl('', { nonNullable: true });
  readonly repairNotes = new FormControl('', { nonNullable: true });
  readonly cancelReason = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    void this.load();
  }

  protected async run(action: ExecutionAction, message: string, notes?: string): Promise<void> {
    const id = this.id;
    if (!id || this.saving()) return;
    this.saving.set(true);
    this.failure.set(null);
    this.success.set(null);
    const trimmed = notes?.trim();
    try {
      this.execution.set(
        await action.execute({
          id,
          idempotencyKey: crypto.randomUUID(),
          ...(trimmed ? { notes: trimmed } : {}),
        }),
      );
      this.success.set(message);
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.saving.set(false);
    }
  }

  private async load(): Promise<void> {
    if (!this.id) {
      this.failure.set('Identificador da execução não informado.');
      return;
    }
    this.loading.set(true);
    try {
      this.execution.set(await this.get.execute(this.id));
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.loading.set(false);
    }
  }

  private report(error: unknown): void {
    const failure =
      error instanceof ExecutionOperationError
        ? error
        : new ExecutionOperationError('UNKNOWN', null);
    this.failure.set(failureMessages[failure.reason]);
  }
  protected statusLabel(status: ExecutionStatus): string {
    return statusLabels[status];
  }
}
