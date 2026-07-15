import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation',
  template: `
    @if (open()) {
      <div class="ui-dialog-backdrop">
        <section
          class="ui-dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId"
        >
          <h2 [id]="titleId">{{ title() }}</h2>
          <p [id]="descriptionId">{{ description() }}</p>
          <div class="ui-dialog__actions">
            <button class="ui-button ui-button--secondary" type="button" (click)="cancelled.emit()">
              {{ cancelLabel() }}
            </button>
            <button class="ui-button ui-button--danger" type="button" (click)="confirmed.emit()">
              {{ confirmLabel() }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confirmation {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  protected readonly titleId = `confirmation-title-${crypto.randomUUID()}`;
  protected readonly descriptionId = `confirmation-description-${crypto.randomUUID()}`;
}
