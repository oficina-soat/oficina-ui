import { HttpErrorResponse } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { SessionStore } from '../auth/session.store';
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

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      return throwError(() =>
        toApiError(error.status, error.error, error.headers.get('X-Correlation-Id')),
      );
    }),
  );
