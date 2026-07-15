import { provideBrowserGlobalErrorListeners } from '@angular/core';
import type { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { RUNTIME_CONFIG, type RuntimeConfig } from './core/config/runtime-config';
import { routes } from './app.routes';

export const createAppConfig = (runtimeConfig: RuntimeConfig): ApplicationConfig => ({
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: RUNTIME_CONFIG, useValue: runtimeConfig },
  ],
});
