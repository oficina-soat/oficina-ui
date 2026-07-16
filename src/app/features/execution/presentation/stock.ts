import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Alert, EmptyState, Loading, Pagination } from '../../../shared/ui';
import type {
  Page,
  StockBalance,
  StockMovement,
  StockMovementType,
  StockPart,
} from '../application';
import {
  GET_STOCK_BALANCE,
  LIST_STOCK_MOVEMENTS,
  LIST_STOCK_PARTS,
  REGISTER_STOCK_ENTRY,
} from '../execution.providers';

const emptyPage = <T>(): Page<T> => ({
  items: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
});

@Component({
  selector: 'app-stock',
  imports: [Alert, CurrencyPipe, DatePipe, EmptyState, Loading, Pagination, ReactiveFormsModule],
  template: `
    <section class="stock" aria-labelledby="stock-title">
      <header>
        <p class="eyebrow">Execution</p>
        <h1 id="stock-title">Estoque</h1>
        <p>Consulte peças, saldos e movimentações registradas pelo backend.</p>
      </header>
      <form class="filters" [formGroup]="filters" (ngSubmit)="search()">
        <label>Nome <input formControlName="name" /></label>
        <label>Código <input formControlName="code" /></label>
        <button class="ui-button" type="submit">Consultar</button>
      </form>
      @if (error()) {
        <app-alert title="Não foi possível consultar o estoque" tone="danger"
          ><button class="ui-button ui-button--secondary" type="button" (click)="loadParts()">
            Tentar novamente
          </button></app-alert
        >
      }
      @if (loading()) {
        <app-loading label="Consultando estoque" />
      }
      @if (!loading() && !error() && parts().items.length === 0) {
        <app-empty-state
          title="Nenhuma peça encontrada"
          description="Altere os filtros ou tente novamente mais tarde."
        />
      }
      @if (parts().items.length > 0) {
        <div class="table-wrap">
          <table>
            <caption>
              Catálogo de peças
            </caption>
            <thead>
              <tr>
                <th>Peça</th>
                <th>Código</th>
                <th>Valor</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              @for (part of parts().items; track part.id) {
                <tr [class.selected]="selected()?.id === part.id">
                  <td>{{ part.name }}</td>
                  <td>{{ part.code }}</td>
                  <td>{{ part.unitPrice | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}</td>
                  <td>
                    <button
                      class="ui-button ui-button--secondary"
                      type="button"
                      (click)="selectPart(part)"
                    >
                      Ver estoque
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-pagination
          [currentPage]="parts().page + 1"
          [totalPages]="parts().totalPages"
          label="Páginas do catálogo"
          (pageChange)="changePartsPage($event)"
        />
      }

      @if (selected(); as part) {
        <section class="details" aria-labelledby="balance-title">
          <h2 id="balance-title">{{ part.name }}</h2>
          @if (detailLoading()) {
            <app-loading label="Consultando saldo e movimentações" />
          }
          @if (balance(); as current) {
            <dl>
              <div>
                <dt>Disponível</dt>
                <dd>{{ current.available }}</dd>
              </div>
              <div>
                <dt>Reservado</dt>
                <dd>{{ current.reserved }}</dd>
              </div>
              <div>
                <dt>Atualizado</dt>
                <dd>{{ current.updatedAt | date: 'short' : '' : 'pt-BR' }}</dd>
              </div>
            </dl>
            <span class="sr-only" data-testid="stock-actions">{{
              current.allowedActions.join(',')
            }}</span>
            @if (canRegisterEntry()) {
              <form class="entry" [formGroup]="entry" (ngSubmit)="registerEntry()">
                <h3>Registrar entrada</h3>
                <label>Quantidade <input type="number" min="1" formControlName="quantity" /></label
                ><label>Motivo <input formControlName="reason" /></label
                ><button class="ui-button" type="submit" [disabled]="entry.invalid || saving()">
                  {{ saving() ? 'Registrando…' : 'Registrar entrada' }}
                </button>
              </form>
            }
          }
          <form class="movement-filter" [formGroup]="movementFilter" (ngSubmit)="loadMovements(0)">
            <label
              >Tipo
              <select formControlName="type">
                <option value="">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="RESERVA">Reserva</option>
                <option value="CONSUMO">Consumo</option>
                <option value="ESTORNO">Estorno</option>
              </select></label
            ><button class="ui-button ui-button--secondary" type="submit">
              Filtrar movimentos
            </button>
          </form>
          @if (!detailLoading() && movements().items.length === 0) {
            <app-empty-state
              title="Sem movimentações"
              description="Ainda não há movimentações para esta peça."
            />
          }
          @if (movements().items.length > 0) {
            <div class="table-wrap">
              <table>
                <caption>
                  Movimentações da peça
                </caption>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (movement of movements().items; track movement.id) {
                    <tr>
                      <td>{{ movement.createdAt | date: 'short' : '' : 'pt-BR' }}</td>
                      <td>{{ movement.type }}</td>
                      <td>{{ movement.quantity }}</td>
                      <td>{{ movement.reason || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-pagination
              [currentPage]="movements().page + 1"
              [totalPages]="movements().totalPages"
              label="Páginas das movimentações"
              (pageChange)="loadMovements($event - 1)"
            />
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .stock {
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
      h3 {
        margin: 0.25rem 0;
      }
      .filters,
      .entry,
      .movement-filter {
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
      }
      input,
      select {
        min-height: 2.75rem;
        padding: 0.5rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
      }
      .table-wrap {
        overflow: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: var(--color-surface);
      }
      caption {
        text-align: left;
        font-weight: 700;
        padding: 0.75rem;
      }
      th,
      td {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 1px solid var(--color-border);
      }
      tr.selected {
        background: var(--color-primary-soft);
      }
      .details {
        display: grid;
        gap: 1rem;
        border-top: 2px solid var(--color-border);
        padding-top: 1rem;
      }
      dl {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      dl div {
        background: var(--color-surface);
        padding: 1rem;
        min-width: 10rem;
        border-radius: var(--radius-md);
      }
      dt {
        font-size: 0.875rem;
      }
      dd {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0.25rem 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stock {
  private readonly listParts = inject(LIST_STOCK_PARTS);
  private readonly getBalance = inject(GET_STOCK_BALANCE);
  private readonly listMovements = inject(LIST_STOCK_MOVEMENTS);
  private readonly register = inject(REGISTER_STOCK_ENTRY);
  protected readonly parts = signal<Page<StockPart>>(emptyPage());
  protected readonly selected = signal<StockPart | null>(null);
  protected readonly balance = signal<StockBalance | null>(null);
  protected readonly movements = signal<Page<StockMovement>>(emptyPage());
  protected readonly loading = signal(true);
  protected readonly detailLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal(false);
  protected readonly canRegisterEntry = computed(
    () => this.balance()?.allowedActions.includes('REGISTRAR_ENTRADA') === true,
  );
  protected readonly filters = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    code: new FormControl('', { nonNullable: true }),
  });
  protected readonly movementFilter = new FormGroup({
    type: new FormControl<StockMovementType | ''>('', { nonNullable: true }),
  });
  protected readonly entry = new FormGroup({
    quantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    reason: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    void this.loadParts();
  }
  protected search(): void {
    void this.loadParts(0);
  }
  protected changePartsPage(page: number): void {
    void this.loadParts(page - 1);
  }
  protected async loadParts(page = this.parts().page): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const name = this.filters.controls.name.value.trim();
      const code = this.filters.controls.code.value.trim();
      this.parts.set(
        await this.listParts.execute({
          ...(name ? { name } : {}),
          ...(code ? { code } : {}),
          page,
        }),
      );
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  protected async selectPart(part: StockPart): Promise<void> {
    this.selected.set(part);
    this.balance.set(null);
    this.movements.set(emptyPage());
    this.detailLoading.set(true);
    try {
      const [balance, movements] = await Promise.all([
        this.getBalance.execute(part.id),
        this.listMovements.execute({ partId: part.id }),
      ]);
      this.balance.set(balance);
      this.movements.set(movements);
    } catch {
      this.error.set(true);
    } finally {
      this.detailLoading.set(false);
    }
  }
  protected async loadMovements(page: number): Promise<void> {
    const part = this.selected();
    if (!part) return;
    this.detailLoading.set(true);
    try {
      const type = this.movementFilter.controls.type.value;
      this.movements.set(
        await this.listMovements.execute({ partId: part.id, ...(type ? { type } : {}), page }),
      );
    } catch {
      this.error.set(true);
    } finally {
      this.detailLoading.set(false);
    }
  }
  protected async registerEntry(): Promise<void> {
    const part = this.selected();
    if (
      !part ||
      this.entry.invalid ||
      !this.balance()?.allowedActions.includes('REGISTRAR_ENTRADA')
    )
      return;
    this.saving.set(true);
    try {
      const reason = this.entry.controls.reason.value.trim();
      await this.register.execute({
        partId: part.id,
        quantity: this.entry.controls.quantity.value,
        ...(reason ? { reason } : {}),
        idempotencyKey: crypto.randomUUID(),
      });
      this.entry.reset({ quantity: 1, reason: '' });
      await this.selectPart(part);
    } catch {
      this.error.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
