import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-confirmation',
  template: `
    @if (open()) {
      <div class="ui-dialog-backdrop">
        <section
          #dialog
          class="ui-dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId"
          (keydown)="handleKeydown($event)"
        >
          <h2 [id]="titleId">{{ title() }}</h2>
          <p [id]="descriptionId">{{ description() }}</p>
          <div class="ui-dialog__actions">
            <button
              #cancelButton
              class="ui-button ui-button--secondary"
              type="button"
              (click)="cancelled.emit()"
            >
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
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  private previouslyFocused: HTMLElement | null = null;
  private activeDialog: HTMLElement | null = null;
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  protected readonly titleId = `confirmation-title-${crypto.randomUUID()}`;
  protected readonly descriptionId = `confirmation-description-${crypto.randomUUID()}`;

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog()?.nativeElement ?? null;
      if (this.open() && dialog && dialog !== this.activeDialog) {
        this.previouslyFocused = this.document.activeElement as HTMLElement | null;
        this.activeDialog = dialog;
        this.cancelButton()?.nativeElement.focus();
      } else if (!this.open() && this.activeDialog) {
        this.previouslyFocused?.focus();
        this.previouslyFocused = null;
        this.activeDialog = null;
      }
    });
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelled.emit();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      this.dialog()?.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    const first = focusable.at(0);
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
