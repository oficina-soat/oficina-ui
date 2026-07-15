import { inject, InjectionToken } from '@angular/core';

import { AuthenticateUser, LogoutUser } from './application';
import { AuthApiAdapter, BrowserAuthSessionAdapter } from './infrastructure';

export const AUTHENTICATE_USER = new InjectionToken<AuthenticateUser>('AUTHENTICATE_USER', {
  providedIn: 'root',
  factory: () => new AuthenticateUser(inject(AuthApiAdapter), inject(BrowserAuthSessionAdapter)),
});

export const LOGOUT_USER = new InjectionToken<LogoutUser>('LOGOUT_USER', {
  providedIn: 'root',
  factory: () => new LogoutUser(inject(BrowserAuthSessionAdapter)),
});
