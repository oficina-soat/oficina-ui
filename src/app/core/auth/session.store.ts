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

interface StoredSession {
  readonly accessToken: string;
  readonly expiresAt: number;
}

const SESSION_STORAGE_KEY = 'oficina.auth.session';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly sessionState = signal<ActiveSession | null>(this.restore());
  private expirationTimer: ReturnType<typeof setTimeout> | undefined;
  readonly session = this.sessionState.asReadonly();
  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);
  readonly authenticated = computed(() => this.sessionState() !== null);
  readonly identity = computed(() => this.sessionState()?.identity ?? null);

  constructor() {
    const session = this.sessionState();
    if (session !== null) {
      this.scheduleExpiration(session.expiresAt - Date.now());
    }
  }

  start(accessToken: string, expiresInSeconds: number): void {
    this.clearTimer();
    const duration = Math.max(0, expiresInSeconds * 1000);
    const session = {
      accessToken,
      expiresAt: Date.now() + duration,
      identity: readSessionIdentity(accessToken),
    };
    this.sessionState.set(session);
    this.persist(session);
    this.scheduleExpiration(duration);
  }

  hasAnyRole(roles: readonly OperationalRole[]): boolean {
    const assignedRoles = this.identity()?.roles ?? [];
    return roles.some((role) => assignedRoles.includes(role));
  }

  clear(): void {
    this.clearTimer();
    this.sessionState.set(null);
    this.storage()?.removeItem(SESSION_STORAGE_KEY);
  }

  private restore(): ActiveSession | null {
    const storage = this.storage();
    if (storage === null) return null;

    try {
      const value = storage.getItem(SESSION_STORAGE_KEY);
      if (value === null) return null;
      const stored = JSON.parse(value) as Partial<StoredSession>;
      if (
        typeof stored.accessToken !== 'string' ||
        typeof stored.expiresAt !== 'number' ||
        stored.expiresAt <= Date.now()
      ) {
        storage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return {
        accessToken: stored.accessToken,
        expiresAt: stored.expiresAt,
        identity: readSessionIdentity(stored.accessToken),
      };
    } catch {
      storage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private persist(session: ActiveSession): void {
    this.storage()?.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: session.accessToken, expiresAt: session.expiresAt }),
    );
  }

  private storage(): Storage | null {
    try {
      return globalThis.sessionStorage ?? null;
    } catch {
      return null;
    }
  }

  private scheduleExpiration(duration: number): void {
    this.expirationTimer = setTimeout(() => this.clear(), Math.max(0, duration));
  }

  private clearTimer(): void {
    if (this.expirationTimer !== undefined) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = undefined;
    }
  }
}
