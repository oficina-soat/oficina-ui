import { afterEach, describe, expect, it, vi } from 'vitest';

import { AttendanceApiAdapter } from './attendance-api.adapter';

describe('AttendanceApiAdapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('mapeia a página de clientes para o modelo da aplicação', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                clienteId: 'cliente-1',
                nome: 'Ana',
                documento: '12345678901',
                criadoEm: '2026-07-15T12:00:00Z',
                atualizadoEm: '2026-07-15T12:00:00Z',
              },
            ],
            page: 0,
            size: 20,
            totalItems: 1,
            totalPages: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const page = await new AttendanceApiAdapter({
      apiBaseUrl: 'https://api.example/api/v1',
      authBaseUrl: 'https://auth.example',
    }).consultarClientes({ page: 0, size: 20 });

    expect(page.items).toEqual([{ id: 'cliente-1', nome: 'Ana', documento: '12345678901' }]);
    expect(page.totalItems).toBe(1);
  });
});
