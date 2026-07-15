import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly accessTokenState = signal<string | null>(null);
  readonly accessToken = this.accessTokenState.asReadonly();

  setAccessToken(accessToken: string): void {
    this.accessTokenState.set(accessToken);
  }

  clear(): void {
    this.accessTokenState.set(null);
  }
}
