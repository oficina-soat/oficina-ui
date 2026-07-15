import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="ui-loading" role="status" aria-live="polite">
      <span class="ui-loading__spinner" aria-hidden="true"></span>
      <span>{{ label() }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loading {
  readonly label = input('Carregando…');
}
