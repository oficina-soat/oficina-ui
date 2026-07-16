import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alert, EmptyState, Loading } from '../../../shared/ui';
import type { Budget, Payment } from '../application';
import { APPROVE_BUDGET, GET_WORK_ORDER_BILLING, REJECT_BUDGET } from '../billing.providers';

@Component({
  selector: 'app-billing',
  imports: [Alert, CurrencyPipe, DatePipe, EmptyState, Loading, ReactiveFormsModule],
  template: `
    <section class="billing" aria-labelledby="billing-title">
      <header>
        <p class="eyebrow">Financeiro</p>
        <h1 id="billing-title">Orçamento e pagamento</h1>
        <p>Consulte a situação financeira de uma ordem de serviço.</p>
      </header>
      <form class="search" [formGroup]="searchForm" (ngSubmit)="search()">
        <label
          >Identificador da ordem de serviço <input formControlName="workOrderId" required
        /></label>
        <button class="ui-button" type="submit" [disabled]="searchForm.invalid || loading()">
          Consultar
        </button>
      </form>
      @if (error()) {
        <app-alert title="Não foi possível consultar o faturamento" tone="danger"
          ><button class="ui-button ui-button--secondary" type="button" (click)="search()">
            Tentar novamente
          </button></app-alert
        >
      }
      @if (loading()) {
        <app-loading label="Consultando orçamento e pagamento" />
      }
      @if (!loading() && loaded() && budgets().length === 0 && payments().length === 0) {
        <app-empty-state
          title="Sem dados financeiros"
          description="Ainda não há orçamento ou pagamento para esta ordem de serviço."
        />
      }
      @if (workOrderState()) {
        <p><strong>Estado operacional da OS:</strong> {{ workOrderState() }}</p>
      }
      @for (budget of budgets(); track budget.id) {
        <article class="card">
          <div class="card-title">
            <div>
              <h2>Orçamento</h2>
              <p>{{ budget.id }}</p>
            </div>
            <strong>{{ budget.status }}</strong>
          </div>
          <table>
            <caption>
              Itens do orçamento
            </caption>
            <thead>
              <tr>
                <th>Item</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              @for (item of budget.items; track item.id) {
                <tr>
                  <td>{{ item.name }}</td>
                  <td>{{ item.type }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.totalValue | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <p class="total">
            Total: {{ budget.totalValue | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}
          </p>
          @if (
            budget.allowedActions.includes('APROVAR') || budget.allowedActions.includes('RECUSAR')
          ) {
            <form class="decision" [formGroup]="decisionForm">
              <label>Motivo ou observação <input formControlName="reason" /></label>
              @if (budget.allowedActions.includes('APROVAR')) {
                <button
                  class="ui-button"
                  type="button"
                  [disabled]="saving()"
                  (click)="decide(budget, 'APROVAR')"
                >
                  Aprovar orçamento
                </button>
              }
              @if (budget.allowedActions.includes('RECUSAR')) {
                <button
                  class="ui-button ui-button--secondary"
                  type="button"
                  [disabled]="saving()"
                  (click)="decide(budget, 'RECUSAR')"
                >
                  Recusar orçamento
                </button>
              }
            </form>
          }
        </article>
      }
      @if (payments().length > 0) {
        <section class="card">
          <h2>Pagamentos e andamento</h2>
          <table>
            <caption>
              Pagamentos da ordem de serviço
            </caption>
            <thead>
              <tr>
                <th>Pagamento</th>
                <th>Método</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Atualização</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of payments(); track payment.id) {
                <tr>
                  <td>{{ payment.id }}</td>
                  <td>{{ payment.method }}</td>
                  <td>{{ payment.value | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}</td>
                  <td>{{ payment.status }}</td>
                  <td>{{ payment.updatedAt | date: 'short' : '' : 'pt-BR' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
      @if (success()) {
        <app-alert title="Orçamento atualizado" tone="success">{{ success() }}</app-alert>
      }
    </section>
  `,
  styles: [
    `
      .billing {
        display: grid;
        gap: 1.5rem;
      }
      .eyebrow {
        color: var(--color-primary);
        font-weight: 700;
        margin: 0;
      }
      h1,
      h2,
      p {
        margin: 0.25rem 0;
      }
      .search,
      .decision {
        display: flex;
        gap: 1rem;
        align-items: end;
        flex-wrap: wrap;
        background: var(--color-surface);
        padding: 1rem;
        border-radius: var(--radius-md);
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-weight: 600;
        flex: 1;
      }
      input {
        min-height: 2.75rem;
        padding: 0.5rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
      }
      .card {
        display: grid;
        gap: 1rem;
        background: var(--color-surface);
        padding: 1rem;
        border-radius: var(--radius-md);
        overflow: auto;
      }
      .card-title {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .card-title p {
        word-break: break-all;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      caption {
        text-align: left;
        font-weight: 700;
        padding: 0.5rem 0;
      }
      th,
      td {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 1px solid var(--color-border);
      }
      .total {
        font-size: 1.25rem;
        font-weight: 700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Billing {
  private readonly getBilling = inject(GET_WORK_ORDER_BILLING);
  private readonly approve = inject(APPROVE_BUDGET);
  private readonly reject = inject(REJECT_BUDGET);
  protected readonly searchForm = new FormGroup({
    workOrderId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly decisionForm = new FormGroup({
    reason: new FormControl('', { nonNullable: true }),
  });
  protected readonly budgets = signal<readonly Budget[]>([]);
  protected readonly workOrderState = signal('');
  protected readonly payments = signal<readonly Payment[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loaded = signal(false);
  protected readonly error = signal(false);
  protected readonly success = signal('');
  protected async search(): Promise<void> {
    if (this.searchForm.invalid) return;
    this.loading.set(true);
    this.error.set(false);
    this.success.set('');
    try {
      const data = await this.getBilling.execute(this.searchForm.controls.workOrderId.value.trim());
      this.budgets.set(data.budgets);
      this.workOrderState.set(data.workOrderState);
      this.payments.set(data.payments);
      this.loaded.set(true);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  protected async decide(budget: Budget, action: 'APROVAR' | 'RECUSAR'): Promise<void> {
    if (!budget.allowedActions.includes(action)) return;
    this.saving.set(true);
    this.error.set(false);
    try {
      const command = {
        budgetId: budget.id,
        idempotencyKey: crypto.randomUUID(),
        ...(this.decisionForm.controls.reason.value.trim()
          ? { reason: this.decisionForm.controls.reason.value.trim() }
          : {}),
      };
      const updated =
        action === 'APROVAR'
          ? await this.approve.execute(command)
          : await this.reject.execute(command);
      this.budgets.update((values) =>
        values.map((value) => (value.id === updated.id ? updated : value)),
      );
      this.success.set(action === 'APROVAR' ? 'Orçamento aprovado.' : 'Orçamento recusado.');
    } catch {
      this.error.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
