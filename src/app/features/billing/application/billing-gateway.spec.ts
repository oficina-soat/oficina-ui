import { describe, expect, it, vi } from 'vitest';
import {
  ApproveBudget,
  GetWorkOrderBilling,
  RejectBudget,
  type BillingGateway,
} from './billing-gateway';
const gateway = (): BillingGateway => ({
  getWorkOrderState: vi.fn().mockResolvedValue('AGUARDANDO_APROVACAO'),
  listBudgets: vi.fn().mockResolvedValue([]),
  listPayments: vi.fn().mockResolvedValue([]),
  approveBudget: vi.fn().mockResolvedValue({ id: 'b1' }),
  rejectBudget: vi.fn().mockResolvedValue({ id: 'b1' }),
});
describe('casos de uso de faturamento', () => {
  it('delega consultas e decisões sem interpretar estados', async () => {
    const billing = gateway();
    await new GetWorkOrderBilling(billing).execute('os-1');
    const command = { budgetId: 'b1', idempotencyKey: 'key' };
    await new ApproveBudget(billing).execute(command);
    await new RejectBudget(billing).execute(command);
    expect(billing.listBudgets).toHaveBeenCalledWith('os-1');
    expect(billing.getWorkOrderState).toHaveBeenCalledWith('os-1');
    expect(billing.listPayments).toHaveBeenCalledWith('os-1');
    expect(billing.approveBudget).toHaveBeenCalledWith(command);
    expect(billing.rejectBudget).toHaveBeenCalledWith(command);
  });
});
