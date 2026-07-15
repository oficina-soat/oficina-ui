import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import type { OperationalRole } from './session-identity';
import { SessionStore } from './session.store';

export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  if (session.authenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard: CanActivateFn = (route) => {
  const roles = route.data['roles'];
  if (!isOperationalRoleList(roles)) return inject(Router).createUrlTree(['/acesso-negado']);
  return inject(SessionStore).hasAnyRole(roles)
    ? true
    : inject(Router).createUrlTree(['/acesso-negado']);
};

const isOperationalRoleList = (value: unknown): value is readonly OperationalRole[] =>
  Array.isArray(value) && value.every(isOperationalRole);

const isOperationalRole = (value: unknown): value is OperationalRole =>
  value === 'administrativo' || value === 'mecanico' || value === 'recepcionista';
