import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SessionStore } from '../../../../core/auth/session.store';
import { Alert } from '../../../../shared/ui';
import { LOGOUT_USER } from '../../public-api';

@Component({
  selector: 'app-session',
  imports: [Alert, DatePipe, RouterLink],
  templateUrl: './session.html',
  styleUrl: './session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Session {
  protected readonly session = inject(SessionStore);
  private readonly logoutUser = inject(LOGOUT_USER);
  private readonly router = inject(Router);

  protected async logout(): Promise<void> {
    this.logoutUser.execute();
    await this.router.navigateByUrl('/login');
  }
}
