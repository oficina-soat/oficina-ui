import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { idempotentCommandContext } from '../../../core/http/request-context';
import type { BillingGateway, Budget, BudgetDecision, Payment } from '../application';
import type { Orcamento, Pagamento } from './generated/types.gen';

const mapBudget = (value: Orcamento): Budget => ({
  id: value.orcamentoId,
  workOrderId: value.ordemServicoId,
  items: value.itens.map((item) => ({
    id: item.itemId,
    name: item.nome,
    type: item.tipo,
    quantity: item.quantidade,
    unitValue: item.valorUnitario,
    totalValue: item.valorTotal,
  })),
  totalValue: value.valorTotal,
  status: value.status,
  updatedAt: value.atualizadoEm,
  allowedActions: value.acoesPermitidas,
});
const mapPayment = (value: Pagamento): Payment => ({
  id: value.pagamentoId,
  budgetId: value.orcamentoId,
  value: value.valor,
  method: value.metodo,
  status: value.status,
  ...(value.provedor ? { provider: value.provedor } : {}),
  ...(value.transacaoExternaId ? { externalTransactionId: value.transacaoExternaId } : {}),
  ...(value.instrucoesPix
    ? {
        pixInstructions: {
          copyAndPaste: value.instrucoesPix.copiaECola,
          ...(value.instrucoesPix.qrCodeBase64
            ? { qrCodeBase64: value.instrucoesPix.qrCodeBase64 }
            : {}),
          ...(value.instrucoesPix.ticketUrl ? { ticketUrl: value.instrucoesPix.ticketUrl } : {}),
          ...(value.instrucoesPix.expiraEm ? { expiresAt: value.instrucoesPix.expiraEm } : {}),
        },
      }
    : {}),
  updatedAt: value.atualizadoEm,
  allowedActions: value.acoesPermitidas,
});

@Injectable({ providedIn: 'root' })
export class BillingApiAdapter implements BillingGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);
  async getWorkOrderState(workOrderId: string): Promise<string> {
    const value = await firstValueFrom(
      this.http.get<{ estado: string }>(
        `${this.config.apiBaseUrl}/ordens-servico/${encodeURIComponent(workOrderId)}`,
      ),
    );
    return value.estado;
  }
  async listBudgets(workOrderId: string): Promise<readonly Budget[]> {
    const values = await firstValueFrom(
      this.http.get<Orcamento[]>(
        `${this.config.apiBaseUrl}/ordens-servico/${encodeURIComponent(workOrderId)}/orcamentos`,
      ),
    );
    return values.map(mapBudget);
  }
  async listPayments(workOrderId: string): Promise<readonly Payment[]> {
    const values = await firstValueFrom(
      this.http.get<Pagamento[]>(
        `${this.config.apiBaseUrl}/ordens-servico/${encodeURIComponent(workOrderId)}/pagamentos`,
      ),
    );
    return values.map(mapPayment);
  }
  async reconcilePayment(paymentId: string, idempotencyKey: string): Promise<Payment> {
    const value = await firstValueFrom(
      this.http.post<Pagamento>(
        `${this.config.apiBaseUrl}/pagamentos/${encodeURIComponent(paymentId)}/reconciliacao`,
        {},
        { context: idempotentCommandContext(idempotencyKey) },
      ),
    );
    return mapPayment(value);
  }
  async resendBudgetEmail(budgetId: string, idempotencyKey: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(
        `${this.config.apiBaseUrl}/orcamentos/${encodeURIComponent(budgetId)}/notificacao/reenvio`,
        {},
        { context: idempotentCommandContext(idempotencyKey) },
      ),
    );
  }
  approveBudget(command: BudgetDecision): Promise<Budget> {
    return this.decide(command, 'aprovacao');
  }
  rejectBudget(command: BudgetDecision): Promise<Budget> {
    return this.decide(command, 'recusa');
  }
  private async decide(command: BudgetDecision, action: string): Promise<Budget> {
    const value = await firstValueFrom(
      this.http.post<Orcamento>(
        `${this.config.apiBaseUrl}/orcamentos/${encodeURIComponent(command.budgetId)}/${action}`,
        command.reason ? { motivo: command.reason } : {},
        { context: idempotentCommandContext(command.idempotencyKey) },
      ),
    );
    return mapBudget(value);
  }
}
