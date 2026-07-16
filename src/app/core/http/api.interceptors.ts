import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';

import { SessionStore } from '../auth/session.store';
import { BrowserObservability } from '../observability/browser-observability';
import { ApiAvailabilityStore } from './api-availability.store';
import { toApiError } from './api-error';
import { IDEMPOTENCY_KEY, SKIP_AUTH } from './request-context';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const accessToken = inject(SessionStore).accessToken();
  if (!accessToken || request.context.get(SKIP_AUTH)) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));
};

export const correlationInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.headers.has('X-Correlation-Id')) return next(request);
  return next(request.clone({ setHeaders: { 'X-Correlation-Id': crypto.randomUUID() } }));
};

export const idempotencyInterceptor: HttpInterceptorFn = (request, next) => {
  const key = request.context.get(IDEMPOTENCY_KEY);
  if (
    !key ||
    !['POST', 'PATCH'].includes(request.method) ||
    request.headers.has('X-Idempotency-Key')
  ) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { 'X-Idempotency-Key': key } }));
};

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const availability = inject(ApiAvailabilityStore);
  const observability = inject(BrowserObservability);
  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) availability.clear();
    }),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const apiError = toApiError(error.status, error.error, error.headers.get('X-Correlation-Id'));
      observability.recordApiError(apiError, request.method);
      if (error.status === 0 || error.status >= 500) {
        availability.report(apiError.correlationId);
      }
      return throwError(() => apiError);
    }),
  );
};
