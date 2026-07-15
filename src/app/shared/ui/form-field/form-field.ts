import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  template: `
    <div class="ui-field" [class.ui-field--invalid]="error()">
      <label [for]="inputId()">
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true">*</span><span class="sr-only"> obrigatório</span>
        }
      </label>
      <ng-content />
      @if (error()) {
        <p class="ui-field__error" [id]="messageId()" role="alert">{{ error() }}</p>
      } @else if (hint()) {
        <p class="ui-field__hint" [id]="messageId()">{{ hint() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormField {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);
  readonly messageId = input(`field-message-${crypto.randomUUID()}`);
}
