export type BudgetStatus = 'GERADO' | 'APROVADO' | 'RECUSADO';
export type BudgetAction = 'APROVAR' | 'RECUSAR';
export interface BudgetItem {
  readonly id: string;
  readonly name: string;
  readonly type: 'PECA' | 'SERVICO';
  readonly quantity: number;
  readonly unitValue: number;
  readonly totalValue: number;
}
export interface Budget {
  readonly id: string;
  readonly workOrderId: string;
  readonly items: readonly BudgetItem[];
  readonly totalValue: number;
  readonly status: BudgetStatus;
  readonly updatedAt: string;
  readonly allowedActions: readonly BudgetAction[];
}
export type PaymentStatus = 'CRIADO' | 'CONFIRMADO' | 'RECUSADO' | 'CANCELADO';
export interface Payment {
  readonly id: string;
  readonly budgetId: string;
  readonly value: number;
  readonly method: string;
  readonly status: PaymentStatus;
  readonly provider?: string;
  readonly externalTransactionId?: string;
  readonly updatedAt: string;
}
export interface BudgetDecision {
  readonly budgetId: string;
  readonly reason?: string;
  readonly idempotencyKey: string;
}
export interface BillingGateway {
  getWorkOrderState(workOrderId: string): Promise<string>;
  listBudgets(workOrderId: string): Promise<readonly Budget[]>;
  approveBudget(command: BudgetDecision): Promise<Budget>;
  rejectBudget(command: BudgetDecision): Promise<Budget>;
  listPayments(workOrderId: string): Promise<readonly Payment[]>;
}
export class GetWorkOrderBilling {
  constructor(private readonly gateway: BillingGateway) {}
  async execute(
    workOrderId: string,
  ): Promise<{ workOrderState: string; budgets: readonly Budget[]; payments: readonly Payment[] }> {
    const [workOrderState, budgets, payments] = await Promise.all([
      this.gateway.getWorkOrderState(workOrderId),
      this.gateway.listBudgets(workOrderId),
      this.gateway.listPayments(workOrderId),
    ]);
    return { workOrderState, budgets, payments };
  }
}
export class ApproveBudget {
  constructor(private readonly gateway: BillingGateway) {}
  execute(command: BudgetDecision): Promise<Budget> {
    return this.gateway.approveBudget(command);
  }
}
export class RejectBudget {
  constructor(private readonly gateway: BillingGateway) {}
  execute(command: BudgetDecision): Promise<Budget> {
    return this.gateway.rejectBudget(command);
  }
}
