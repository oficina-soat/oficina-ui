import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { idempotencyInterceptor } from '../../../core/http/api.interceptors';
import { BillingApiAdapter } from './billing-api.adapter';
describe('BillingApiAdapter', () => {
  let http: HttpTestingController;
  let adapter: BillingApiAdapter;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor])),
        provideHttpClientTesting(),
        {
          provide: RUNTIME_CONFIG,
          useValue: { apiBaseUrl: 'https://api.example/api/v1', authBaseUrl: '' },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    adapter = TestBed.inject(BillingApiAdapter);
  });
  it('preserva ações canônicas e envia decisão idempotente', async () => {
    const state = adapter.getWorkOrderState('os/1');
    http
      .expectOne('https://api.example/api/v1/ordens-servico/os%2F1')
      .flush({ estado: 'AGUARDANDO_APROVACAO' });
    await expect(state).resolves.toBe('AGUARDANDO_APROVACAO');
    const result = adapter.listBudgets('os/1');
    http.expectOne('https://api.example/api/v1/ordens-servico/os%2F1/orcamentos').flush([
      {
        orcamentoId: 'b1',
        ordemServicoId: 'os/1',
        itens: [],
        valorTotal: 10,
        status: 'GERADO',
        criadoEm: '2026-01-01T00:00:00Z',
        atualizadoEm: '2026-01-01T00:00:00Z',
        acoesPermitidas: ['APROVAR'],
      },
    ]);
    await expect(result).resolves.toMatchObject([{ allowedActions: ['APROVAR'] }]);
    const payments = adapter.listPayments('os/1');
    http.expectOne('https://api.example/api/v1/ordens-servico/os%2F1/pagamentos').flush([
      {
        pagamentoId: 'p1',
        ordemServicoId: 'os/1',
        orcamentoId: 'b1',
        valor: 10,
        metodo: 'PIX',
        status: 'CRIADO',
        provedor: 'mercado-pago',
        transacaoExternaId: 'external-1',
        instrucoesPix: {
          copiaECola: 'pix-code',
          ticketUrl: 'https://sandbox.mercadopago.com/payment/1',
          expiraEm: '2026-01-01T00:30:00Z',
        },
        criadoEm: '2026-01-01T00:00:00Z',
        atualizadoEm: '2026-01-01T00:00:00Z',
        acoesPermitidas: ['ATUALIZAR_STATUS'],
      },
    ]);
    await expect(payments).resolves.toMatchObject([
      {
        id: 'p1',
        provider: 'mercado-pago',
        externalTransactionId: 'external-1',
        allowedActions: ['ATUALIZAR_STATUS'],
        pixInstructions: { copyAndPaste: 'pix-code' },
      },
    ]);
    const reconciliation = adapter.reconcilePayment('p/1', 'key-payment');
    const reconciliationRequest = http.expectOne(
      'https://api.example/api/v1/pagamentos/p%2F1/reconciliacao',
    );
    expect(reconciliationRequest.request.headers.get('X-Idempotency-Key')).toBe('key-payment');
    reconciliationRequest.flush({
      pagamentoId: 'p/1',
      ordemServicoId: 'os/1',
      orcamentoId: 'b1',
      valor: 10,
      metodo: 'PIX',
      status: 'CONFIRMADO',
      provedor: 'mercado-pago',
      transacaoExternaId: 'external-1',
      criadoEm: '2026-01-01T00:00:00Z',
      atualizadoEm: '2026-01-01T00:01:00Z',
      acoesPermitidas: [],
    });
    await expect(reconciliation).resolves.toMatchObject({ status: 'CONFIRMADO' });
    const decision = adapter.approveBudget({ budgetId: 'b1', idempotencyKey: 'key-1' });
    const request = http.expectOne('https://api.example/api/v1/orcamentos/b1/aprovacao');
    expect(request.request.headers.get('X-Idempotency-Key')).toBe('key-1');
    request.flush({
      orcamentoId: 'b1',
      ordemServicoId: 'os-1',
      itens: [],
      valorTotal: 10,
      status: 'APROVADO',
      criadoEm: '2026-01-01T00:00:00Z',
      atualizadoEm: '2026-01-01T00:00:00Z',
      acoesPermitidas: [],
    });
    await expect(decision).resolves.toMatchObject({ status: 'APROVADO', allowedActions: [] });
  });
});
