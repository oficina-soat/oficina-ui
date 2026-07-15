import { Injectable, signal } from '@angular/core';

export interface ApiUnavailableState {
  readonly correlationId: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiAvailabilityStore {
  private readonly unavailableState = signal<ApiUnavailableState | null>(null);
  readonly unavailable = this.unavailableState.asReadonly();

  report(correlationId: string | null): void {
    this.unavailableState.set({ correlationId });
  }

  clear(): void {
    this.unavailableState.set(null);
  }
}
