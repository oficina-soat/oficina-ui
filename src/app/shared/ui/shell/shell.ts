import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavigationItem {
  readonly label: string;
  readonly href: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="ui-shell">
      <a class="ui-skip-link" href="#main-content">Ir para o conteúdo</a>
      <header class="ui-shell__header">
        <a class="ui-shell__brand" routerLink="/session">{{ brand() }}</a>
        <div class="ui-shell__identity">
          <span>{{ userLabel() }}</span>
          <button
            class="ui-button ui-button--secondary ui-shell__menu-button"
            type="button"
            aria-controls="primary-navigation"
            [attr.aria-expanded]="menuOpen()"
            (click)="menuOpen.set(!menuOpen())"
          >
            Menu
          </button>
          <button class="ui-button ui-button--secondary" type="button" (click)="logout.emit()">
            Sair
          </button>
        </div>
      </header>
      <aside class="ui-shell__sidebar" [class.ui-shell__sidebar--open]="menuOpen()">
        <nav id="primary-navigation" aria-label="Navegação principal">
          @for (item of navigation(); track item.href) {
            <a
              [routerLink]="item.href"
              routerLinkActive="ui-shell__link--current"
              [routerLinkActiveOptions]="{ exact: item.href === '/session' }"
              (click)="menuOpen.set(false)"
            >
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>
      <main class="ui-shell__main" id="main-content" tabindex="-1">
        <nav class="ui-shell__breadcrumb" aria-label="Caminho da página">
          <ol>
            @for (item of breadcrumb(); track $index; let last = $last) {
              <li [attr.aria-current]="last ? 'page' : null">{{ item }}</li>
            }
          </ol>
        </nav>
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
  readonly breadcrumb = input<readonly string[]>([]);
  readonly logout = output<void>();
  protected readonly menuOpen = signal(false);
}
