import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Alert, Confirmation, DataTable, FormField, Loading } from '../../../../shared/ui';
import type {
  WorkOrderAction,
  WorkOrderHistoryEntry,
  WorkOrderState,
  WorkOrderSummary,
} from '../../application';
import {
  ADD_WORK_ORDER_PART,
  ADD_WORK_ORDER_SERVICE,
  CANCEL_WORK_ORDER,
  CHANGE_WORK_ORDER_STATE,
  GET_WORK_ORDER,
  GET_WORK_ORDER_HISTORY,
  WorkOrderOperationError,
} from '../../public-api';
import {
  LIST_CATALOG_SERVICES,
  LIST_STOCK_PARTS,
  type CatalogService,
  type StockPart,
} from '../../../execution/public-api';
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
    CurrencyPipe,
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

        <section aria-labelledby="composition-title">
          <h2 id="composition-title">Composição técnica</h2>
          <h3>Serviços</h3>
          @if (item.services.length === 0) {
            <p>Nenhum serviço incluído.</p>
          } @else {
            <app-data-table label="Serviços da ordem de serviço">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Serviço</th>
                    <th scope="col">Quantidade</th>
                    <th scope="col">Valor unitário</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (service of item.services; track service.serviceId) {
                    <tr>
                      <td>{{ service.name }}</td>
                      <td>{{ service.quantity }}</td>
                      <td>{{ service.unitPrice | currency: 'BRL' }}</td>
                      <td>{{ service.totalPrice | currency: 'BRL' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </app-data-table>
          }
          <h3>Peças</h3>
          @if (item.parts.length === 0) {
            <p>Nenhuma peça incluída.</p>
          } @else {
            <app-data-table label="Peças da ordem de serviço">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Peça</th>
                    <th scope="col">Quantidade</th>
                    <th scope="col">Valor unitário</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (part of item.parts; track part.partId) {
                    <tr>
                      <td>{{ part.name }}</td>
                      <td>{{ part.quantity }}</td>
                      <td>{{ part.unitPrice | currency: 'BRL' }}</td>
                      <td>{{ part.totalPrice | currency: 'BRL' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </app-data-table>
          }
        </section>

        @if (item.allowedActions.includes('INCLUIR_SERVICO')) {
          <section class="item-action" aria-labelledby="service-title">
            <h2 id="service-title">Incluir serviço</h2>
            <form [formGroup]="serviceForm" (ngSubmit)="addService()">
              <app-form-field inputId="service-search" label="Pesquisar serviço">
                <input id="service-search" formControlName="search" />
              </app-form-field>
              <button
                class="ui-button"
                type="button"
                (click)="searchServices()"
                [disabled]="catalogLoading()"
              >
                Pesquisar
              </button>
              <app-form-field inputId="service-id" label="Serviço" [required]="true">
                <select id="service-id" formControlName="itemId">
                  <option value="">Selecione</option>
                  @for (service of services(); track service.id) {
                    <option [value]="service.id">
                      {{ service.name }} — {{ service.basePrice | currency: 'BRL' }}
                    </option>
                  }
                </select>
              </app-form-field>
              <app-form-field inputId="service-quantity" label="Quantidade" [required]="true">
                <input
                  id="service-quantity"
                  type="number"
                  min="0.001"
                  step="0.001"
                  formControlName="quantity"
                />
              </app-form-field>
              <button class="ui-button ui-button--primary" type="submit" [disabled]="saving()">
                Incluir serviço
              </button>
            </form>
          </section>
        }

        @if (item.allowedActions.includes('INCLUIR_PECA')) {
          <section class="item-action" aria-labelledby="part-title">
            <h2 id="part-title">Incluir peça</h2>
            <form [formGroup]="partForm" (ngSubmit)="addPart()">
              <app-form-field inputId="part-search" label="Pesquisar peça">
                <input id="part-search" formControlName="search" />
              </app-form-field>
              <button
                class="ui-button"
                type="button"
                (click)="searchParts()"
                [disabled]="catalogLoading()"
              >
                Pesquisar
              </button>
              <app-form-field inputId="part-id" label="Peça" [required]="true">
                <select id="part-id" formControlName="itemId">
                  <option value="">Selecione</option>
                  @for (part of parts(); track part.id) {
                    <option [value]="part.id">
                      {{ part.name }} — {{ part.unitPrice | currency: 'BRL' }}
                    </option>
                  }
                </select>
              </app-form-field>
              <app-form-field inputId="part-quantity" label="Quantidade" [required]="true">
                <input
                  id="part-quantity"
                  type="number"
                  min="0.001"
                  step="0.001"
                  formControlName="quantity"
                />
              </app-form-field>
              <button class="ui-button ui-button--primary" type="submit" [disabled]="saving()">
                Incluir peça
              </button>
            </form>
          </section>
        }

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

        @if (item.allowedActions.length > 0) {
          <section class="actions" aria-labelledby="actions-title">
            <h2 id="actions-title">Ações da OS</h2>
            <p>A API valida se a ação é permitida para o estado atual.</p>
            @if (hasStateActions()) {
              <div class="state-actions" [formGroup]="stateForm">
                <app-form-field inputId="state-reason" label="Motivo">
                  <input id="state-reason" formControlName="reason" />
                </app-form-field>
                <div class="action-buttons">
                  @for (action of stateActions; track action.action) {
                    @if (item.allowedActions.includes(action.action)) {
                      <button
                        class="ui-button ui-button--primary"
                        type="button"
                        [disabled]="saving()"
                        (click)="changeState(action.state)"
                      >
                        {{ action.label }}
                      </button>
                    }
                  }
                </div>
              </div>
            }

            @if (item.allowedActions.includes('CANCELAR')) {
              <div class="cancel-action">
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
            }
          </section>
        }
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
    .actions,
    .item-action {
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
    .state-actions,
    .cancel-action {
      display: grid;
      gap: var(--space-4);
      max-width: 40rem;
    }
    .cancel-action {
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-neutral-300);
    }
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
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
  private readonly addServiceCommand = inject(ADD_WORK_ORDER_SERVICE);
  private readonly addPartCommand = inject(ADD_WORK_ORDER_PART);
  private readonly listServices = inject(LIST_CATALOG_SERVICES);
  private readonly listParts = inject(LIST_STOCK_PARTS);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('ordemServicoId');
  protected readonly order = signal<WorkOrderSummary | null>(null);
  protected readonly history = signal<readonly WorkOrderHistoryEntry[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly services = signal<readonly CatalogService[]>([]);
  protected readonly parts = signal<readonly StockPart[]>([]);
  protected readonly catalogLoading = signal(false);
  protected readonly confirmingCancel = signal(false);
  protected readonly stateActions: readonly {
    action: WorkOrderAction;
    state: WorkOrderState;
    label: string;
  }[] = [{ action: 'ENTREGAR', state: 'ENTREGUE', label: 'Registrar entrega' }];
  readonly stateForm = new FormGroup({
    reason: new FormControl('', { nonNullable: true }),
  });
  readonly cancelReason = new FormControl('', { nonNullable: true });
  readonly serviceForm = this.itemForm();
  readonly partForm = this.itemForm();

  ngOnInit(): void {
    void this.load();
  }

  protected async changeState(state: WorkOrderState): Promise<void> {
    const id = this.id;
    if (!id || this.saving()) return;
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
      this.stateForm.reset({ reason: '' });
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
      const catalogLoads: Promise<void>[] = [];
      if (order.allowedActions.includes('INCLUIR_SERVICO'))
        catalogLoads.push(this.searchServices());
      if (order.allowedActions.includes('INCLUIR_PECA')) catalogLoads.push(this.searchParts());
      await Promise.all(catalogLoads);
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected async searchServices(): Promise<void> {
    await this.loadCatalog(async () => {
      const name = this.serviceForm.controls.search.value.trim();
      const page = await this.listServices.execute({ size: 50, ...(name ? { name } : {}) });
      this.services.set(page.items);
    });
  }

  protected async searchParts(): Promise<void> {
    await this.loadCatalog(async () => {
      const name = this.partForm.controls.search.value.trim();
      const page = await this.listParts.execute({
        active: true,
        size: 50,
        ...(name ? { name } : {}),
      });
      this.parts.set(page.items);
    });
  }

  protected async addService(): Promise<void> {
    const id = this.id;
    if (!id || this.serviceForm.invalid) return this.serviceForm.markAllAsTouched();
    await this.execute(async () => {
      this.order.set(
        await this.addServiceCommand.execute({
          id,
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
    const id = this.id;
    if (!id || this.partForm.invalid) return this.partForm.markAllAsTouched();
    await this.execute(async () => {
      this.order.set(
        await this.addPartCommand.execute({
          id,
          partId: this.partForm.controls.itemId.value,
          quantity: this.partForm.controls.quantity.value,
          idempotencyKey: crypto.randomUUID(),
        }),
      );
      this.partForm.patchValue({ itemId: '', quantity: 1 });
      this.success.set('Peça incluída conforme resposta da API.');
    });
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

  private async loadCatalog(load: () => Promise<void>): Promise<void> {
    this.catalogLoading.set(true);
    try {
      await load();
    } catch (error: unknown) {
      this.report(error);
    } finally {
      this.catalogLoading.set(false);
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

  protected hasStateActions(): boolean {
    const actions = this.order()?.allowedActions ?? [];
    return this.stateActions.some(({ action }) => actions.includes(action));
  }
}
