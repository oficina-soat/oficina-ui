import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExecutionApiAdapter } from './execution-api.adapter';

describe('ExecutionApiAdapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('preserva o estado canônico retornado para a fila', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              execucaoId: 'execucao-1',
              ordemServicoId: 'os-1',
              status: 'CRIADA',
              prioridade: 10,
              posicao: 1,
              criadoEm: '2026-07-15T12:00:00Z',
              atualizadoEm: '2026-07-15T12:00:00Z',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const queue = await new ExecutionApiAdapter({
      apiBaseUrl: 'https://api.example/api/v1',
      authBaseUrl: 'https://auth.example',
    }).consultarFila();

    expect(queue).toEqual([
      {
        id: 'execucao-1',
        ordemServicoId: 'os-1',
        status: 'CRIADA',
        prioridade: 10,
        posicao: 1,
        criadoEm: '2026-07-15T12:00:00Z',
      },
    ]);
  });
});
