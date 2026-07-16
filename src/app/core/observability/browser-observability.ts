import { DOCUMENT } from '@angular/common';
import { inject, Injectable, type ErrorHandler } from '@angular/core';

import { RUNTIME_CONFIG } from '../config/runtime-config';
import type { ApiError } from '../http/api-error';

type MetricName =
  | 'navigation'
  | 'largest_contentful_paint'
  | 'cumulative_layout_shift'
  | 'interaction_to_next_paint';
type TelemetryEvent =
  | { readonly kind: 'browser_error'; readonly errorType: 'angular' }
  | {
      readonly kind: 'api_error';
      readonly method: string;
      readonly status: number;
      readonly code: string;
      readonly correlationId: string | null;
    }
  | { readonly kind: 'web_vital'; readonly metric: MetricName; readonly value: number };

interface EventEnvelope {
  readonly schemaVersion: 1;
  readonly eventId: string;
  readonly occurredAt: string;
  readonly environment: string;
  readonly release: string;
  readonly event: TelemetryEvent;
}

interface LayoutShiftEntry extends PerformanceEntry {
  readonly hadRecentInput: boolean;
  readonly value: number;
}

interface InteractionEntry extends PerformanceEntry {
  readonly interactionId: number;
}

const safeText = (value: string, fallback: string): string =>
  /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : fallback;

@Injectable({ providedIn: 'root' })
export class BrowserObservability {
  private readonly config = inject(RUNTIME_CONFIG).observability;
  private readonly window = inject(DOCUMENT).defaultView;
  private started = false;
  private layoutShift = 0;
  private largestContentfulPaint = 0;
  private interactionToNextPaint = 0;

  start(): void {
    if (this.started || !this.config || !this.window) return;
    this.started = true;
    this.observePerformance();
    this.window.addEventListener('pagehide', () => this.flushFinalMetrics(), { once: true });
  }

  recordApiError(error: ApiError, method: string): void {
    this.send({
      kind: 'api_error',
      method: safeText(method.toUpperCase(), 'UNKNOWN'),
      status: Number.isInteger(error.status) ? error.status : 0,
      code: safeText(error.code, 'HTTP_ERROR'),
      correlationId: error.correlationId
        ? safeText(error.correlationId, 'invalid-correlation-id')
        : null,
    });
  }

  recordUnhandledError(): void {
    this.send({ kind: 'browser_error', errorType: 'angular' });
  }

  private observePerformance(): void {
    const PerformanceObserverType = this.window?.PerformanceObserver;
    if (!PerformanceObserverType) return;
    this.observe(PerformanceObserverType, 'navigation', (entry) =>
      this.recordMetric('navigation', entry.duration),
    );
    this.observe(PerformanceObserverType, 'largest-contentful-paint', (entry) => {
      this.largestContentfulPaint = Math.max(this.largestContentfulPaint, entry.startTime);
    });
    this.observe(PerformanceObserverType, 'layout-shift', (entry) => {
      const shift = entry as LayoutShiftEntry;
      if (!shift.hadRecentInput) this.layoutShift += shift.value;
    });
    this.observe(PerformanceObserverType, 'event', (entry) => {
      const interaction = entry as InteractionEntry;
      if (interaction.interactionId > 0) {
        this.interactionToNextPaint = Math.max(this.interactionToNextPaint, entry.duration);
      }
    });
  }

  private observe(
    Observer: typeof PerformanceObserver,
    type: string,
    handle: (entry: PerformanceEntry) => void,
  ): void {
    try {
      const observer = new Observer((list) => list.getEntries().forEach(handle));
      observer.observe({ type, buffered: true });
    } catch {
      // Um entry type ausente nunca pode impedir o uso da interface.
    }
  }

  private flushFinalMetrics(): void {
    if (this.largestContentfulPaint > 0) {
      this.recordMetric('largest_contentful_paint', this.largestContentfulPaint);
    }
    if (this.layoutShift > 0) {
      this.recordMetric('cumulative_layout_shift', this.layoutShift);
    }
    if (this.interactionToNextPaint > 0) {
      this.recordMetric('interaction_to_next_paint', this.interactionToNextPaint);
    }
  }

  private recordMetric(metric: MetricName, value: number): void {
    if (!Number.isFinite(value) || value < 0) return;
    this.send({ kind: 'web_vital', metric, value: Math.round(value * 1000) / 1000 });
  }

  private send(event: TelemetryEvent): void {
    if (!this.config || !this.window?.navigator.sendBeacon) return;
    const envelope: EventEnvelope = {
      schemaVersion: 1,
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      environment: safeText(this.config.environment, 'unknown'),
      release: safeText(this.config.release, 'unknown'),
      event,
    };
    const body = new Blob([JSON.stringify(envelope)], { type: 'application/json' });
    this.window.navigator.sendBeacon(this.config.endpoint, body);
  }
}

@Injectable()
export class SafeErrorHandler implements ErrorHandler {
  private readonly observability = inject(BrowserObservability);

  handleError(_error: unknown): void {
    this.observability.recordUnhandledError();
    console.error('Ocorreu uma falha inesperada na interface operacional.');
  }
}
