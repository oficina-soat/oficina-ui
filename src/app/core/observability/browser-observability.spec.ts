import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RUNTIME_CONFIG } from '../config/runtime-config';
import { ApiError } from '../http/api-error';
import { BrowserObservability, SafeErrorHandler } from './browser-observability';

describe('BrowserObservability', () => {
  const sendBeacon = vi.fn(() => true);

  afterEach(() => {
    vi.restoreAllMocks();
    sendBeacon.mockClear();
  });

  const configure = (enabled = true): BrowserObservability => {
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RUNTIME_CONFIG,
          useValue: {
            apiBaseUrl: '/api/v1',
            authBaseUrl: '',
            ...(enabled
              ? {
                  observability: {
                    endpoint: 'https://telemetry.example/events',
                    environment: 'lab',
                    release: 'abc123',
                  },
                }
              : {}),
          },
        },
        SafeErrorHandler,
      ],
    });
    return TestBed.inject(BrowserObservability);
  };

  it('envia falha de API somente com metadados seguros e correlationId', async () => {
    const observability = configure();
    observability.recordApiError(
      new ApiError(
        503,
        'UNAVAILABLE',
        'CPF 84191404067 e token eyJsegredo não podem sair',
        'corr-503',
        [],
      ),
      'get',
    );

    expect(sendBeacon).toHaveBeenCalledOnce();
    const [endpoint, blob] = sendBeacon.mock.calls[0] as unknown as [string, Blob];
    const payload = await blob.text();
    expect(endpoint).toBe('https://telemetry.example/events');
    expect(JSON.parse(payload)).toMatchObject({
      schemaVersion: 1,
      environment: 'lab',
      release: 'abc123',
      event: {
        kind: 'api_error',
        method: 'GET',
        status: 503,
        code: 'UNAVAILABLE',
        correlationId: 'corr-503',
      },
    });
    expect(payload).not.toContain('84191404067');
    expect(payload).not.toContain('eyJsegredo');
  });

  it('não envia nem persiste eventos quando o coletor não está configurado', () => {
    const observability = configure(false);
    observability.recordUnhandledError();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('substitui o log global por mensagem genérica', () => {
    const observability = configure();
    const record = vi.spyOn(observability, 'recordUnhandledError');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.inject(SafeErrorHandler).handleError(new Error('segredo'));

    expect(record).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      'Ocorreu uma falha inesperada na interface operacional.',
    );
  });
});
