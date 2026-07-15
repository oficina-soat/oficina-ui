import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    <nav class="ui-pagination" [attr.aria-label]="label()">
      <button
        class="ui-button ui-button--secondary"
        type="button"
        [disabled]="currentPage() <= 1"
        (click)="select(currentPage() - 1)"
      >
        Anterior
      </button>
      <span aria-live="polite">Página {{ currentPage() }} de {{ safeTotalPages() }}</span>
      <button
        class="ui-button ui-button--secondary"
        type="button"
        [disabled]="currentPage() >= safeTotalPages()"
        (click)="select(currentPage() + 1)"
      >
        Próxima
      </button>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly label = input('Paginação');
  readonly pageChange = output<number>();
  protected readonly safeTotalPages = computed(() => Math.max(1, this.totalPages()));

  protected select(page: number): void {
    if (page >= 1 && page <= this.safeTotalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}
