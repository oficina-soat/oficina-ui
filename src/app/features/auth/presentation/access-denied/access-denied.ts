import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Alert } from '../../../../shared/ui';

@Component({
  selector: 'app-access-denied',
  imports: [Alert, RouterLink],
  template: `
    <main class="access-page" aria-labelledby="access-title">
      <section class="access-card">
        <h1 id="access-title">Acesso não disponível</h1>
        <app-alert title="Operação restrita" tone="warning">
          <p>Seu papel atual não apresenta esta área na interface.</p>
        </app-alert>
        <p>A API continuará validando sua autorização em todas as operações.</p>
        <a class="ui-button ui-button--primary" routerLink="/session">Voltar ao início</a>
      </section>
    </main>
  `,
  styles: `
    .access-page {
      display: grid;
      place-items: start;
    }
    .access-card {
      display: grid;
      gap: var(--space-4);
      width: min(34rem, 100%);
      padding: var(--space-8);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .ui-button {
      justify-self: start;
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDenied {}
