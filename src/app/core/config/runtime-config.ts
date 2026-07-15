import { InjectionToken } from '@angular/core';

export interface RuntimeConfig {
  readonly apiBaseUrl: string;
  readonly authBaseUrl: string;
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG');

const isRuntimeConfig = (value: unknown): value is RuntimeConfig => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['apiBaseUrl'] === 'string' &&
    candidate['apiBaseUrl'].length > 0 &&
    typeof candidate['authBaseUrl'] === 'string' &&
    candidate['authBaseUrl'].length > 0
  );
};

export const loadRuntimeConfig = async (): Promise<RuntimeConfig> => {
  const response = await fetch('/config/runtime-config.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Configuração de runtime indisponível: HTTP ${response.status}`);
  }

  const config: unknown = await response.json();
  if (!isRuntimeConfig(config)) {
    throw new Error('Configuração de runtime inválida.');
  }
  return config;
};
