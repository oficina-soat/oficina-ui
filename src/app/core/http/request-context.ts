import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
export const IDEMPOTENCY_KEY = new HttpContextToken<string | null>(() => null);

export const publicRequestContext = (): HttpContext => new HttpContext().set(SKIP_AUTH, true);

export const idempotentCommandContext = (key: string = crypto.randomUUID()): HttpContext =>
  new HttpContext().set(IDEMPOTENCY_KEY, key);
