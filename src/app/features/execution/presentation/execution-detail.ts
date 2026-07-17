import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Alert, DataTable, FormField, Loading } from '../../../shared/ui';
import {
  ADD_WORK_ORDER_PART,
  ADD_WORK_ORDER_SERVICE,
  GET_WORK_ORDER,
  WorkOrderOperationError,
  type WorkOrderSummary,
} from '../../attendance/public-api';
import {
  COMPLETE_DIAGNOSIS,
  COMPLETE_REPAIR,
  ExecutionOperationError,
  GET_EXECUTION,
  LIST_CATALOG_SERVICES,
  LIST_STOCK_PARTS,
  START_DIAGNOSIS,
  type CatalogService,
  type ExecutionDetails,
  type ExecutionStatus,
  type StockPart,
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

const workOrderFailureMessages = {
  INVALID_INPUT: 'Revise os dados da composição técnica.',
  CONFLICT: 'A composição não é válida para o estado atual da OS.',
  NOT_FOUND: 'A ordem de serviço associada não foi encontrada.',
  UNAUTHENTICATED: 'Sua sessão expirou.',
  SERVICE_UNAVAILABLE: 'O serviço de ordens está indisponível.',
  UNKNOWN: 'Não foi possível atualizar a composição da OS.',
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
  imports: [
    Alert,
    CurrencyPipe,
    DataTable,
    DatePipe,
    FormField,
    Loading,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <section class="execution" aria-labelledby="execution-title">
      <a routerLink="/fila-execucao">← Voltar para fila</a>
      <h1 id="execution-title">Atendimento da OS</h1>
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

        @if (order(); as workOrder) {
          <section class="composition" aria-labelledby="composition-title">
            <div>
              <h2 id="composition-title">Composição técnica da OS</h2>
              <p>{{ workOrder.problemDescription }}</p>
            </div>

            <div class="composition-grid">
              <section aria-labelledby="services-title">
                <h3 id="services-title">Serviços</h3>
                @if (workOrder.services.length === 0) {
                  <p>Nenhum serviço incluído.</p>
                } @else {
                  <app-data-table label="Serviços da ordem de serviço">
                    <table>
                      <thead>
                        <tr>
                          <th>Serviço</th>
                          <th>Quantidade</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (service of workOrder.services; track service.serviceId) {
                          <tr>
                            <td>{{ service.name }}</td>
                            <td>{{ service.quantity }}</td>
                            <td>{{ service.totalPrice | currency: 'BRL' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </app-data-table>
                }
              </section>

              <section aria-labelledby="parts-title">
                <h3 id="parts-title">Peças</h3>
                @if (workOrder.parts.length === 0) {
                  <p>Nenhuma peça incluída.</p>
                } @else {
                  <app-data-table label="Peças da ordem de serviço">
                    <table>
                      <thead>
                        <tr>
                          <th>Peça</th>
                          <th>Quantidade</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (part of workOrder.parts; track part.partId) {
                          <tr>
                            <td>{{ part.name }}</td>
                            <td>{{ part.quantity }}</td>
                            <td>{{ part.totalPrice | currency: 'BRL' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </app-data-table>
                }
              </section>
            </div>

            @if (
              workOrder.allowedActions.includes('INCLUIR_SERVICO') ||
              workOrder.allowedActions.includes('INCLUIR_PECA')
            ) {
              <div class="item-actions">
                @if (workOrder.allowedActions.includes('INCLUIR_SERVICO')) {
                  <form class="action-group" [formGroup]="serviceForm" (ngSubmit)="addService()">
                    <h3>Incluir serviço</h3>
                    <app-form-field inputId="service-search" label="Pesquisar serviço">
                      <input id="service-search" formControlName="search" />
                    </app-form-field>
                    <button
                      type="button"
                      class="ui-button ui-button--secondary"
                      (click)="searchServices()"
                    >
                      Pesquisar
                    </button>
                    <app-form-field inputId="service-id" label="Serviço">
                      <select id="service-id" formControlName="itemId">
                        <option value="">Selecione</option>
                        @for (service of services(); track service.id) {
                          <option [value]="service.id">{{ service.name }}</option>
                        }
                      </select>
                    </app-form-field>
                    <app-form-field inputId="service-quantity" label="Quantidade">
                      <input
                        id="service-quantity"
                        type="number"
                        min="0.001"
                        step="0.001"
                        formControlName="quantity"
                      />
                    </app-form-field>
                    <button
                      class="ui-button ui-button--primary"
                      type="submit"
                      [disabled]="saving()"
                    >
                      Incluir serviço
                    </button>
                  </form>
                }

                @if (workOrder.allowedActions.includes('INCLUIR_PECA')) {
                  <form class="action-group" [formGroup]="partForm" (ngSubmit)="addPart()">
                    <h3>Incluir peça</h3>
                    <app-form-field inputId="part-search" label="Pesquisar peça">
                      <input id="part-search" formControlName="search" />
                    </app-form-field>
                    <button
                      type="button"
                      class="ui-button ui-button--secondary"
                      (click)="searchParts()"
                    >
                      Pesquisar
                    </button>
                    <app-form-field inputId="part-id" label="Peça">
                      <select id="part-id" formControlName="itemId">
                        <option value="">Selecione</option>
                        @for (part of parts(); track part.id) {
                          <option [value]="part.id">{{ part.name }}</option>
                        }
                      </select>
                    </app-form-field>
                    <app-form-field inputId="part-quantity" label="Quantidade">
                      <input
                        id="part-quantity"
                        type="number"
                        min="0.001"
                        step="0.001"
                        formControlName="quantity"
                      />
                    </app-form-field>
                    <button
                      class="ui-button ui-button--primary"
                      type="submit"
                      [disabled]="saving()"
                    >
                      Incluir peça
                    </button>
                  </form>
                }
              </div>
            }
          </section>
        }

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
            @if (item.allowedActions.includes('CONCLUIR_REPARO')) {
              <div class="action-group">
                <h3>Reparo</h3>
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
    .action-group,
    .composition {
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
    .composition-grid,
    .item-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-4);
    }
    .composition h2,
    .composition h3,
    .composition p {
      margin-block: 0 var(--space-2);
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
      .composition-grid,
      .item-actions {
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
  private readonly getOrder = inject(GET_WORK_ORDER);
  private readonly addServiceCommand = inject(ADD_WORK_ORDER_SERVICE);
  private readonly addPartCommand = inject(ADD_WORK_ORDER_PART);
  private readonly listServices = inject(LIST_CATALOG_SERVICES);
  private readonly listParts = inject(LIST_STOCK_PARTS);
  protected readonly startDiagnosis = inject(START_DIAGNOSIS);
  protected readonly completeDiagnosis = inject(COMPLETE_DIAGNOSIS);
  protected readonly completeRepair = inject(COMPLETE_REPAIR);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('execucaoId');
  protected readonly execution = signal<ExecutionDetails | null>(null);
  protected readonly order = signal<WorkOrderSummary | null>(null);
  protected readonly services = signal<readonly CatalogService[]>([]);
  protected readonly parts = signal<readonly StockPart[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  readonly diagnosisNotes = new FormControl('', { nonNullable: true });
  readonly repairNotes = new FormControl('', { nonNullable: true });
  readonly serviceForm = this.itemForm();
  readonly partForm = this.itemForm();

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
      const execution = await this.get.execute(this.id);
      this.execution.set(execution);
      const order = await this.getOrder.execute(execution.ordemServicoId);
      this.order.set(order);
      await Promise.all([
        ...(order.allowedActions.includes('INCLUIR_SERVICO') ? [this.searchServices()] : []),
        ...(order.allowedActions.includes('INCLUIR_PECA') ? [this.searchParts()] : []),
      ]);
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.loading.set(false);
    }
  }

  private report(error: unknown): void {
    if (error instanceof WorkOrderOperationError) {
      this.failure.set(workOrderFailureMessages[error.reason]);
      return;
    }
    const failure =
      error instanceof ExecutionOperationError
        ? error
        : new ExecutionOperationError('UNKNOWN', null);
    this.failure.set(failureMessages[failure.reason]);
  }
  protected statusLabel(status: ExecutionStatus): string {
    return statusLabels[status];
  }

  protected async searchServices(): Promise<void> {
    try {
      const name = this.serviceForm.controls.search.value.trim();
      const page = await this.listServices.execute({ size: 50, ...(name ? { name } : {}) });
      this.services.set(page.items);
    } catch (error: unknown) {
      this.report(error);
    }
  }

  protected async searchParts(): Promise<void> {
    try {
      const name = this.partForm.controls.search.value.trim();
      const page = await this.listParts.execute({
        active: true,
        size: 50,
        ...(name ? { name } : {}),
      });
      this.parts.set(page.items);
    } catch (error: unknown) {
      this.report(error);
    }
  }

  protected async addService(): Promise<void> {
    const order = this.order();
    if (!order || this.serviceForm.invalid) return this.serviceForm.markAllAsTouched();
    await this.executeOrder(async () => {
      this.order.set(
        await this.addServiceCommand.execute({
          id: order.id,
          serviceId: this.serviceForm.controls.itemId.value,
          quantity: this.serviceForm.controls.quantity.value,
          idempotencyKey: crypto.randomUUID(),
        }),
      );
      this.serviceForm.patchValue({ itemId: '', quantity: 1 });
      this.success.set('Serviço incluído conforme resposta da API.');
    });
  }

  protected async addPart(): Promise<void> {
    const order = this.order();
    if (!order || this.partForm.invalid) return this.partForm.markAllAsTouched();
    await this.executeOrder(async () => {
      this.order.set(
        await this.addPartCommand.execute({
          id: order.id,
          partId: this.partForm.controls.itemId.value,
          quantity: this.partForm.controls.quantity.value,
          idempotencyKey: crypto.randomUUID(),
        }),
      );
      this.partForm.patchValue({ itemId: '', quantity: 1 });
      this.success.set('Peça incluída conforme resposta da API.');
    });
  }

  private async executeOrder(command: () => Promise<void>): Promise<void> {
    if (this.saving()) return;
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

  private itemForm(): FormGroup<{
    search: FormControl<string>;
    itemId: FormControl<string>;
    quantity: FormControl<number>;
  }> {
    return new FormGroup({
      search: new FormControl('', { nonNullable: true }),
      itemId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      quantity: new FormControl(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.001)],
      }),
    });
  }
}
