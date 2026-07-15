import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  template: `
    <div class="ui-table" role="region" tabindex="0" [attr.aria-label]="label()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable {
  readonly label = input.required<string>();
}
