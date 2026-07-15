import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { authenticatedGuard, roleGuard } from './auth.guards';
import { SessionStore } from './session.store';

@Component({ template: '' })
class RouteTarget {}

const tokenWithRoles = (roles: readonly string[]): string =>
  `header.${btoa(JSON.stringify({ groups: roles })).replace(/=/g, '')}.signature`;

const configureRouter = (): void => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'login', component: RouteTarget },
        { path: 'acesso-negado', component: RouteTarget },
        { path: 'session', component: RouteTarget, canActivate: [authenticatedGuard] },
        {
          path: 'admin',
          component: RouteTarget,
          canActivate: [authenticatedGuard, roleGuard],
          data: { roles: ['administrativo'] },
        },
      ]),
    ],
  });
};

describe('guards de autenticação', () => {
  it('redireciona visitante ao login preservando a rota de retorno', async () => {
    configureRouter();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/session');

    expect(router.url).toBe('/login?returnUrl=%2Fsession');
  });

  it('permite a navegação visual somente para um papel apresentado no JWT', async () => {
    configureRouter();
    const router = TestBed.inject(Router);
    TestBed.inject(SessionStore).start(tokenWithRoles(['mecanico']), 3600);

    await router.navigateByUrl('/admin');

    expect(router.url).toBe('/acesso-negado');
  });

  it('permite a área administrativa quando o papel é apresentado', async () => {
    configureRouter();
    const router = TestBed.inject(Router);
    TestBed.inject(SessionStore).start(tokenWithRoles(['administrativo']), 3600);

    await router.navigateByUrl('/admin');

    expect(router.url).toBe('/admin');
  });
});
