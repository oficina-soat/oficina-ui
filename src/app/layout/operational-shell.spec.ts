import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { SessionStore } from '../core/auth/session.store';
import { ApiAvailabilityStore } from '../core/http/api-availability.store';
import { LOGOUT_USER } from '../features/auth/public-api';
import { OperationalShell } from './operational-shell';

const tokenWithRoles = (roles: readonly string[]): string =>
  `header.${btoa(JSON.stringify({ sub: '84191404067', groups: roles })).replace(/=/g, '')}.signature`;

describe('OperationalShell', () => {
  it('monta identidade e menu administrativo a partir dos papéis da sessão', async () => {
    await TestBed.configureTestingModule({
      imports: [OperationalShell],
      providers: [provideRouter([]), { provide: LOGOUT_USER, useValue: { execute: vi.fn() } }],
    }).compileComponents();
    TestBed.inject(SessionStore).start(tokenWithRoles(['administrativo', 'mecanico']), 3600);
    const fixture = TestBed.createComponent(OperationalShell);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Usuário ***.***.***-67 · Administrativo · Mecânico',
    );
    expect(fixture.nativeElement.textContent).toContain('Ativação de credencial');
  });

  it('apresenta indisponibilidade técnica global sem substituir o conteúdo', async () => {
    await TestBed.configureTestingModule({
      imports: [OperationalShell],
      providers: [provideRouter([]), { provide: LOGOUT_USER, useValue: { execute: vi.fn() } }],
    }).compileComponents();
    TestBed.inject(SessionStore).start(tokenWithRoles(['mecanico']), 3600);
    TestBed.inject(ApiAvailabilityStore).report('corr-1');
    const fixture = TestBed.createComponent(OperationalShell);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Serviços temporariamente indisponíveis');
    expect(fixture.nativeElement.textContent).toContain('corr-1');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
