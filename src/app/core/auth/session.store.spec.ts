import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionStore } from './session.store';

describe('SessionStore', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
    sessionStorage.clear();
  });

  it('mantém a sessão na aba e a encerra ao expirar', () => {
    vi.useFakeTimers();
    const store = TestBed.inject(SessionStore);
    store.start('jwt', 2);
    expect(store.authenticated()).toBe(true);
    expect(store.accessToken()).toBe('jwt');
    expect(sessionStorage.getItem('oficina.auth.session')).toContain('jwt');

    vi.advanceTimersByTime(2000);
    expect(store.authenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(sessionStorage.getItem('oficina.auth.session')).toBeNull();
  });

  it('restaura uma sessão válida depois de uma recarga da aplicação', () => {
    const expiresAt = Date.now() + 60_000;
    sessionStorage.setItem(
      'oficina.auth.session',
      JSON.stringify({ accessToken: 'jwt', expiresAt }),
    );

    const store = TestBed.inject(SessionStore);

    expect(store.authenticated()).toBe(true);
    expect(store.accessToken()).toBe('jwt');
    expect(store.session()?.expiresAt).toBe(expiresAt);
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
