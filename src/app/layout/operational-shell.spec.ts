import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it, vi } from 'vitest';

import { SessionStore } from '../core/auth/session.store';
import { ApiAvailabilityStore } from '../core/http/api-availability.store';
import { LOGOUT_USER } from '../features/auth/public-api';
import { LIST_CLIENTS, LIST_WORK_ORDERS } from '../features/attendance/public-api';
import { Dashboard } from './dashboard';
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
    expect(fixture.nativeElement.textContent).toContain('Usuários');
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

  it('projeta o dashboard ativado pela rota dentro do shell', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: OperationalShell,
            children: [{ path: 'session', component: Dashboard }],
          },
        ]),
        { provide: LOGOUT_USER, useValue: { execute: vi.fn() } },
        {
          provide: LIST_CLIENTS,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              items: [],
              page: 0,
              size: 1,
              totalItems: 8,
              totalPages: 8,
            }),
          },
        },
        {
          provide: LIST_WORK_ORDERS,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              items: [],
              page: 0,
              size: 3,
              totalItems: 8,
              totalPages: 3,
            }),
          },
        },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create('/session');
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Visão operacional');
    });
    expect(harness.routeNativeElement?.textContent).toContain('Clientes');
    expect(harness.routeNativeElement?.textContent).toContain('8');
  });
});
