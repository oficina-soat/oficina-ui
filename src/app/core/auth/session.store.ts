import { computed, Injectable, signal } from '@angular/core';

import {
  type OperationalRole,
  readSessionIdentity,
  type SessionIdentity,
} from './session-identity';

export interface ActiveSession {
  readonly accessToken: string;
  readonly expiresAt: number;
  readonly identity: SessionIdentity;
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly sessionState = signal<ActiveSession | null>(null);
  private expirationTimer: ReturnType<typeof setTimeout> | undefined;
  readonly session = this.sessionState.asReadonly();
  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);
  readonly authenticated = computed(() => this.sessionState() !== null);
  readonly identity = computed(() => this.sessionState()?.identity ?? null);

  start(accessToken: string, expiresInSeconds: number): void {
    this.clearTimer();
    const duration = Math.max(0, expiresInSeconds * 1000);
    this.sessionState.set({
      accessToken,
      expiresAt: Date.now() + duration,
      identity: readSessionIdentity(accessToken),
    });
    this.expirationTimer = setTimeout(() => this.clear(), duration);
  }

  hasAnyRole(roles: readonly OperationalRole[]): boolean {
    const assignedRoles = this.identity()?.roles ?? [];
    return roles.some((role) => assignedRoles.includes(role));
  }

  clear(): void {
    this.clearTimer();
    this.sessionState.set(null);
  }

  private clearTimer(): void {
    if (this.expirationTimer !== undefined) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = undefined;
    }
  }
}
