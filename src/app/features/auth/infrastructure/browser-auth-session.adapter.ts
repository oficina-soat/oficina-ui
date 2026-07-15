import { inject, Injectable } from '@angular/core';

import { SessionStore } from '../../../core/auth/session.store';
import type { AuthSession, AuthSessionPort } from '../application';

@Injectable({ providedIn: 'root' })
export class BrowserAuthSessionAdapter implements AuthSessionPort {
  private readonly store = inject(SessionStore);

  start(session: AuthSession): void {
    this.store.start(session.accessToken, session.expiresInSeconds);
  }

  clear(): void {
    this.store.clear();
  }
}
