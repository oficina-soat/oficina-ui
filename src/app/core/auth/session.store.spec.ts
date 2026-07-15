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

  it('expõe os papéis decodificados somente para navegação visual', () => {
    const payload = btoa(
      JSON.stringify({ sub: '84191404067', groups: ['administrativo', 'recepcionista'] }),
    );
    const store = TestBed.inject(SessionStore);
    store.start(`header.${payload}.signature`, 3600);

    expect(store.identity()).toEqual({
      roles: ['administrativo', 'recepcionista'],
      maskedSubject: '***.***.***-67',
    });
    expect(store.hasAnyRole(['administrativo'])).toBe(true);
    expect(store.hasAnyRole(['mecanico'])).toBe(false);
    store.clear();
  });
});
