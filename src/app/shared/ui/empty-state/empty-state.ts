import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <section class="ui-empty" [attr.aria-labelledby]="titleId">
      <span class="ui-empty__icon" aria-hidden="true">○</span>
      <h2 [id]="titleId">{{ title() }}</h2>
      <p>{{ description() }}</p>
      @if (actionLabel()) {
        <button class="ui-button ui-button--primary" type="button" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
  protected readonly titleId = `empty-${crypto.randomUUID()}`;
}
