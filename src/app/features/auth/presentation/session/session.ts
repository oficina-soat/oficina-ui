import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { SessionStore } from '../../../../core/auth/session.store';
import { Alert } from '../../../../shared/ui';

@Component({
  selector: 'app-session',
  imports: [Alert, DatePipe],
  templateUrl: './session.html',
  styleUrl: './session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Session {
  protected readonly session = inject(SessionStore);
  protected readonly roleLabels = computed(() =>
    (this.session.identity()?.roles ?? []).map((role) => roleLabels[role]),
  );
}

const roleLabels = {
  administrativo: 'Administrativo',
  mecanico: 'Mecânico',
  recepcionista: 'Recepcionista',
} as const;
