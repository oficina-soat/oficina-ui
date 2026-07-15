import { inject, InjectionToken } from '@angular/core';

import {
  ActivateCredential,
  AuthenticateUser,
  LogoutUser,
  RequestCredentialActivation,
} from './application';
import { AuthApiAdapter, BrowserAuthSessionAdapter } from './infrastructure';

export const AUTHENTICATE_USER = new InjectionToken<AuthenticateUser>('AUTHENTICATE_USER', {
  providedIn: 'root',
  factory: () => new AuthenticateUser(inject(AuthApiAdapter), inject(BrowserAuthSessionAdapter)),
});

export const LOGOUT_USER = new InjectionToken<LogoutUser>('LOGOUT_USER', {
  providedIn: 'root',
  factory: () => new LogoutUser(inject(BrowserAuthSessionAdapter)),
});

export const REQUEST_CREDENTIAL_ACTIVATION = new InjectionToken<RequestCredentialActivation>(
  'REQUEST_CREDENTIAL_ACTIVATION',
  {
    providedIn: 'root',
    factory: () => new RequestCredentialActivation(inject(AuthApiAdapter)),
  },
);

export const ACTIVATE_CREDENTIAL = new InjectionToken<ActivateCredential>('ACTIVATE_CREDENTIAL', {
  providedIn: 'root',
  factory: () => new ActivateCredential(inject(AuthApiAdapter)),
});
