import { computed, Injectable, signal } from '@angular/core';

export interface ActiveSession {
  readonly accessToken: string;
  readonly expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly sessionState = signal<ActiveSession | null>(null);
  private expirationTimer: ReturnType<typeof setTimeout> | undefined;
  readonly session = this.sessionState.asReadonly();
  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);
  readonly authenticated = computed(() => this.sessionState() !== null);

  start(accessToken: string, expiresInSeconds: number): void {
    this.clearTimer();
    const duration = Math.max(0, expiresInSeconds * 1000);
    this.sessionState.set({ accessToken, expiresAt: Date.now() + duration });
    this.expirationTimer = setTimeout(() => this.clear(), duration);
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
