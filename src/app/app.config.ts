import {
  ErrorHandler,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import type { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';

import { RUNTIME_CONFIG, type RuntimeConfig } from './core/config/runtime-config';
import {
  apiErrorInterceptor,
  authInterceptor,
  correlationInterceptor,
  idempotencyInterceptor,
} from './core/http/api.interceptors';
import { BrowserObservability, SafeErrorHandler } from './core/observability/browser-observability';
import { routes } from './app.routes';

registerLocaleData(localePt);

export const createAppConfig = (runtimeConfig: RuntimeConfig): ApplicationConfig => ({
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideEnvironmentInitializer(() => inject(BrowserObservability).start()),
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
    { provide: ErrorHandler, useClass: SafeErrorHandler },
  ],
});
