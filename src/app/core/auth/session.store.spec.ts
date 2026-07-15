import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionStore } from './session.store';

describe('SessionStore', () => {
  afterEach(() => vi.useRealTimers());

  it('mantém o token somente em memória e encerra a sessão ao expirar', () => {
    vi.useFakeTimers();
    const store = TestBed.inject(SessionStore);
    store.start('jwt', 2);
    expect(store.authenticated()).toBe(true);
    expect(store.accessToken()).toBe('jwt');

    vi.advanceTimersByTime(2000);
    expect(store.authenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
  });

  it('encerra a sessão explicitamente', () => {
    const store = TestBed.inject(SessionStore);
    store.start('jwt', 3600);
    store.clear();
    expect(store.session()).toBeNull();
  });
});
