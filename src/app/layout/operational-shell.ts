import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { SessionStore } from '../core/auth/session.store';
import { ApiAvailabilityStore } from '../core/http/api-availability.store';
import { LOGOUT_USER } from '../features/auth/public-api';
import { Alert, type NavigationItem, Shell } from '../shared/ui';

const roleLabels = {
  administrativo: 'Administrativo',
  mecanico: 'Mecânico',
  recepcionista: 'Recepcionista',
} as const;

@Component({
  selector: 'app-operational-shell',
  imports: [Alert, RouterOutlet, Shell],
  template: `
    <app-shell
      [userLabel]="userLabel()"
      [navigation]="navigation()"
      [breadcrumb]="breadcrumb()"
      (logout)="logout()"
    >
      @if (availability.unavailable(); as unavailable) {
        <app-alert title="Serviços temporariamente indisponíveis" tone="danger">
          <p>Algumas operações podem falhar. Tente novamente em instantes.</p>
          @if (unavailable.correlationId) {
            <p>Referência: {{ unavailable.correlationId }}</p>
          }
          <button
            class="ui-button ui-button--secondary"
            type="button"
            (click)="availability.clear()"
          >
            Fechar aviso
          </button>
        </app-alert>
      }
      <router-outlet />
    </app-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationalShell {
  protected readonly availability = inject(ApiAvailabilityStore);
  private readonly session = inject(SessionStore);
  private readonly logoutUser = inject(LOGOUT_USER);
  private readonly router = inject(Router);

  protected readonly userLabel = computed(() => {
    const identity = this.session.identity();
    const roles = (identity?.roles ?? []).map((role) => roleLabels[role]);
    const user = identity?.maskedSubject
      ? `Usuário ${identity.maskedSubject}`
      : 'Usuário operacional';
    return roles.length > 0 ? `${user} · ${roles.join(' · ')}` : user;
  });

  protected readonly navigation = computed<readonly NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      { label: 'Início', href: '/session' },
      { label: 'Clientes', href: '/clientes' },
      { label: 'Ordens de serviço', href: '/ordens-servico' },
    ];
    if (this.session.hasAnyRole(['administrativo'])) {
      items.push({ label: 'Ativação de credencial', href: '/administracao/ativacoes/nova' });
    }
    return items;
  });

  protected readonly breadcrumb = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.readBreadcrumb()),
    ),
    { initialValue: ['Início'] },
  );

  protected async logout(): Promise<void> {
    this.logoutUser.execute();
    await this.router.navigateByUrl('/login');
  }

  private readBreadcrumb(): readonly string[] {
    const labels = ['Início'];
    let current = this.router.routerState.snapshot.root.firstChild;
    while (current) {
      const label = current.data['breadcrumb'];
      if (typeof label === 'string' && label !== 'Início') labels.push(label);
      current = current.firstChild;
    }
    return labels;
  }
}
