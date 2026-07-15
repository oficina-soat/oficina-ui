export interface ApiErrorDetail {
  readonly field?: string;
  readonly code: string;
  readonly message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly correlationId: string | null,
    readonly details: readonly ApiErrorDetail[] = [],
    readonly reason?: string,
  ) {
    super(message);
  }
}

const stringValue = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const parseDetails = (value: unknown): readonly ApiErrorDetail[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const detail = item as Record<string, unknown>;
    const code = stringValue(detail, 'code');
    const message = stringValue(detail, 'message');
    if (!code || !message) return [];
    const field = stringValue(detail, 'field');
    return [{ code, message, ...(field ? { field } : {}) }];
  });
};

export const toApiError = (
  status: number,
  body: unknown,
  headerCorrelationId: string | null,
): ApiError => {
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    return new ApiError(
      status,
      stringValue(record, 'code') ?? 'HTTP_ERROR',
      stringValue(record, 'message') ?? 'Não foi possível concluir a operação.',
      stringValue(record, 'correlationId') ?? headerCorrelationId,
      parseDetails(record['details']),
      stringValue(record, 'motivo'),
    );
  }
  return new ApiError(
    status,
    'HTTP_ERROR',
    'Não foi possível concluir a operação.',
    headerCorrelationId,
  );
};
