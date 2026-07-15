import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-alert',
  template: `
    <section
      class="ui-alert ui-alert--{{ tone() }}"
      [attr.role]="tone() === 'danger' ? 'alert' : 'status'"
      [attr.aria-labelledby]="labelId"
    >
      <strong [id]="labelId">{{ title() }}</strong>
      <div class="ui-alert__content"><ng-content /></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  readonly title = input.required<string>();
  readonly tone = input<AlertTone>('info');
  protected readonly labelId = `alert-${crypto.randomUUID()}`;
}
