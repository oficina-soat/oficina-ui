import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
}

@Component({
  selector: 'app-shell',
  template: `
    <div class="ui-shell">
      <a class="ui-skip-link" href="#main-content">Ir para o conteúdo</a>
      <header class="ui-shell__header">
        <a class="ui-shell__brand" href="#main-content">{{ brand() }}</a>
        <div class="ui-shell__identity">
          <span>{{ userLabel() }}</span>
          <button class="ui-button ui-button--secondary" type="button" (click)="logout.emit()">
            Sair
          </button>
        </div>
      </header>
      <aside class="ui-shell__sidebar">
        <nav aria-label="Navegação principal">
          @for (item of navigation(); track item.href) {
            <a [href]="item.href" [attr.aria-current]="item.current ? 'page' : null">
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>
      <main class="ui-shell__main" id="main-content" tabindex="-1">
        <ng-content />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  readonly brand = input('Oficina SOAT');
  readonly userLabel = input.required<string>();
  readonly navigation = input.required<readonly NavigationItem[]>();
  readonly logout = output<void>();
}
