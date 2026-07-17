import { describe, expect, it, vi } from 'vitest';
import type { DashboardGateway } from './dashboard';
import { LoadOperationalDashboard } from './dashboard';

const snapshot = {
  generatedAt: '2026-07-17T12:00:00Z',
  dataAsOf: '2026-07-17T12:00:00Z',
  counts: [],
  attentions: [],
};
const gateway = (): DashboardGateway => ({
  workOrders: vi.fn().mockResolvedValue(snapshot),
  execution: vi
    .fn()
    .mockResolvedValue({ ...snapshot, queueTotal: 0, nextExecutions: [], stockAttentions: [] }),
  billing: vi.fn().mockResolvedValue({ ...snapshot, budgetCounts: [], paymentCounts: [] }),
  users: vi.fn().mockResolvedValue(snapshot),
  credentials: vi.fn().mockResolvedValue(snapshot),
});

describe('LoadOperationalDashboard', () => {
  it('consulta somente as autoridades visíveis ao papel operacional', async () => {
    const port = gateway();
    const result = await new LoadOperationalDashboard(port).execute(['recepcionista']);
    expect(Object.keys(result)).toEqual(['workOrders', 'billing']);
    expect(port.execution).not.toHaveBeenCalled();
    expect(port.users).not.toHaveBeenCalled();
  });

  it('preserva os blocos disponíveis quando uma autoridade falha', async () => {
    const port = gateway();
    vi.mocked(port.credentials).mockRejectedValue(new Error('indisponível'));
    const result = await new LoadOperationalDashboard(port).execute(['administrativo']);
    expect(result.workOrders).toBeDefined();
    expect(result.credentials).toBeUndefined();
  });

  it('consulta somente ordens e execução para o mecânico', async () => {
    const port = gateway();
    const result = await new LoadOperationalDashboard(port).execute(['mecanico']);

    expect(Object.keys(result)).toEqual(['workOrders', 'execution']);
    expect(port.billing).not.toHaveBeenCalled();
    expect(port.credentials).not.toHaveBeenCalled();
  });
});
