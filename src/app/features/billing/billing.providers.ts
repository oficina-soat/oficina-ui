import { inject, InjectionToken } from '@angular/core';
import {
  ApproveBudget,
  GetWorkOrderBilling,
  ReconcilePayment,
  RejectBudget,
  ResendBudgetEmail,
} from './application';
import { BillingApiAdapter } from './infrastructure';
export const GET_WORK_ORDER_BILLING = new InjectionToken<GetWorkOrderBilling>(
  'GET_WORK_ORDER_BILLING',
  { providedIn: 'root', factory: () => new GetWorkOrderBilling(inject(BillingApiAdapter)) },
);
export const APPROVE_BUDGET = new InjectionToken<ApproveBudget>('APPROVE_BUDGET', {
  providedIn: 'root',
  factory: () => new ApproveBudget(inject(BillingApiAdapter)),
});
export const REJECT_BUDGET = new InjectionToken<RejectBudget>('REJECT_BUDGET', {
  providedIn: 'root',
  factory: () => new RejectBudget(inject(BillingApiAdapter)),
});
export const RESEND_BUDGET_EMAIL = new InjectionToken<ResendBudgetEmail>('RESEND_BUDGET_EMAIL', {
  providedIn: 'root',
  factory: () => new ResendBudgetEmail(inject(BillingApiAdapter)),
});
export const RECONCILE_PAYMENT = new InjectionToken<ReconcilePayment>('RECONCILE_PAYMENT', {
  providedIn: 'root',
  factory: () => new ReconcilePayment(inject(BillingApiAdapter)),
});
