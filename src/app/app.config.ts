import { provideBrowserGlobalErrorListeners } from '@angular/core';
import type { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { RUNTIME_CONFIG, type RuntimeConfig } from './core/config/runtime-config';
import {
  apiErrorInterceptor,
  authInterceptor,
  correlationInterceptor,
  idempotencyInterceptor,
} from './core/http/api.interceptors';
import { routes } from './app.routes';

export const createAppConfig = (runtimeConfig: RuntimeConfig): ApplicationConfig => ({
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        correlationInterceptor,
        idempotencyInterceptor,
        apiErrorInterceptor,
      ]),
    ),
    { provide: RUNTIME_CONFIG, useValue: runtimeConfig },
  ],
});
