import type { OperationalRole } from '../../../core/auth/session-identity';

export interface SnapshotMetadata {
  readonly generatedAt: string;
  readonly dataAsOf: string;
  readonly refreshAfterSeconds?: number;
}

export interface CountItem {
  readonly key: string;
  readonly quantity: number;
}

export interface WorkOrderAttention {
  readonly id: string;
  readonly state: string;
  readonly description: string;
  readonly enteredStateAt: string;
}

export interface WorkOrdersSnapshot extends SnapshotMetadata {
  readonly counts: readonly CountItem[];
  readonly attentions: readonly WorkOrderAttention[];
}

export interface ExecutionAttention {
  readonly id: string;
  readonly workOrderId: string;
  readonly status: string;
  readonly position: number;
}

export interface StockAttention {
  readonly id: string;
  readonly name: string;
  readonly balance: number;
  readonly threshold: number;
}

export interface ExecutionSnapshot extends SnapshotMetadata {
  readonly counts: readonly CountItem[];
  readonly queueTotal: number;
  readonly nextExecutions: readonly ExecutionAttention[];
  readonly stockAttentions: readonly StockAttention[];
}

export interface BillingAttention {
  readonly type: string;
  readonly workOrderId: string;
  readonly referenceId: string;
  readonly status: string;
  readonly value: number;
  readonly updatedAt: string;
}

export interface BillingSnapshot extends SnapshotMetadata {
  readonly budgetCounts: readonly CountItem[];
  readonly paymentCounts: readonly CountItem[];
  readonly attentions: readonly BillingAttention[];
}

export interface UserAttention {
  readonly id: string;
  readonly name?: string;
  readonly status: string;
  readonly updatedAt: string;
}

export interface UsersSnapshot extends SnapshotMetadata {
  readonly counts: readonly CountItem[];
  readonly attentions: readonly UserAttention[];
}

export interface CredentialsSnapshot extends SnapshotMetadata {
  readonly counts: readonly CountItem[];
  readonly attentions: readonly UserAttention[];
}

export interface DashboardGateway {
  workOrders(): Promise<WorkOrdersSnapshot>;
  execution(): Promise<ExecutionSnapshot>;
  billing(): Promise<BillingSnapshot>;
  users(): Promise<UsersSnapshot>;
  credentials(): Promise<CredentialsSnapshot>;
}

export type DashboardBlock = 'workOrders' | 'execution' | 'billing' | 'users' | 'credentials';
export interface DashboardResult {
  readonly workOrders?: WorkOrdersSnapshot;
  readonly execution?: ExecutionSnapshot;
  readonly billing?: BillingSnapshot;
  readonly users?: UsersSnapshot;
  readonly credentials?: CredentialsSnapshot;
}

export class LoadOperationalDashboard {
  constructor(private readonly gateway: DashboardGateway) {}

  async execute(roles: readonly OperationalRole[]): Promise<DashboardResult> {
    const requests: readonly (readonly [DashboardBlock, () => Promise<unknown>])[] = [
      ['workOrders', () => this.gateway.workOrders()],
      ...(roles.some((role) => role === 'administrativo' || role === 'mecanico')
        ? ([['execution', () => this.gateway.execution()]] as const)
        : []),
      ...(roles.some((role) => role === 'administrativo' || role === 'recepcionista')
        ? ([['billing', () => this.gateway.billing()]] as const)
        : []),
      ...(roles.includes('administrativo')
        ? ([
            ['users', () => this.gateway.users()],
            ['credentials', () => this.gateway.credentials()],
          ] as const)
        : []),
    ];
    const settled = await Promise.allSettled(requests.map(([, request]) => request()));
    return Object.fromEntries(
      requests.flatMap(([block], index) => {
        const result = settled[index];
        return result?.status === 'fulfilled' ? [[block, result.value]] : [];
      }),
    ) as DashboardResult;
  }
}
