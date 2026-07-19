import { describe, expect, it, vi } from 'vitest';
import {
  ApproveBudget,
  GetWorkOrderBilling,
  RejectBudget,
  ReconcilePayment,
  ResendBudgetEmail,
  type BillingGateway,
} from './billing-gateway';
const gateway = (): BillingGateway => ({
  getWorkOrderState: vi.fn().mockResolvedValue('AGUARDANDO_APROVACAO'),
  listBudgets: vi.fn().mockResolvedValue([]),
  listPayments: vi.fn().mockResolvedValue([]),
  approveBudget: vi.fn().mockResolvedValue({ id: 'b1' }),
  rejectBudget: vi.fn().mockResolvedValue({ id: 'b1' }),
  resendBudgetEmail: vi.fn().mockResolvedValue(undefined),
  reconcilePayment: vi.fn().mockResolvedValue({ id: 'p1' }),
});
describe('casos de uso de faturamento', () => {
  it('delega consultas e decisões sem interpretar estados', async () => {
    const billing = gateway();
    await new GetWorkOrderBilling(billing).execute('os-1');
    const command = { budgetId: 'b1', idempotencyKey: 'key' };
    await new ApproveBudget(billing).execute(command);
    await new RejectBudget(billing).execute(command);
    await new ResendBudgetEmail(billing).execute('b1', 'key-email');
    await new ReconcilePayment(billing).execute('p1', 'key-2');
    expect(billing.listBudgets).toHaveBeenCalledWith('os-1');
    expect(billing.getWorkOrderState).toHaveBeenCalledWith('os-1');
    expect(billing.listPayments).toHaveBeenCalledWith('os-1');
    expect(billing.approveBudget).toHaveBeenCalledWith(command);
    expect(billing.rejectBudget).toHaveBeenCalledWith(command);
    expect(billing.resendBudgetEmail).toHaveBeenCalledWith('b1', 'key-email');
    expect(billing.reconcilePayment).toHaveBeenCalledWith('p1', 'key-2');
  });
});
