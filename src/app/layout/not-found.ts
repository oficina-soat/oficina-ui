import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SessionStore } from '../core/auth/session.store';
import { EmptyState } from '../shared/ui';

@Component({
  selector: 'app-not-found',
  imports: [EmptyState],
  template: `
    <main class="not-found" aria-label="Página não encontrada">
      <app-empty-state
        title="Página não encontrada"
        description="O endereço informado não existe ou foi alterado."
        [actionLabel]="session.authenticated() ? 'Voltar ao início' : 'Ir para o login'"
        (action)="goBack()"
      />
    </main>
  `,
  styles: `
    .not-found {
      display: grid;
      min-height: 100dvh;
      place-items: center;
      padding: var(--space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected async goBack(): Promise<void> {
    await this.router.navigateByUrl(this.session.authenticated() ? '/session' : '/login');
  }
}
