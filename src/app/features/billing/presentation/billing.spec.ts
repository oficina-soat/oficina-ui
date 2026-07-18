import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  APPROVE_BUDGET,
  GET_WORK_ORDER_BILLING,
  RECONCILE_PAYMENT,
  REJECT_BUDGET,
} from '../billing.providers';
import { Billing } from './billing';
registerLocaleData(localePt);
describe('Billing', () => {
  it('exibe somente decisões oferecidas pelo backend', async () => {
    const approve = vi.fn().mockResolvedValue({
      id: 'b1',
      workOrderId: 'os-1',
      items: [],
      totalValue: 100,
      status: 'APROVADO',
      updatedAt: '2026-01-01T01:00:00Z',
      allowedActions: [],
    });
    await TestBed.configureTestingModule({
      imports: [Billing],
      providers: [
        {
          provide: GET_WORK_ORDER_BILLING,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              workOrderState: 'AGUARDANDO_APROVACAO',
              budgets: [
                {
                  id: 'b1',
                  workOrderId: 'os-1',
                  items: [],
                  totalValue: 100,
                  status: 'GERADO',
                  updatedAt: '2026-01-01T00:00:00Z',
                  allowedActions: ['APROVAR'],
                },
              ],
              payments: [],
            }),
          },
        },
        { provide: APPROVE_BUDGET, useValue: { execute: approve } },
        { provide: REJECT_BUDGET, useValue: { execute: vi.fn() } },
        { provide: RECONCILE_PAYMENT, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Billing);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'os-1';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aprovar orçamento');
    expect(fixture.nativeElement.textContent).not.toContain('Recusar orçamento');
    (fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(approve).toHaveBeenCalledWith(expect.objectContaining({ budgetId: 'b1' }));
    expect(fixture.nativeElement.textContent).toContain('Orçamento aprovado.');
  });

  it('apresenta falha canônica de consulta sem inventar dados', async () => {
    await TestBed.configureTestingModule({
      imports: [Billing],
      providers: [
        {
          provide: GET_WORK_ORDER_BILLING,
          useValue: { execute: vi.fn().mockRejectedValue(new Error('indisponível')) },
        },
        { provide: APPROVE_BUDGET, useValue: { execute: vi.fn() } },
        { provide: REJECT_BUDGET, useValue: { execute: vi.fn() } },
        { provide: RECONCILE_PAYMENT, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Billing);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'os-1';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível consultar o faturamento');
  });

  it('apresenta pagamento e executa recusa somente quando oferecida', async () => {
    const reject = vi.fn().mockResolvedValue({
      id: 'b2',
      workOrderId: 'os-2',
      items: [],
      totalValue: 50,
      status: 'RECUSADO',
      updatedAt: '2026-01-01T01:00:00Z',
      allowedActions: [],
    });
    await TestBed.configureTestingModule({
      imports: [Billing],
      providers: [
        {
          provide: GET_WORK_ORDER_BILLING,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              workOrderState: 'AGUARDANDO_APROVACAO',
              budgets: [
                {
                  id: 'b2',
                  workOrderId: 'os-2',
                  items: [],
                  totalValue: 50,
                  status: 'GERADO',
                  updatedAt: '2026-01-01T00:00:00Z',
                  allowedActions: ['RECUSAR'],
                },
              ],
              payments: [
                {
                  id: 'p1',
                  budgetId: 'b2',
                  value: 50,
                  method: 'PIX',
                  status: 'CRIADO',
                  updatedAt: '2026-01-01T00:00:00Z',
                  allowedActions: [],
                },
              ],
            }),
          },
        },
        { provide: APPROVE_BUDGET, useValue: { execute: vi.fn() } },
        { provide: REJECT_BUDGET, useValue: { execute: reject } },
        { provide: RECONCILE_PAYMENT, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Billing);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'os-2';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('PIX');
    (fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(reject).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Orçamento recusado.');
  });

  it('apresenta instruções PIX e reconcilia somente pela ação canônica', async () => {
    const reconcile = vi.fn().mockResolvedValue({
      id: 'p2',
      budgetId: 'b2',
      value: 50,
      method: 'PIX',
      status: 'CONFIRMADO',
      updatedAt: '2026-01-01T00:01:00Z',
      allowedActions: [],
    });
    await TestBed.configureTestingModule({
      imports: [Billing],
      providers: [
        {
          provide: GET_WORK_ORDER_BILLING,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              workOrderState: 'AGUARDANDO_PAGAMENTO',
              budgets: [],
              payments: [
                {
                  id: 'p2',
                  budgetId: 'b2',
                  value: 50,
                  method: 'PIX',
                  status: 'CRIADO',
                  updatedAt: '2026-01-01T00:00:00Z',
                  allowedActions: ['ATUALIZAR_STATUS'],
                  pixInstructions: {
                    copyAndPaste: '000201-pix-teste',
                    ticketUrl: 'https://sandbox.mercadopago.com/payment/2',
                    expiresAt: '2026-01-01T00:30:00Z',
                  },
                },
              ],
            }),
          },
        },
        { provide: APPROVE_BUDGET, useValue: { execute: vi.fn() } },
        { provide: REJECT_BUDGET, useValue: { execute: vi.fn() } },
        { provide: RECONCILE_PAYMENT, useValue: { execute: reconcile } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Billing);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'os-2';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Código PIX copia e cola');
    expect(fixture.nativeElement.querySelector('textarea').value).toBe('000201-pix-teste');
    const update = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Atualizar situação'),
    ) as HTMLButtonElement;
    update.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(reconcile).toHaveBeenCalledWith('p2', expect.any(String));
    expect(fixture.nativeElement.textContent).toContain('Continuar para registrar entrega');
  });
});
