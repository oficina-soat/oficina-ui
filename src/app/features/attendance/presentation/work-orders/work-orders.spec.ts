import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { GET_WORK_ORDER, LIST_WORK_ORDERS, OPEN_WORK_ORDER } from '../../attendance.providers';
import { NewWorkOrder } from './new-work-order';
import { WorkOrderDetail } from './work-order-detail';
import { WorkOrders } from './work-orders';

const order = {
  id: 'ordem-1',
  clienteId: 'cliente-1',
  veiculoId: 'veiculo-1',
  problemDescription: 'Veículo não liga',
  state: 'RECEBIDA' as const,
  createdAt: '2026-07-15T12:00:00Z',
  updatedAt: '2026-07-15T12:00:00Z',
};

describe('WorkOrders', () => {
  it('lista a página e apresenta o estado retornado pela API', async () => {
    const list = {
      execute: vi.fn().mockResolvedValue({
        items: [order],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      }),
    };
    await TestBed.configureTestingModule({
      imports: [WorkOrders],
      providers: [provideRouter([]), { provide: LIST_WORK_ORDERS, useValue: list }],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrders);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(list.execute).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(fixture.nativeElement.textContent).toContain('Recebida');
    expect(fixture.nativeElement.textContent).toContain('Veículo não liga');
  });

  it('aplica o estado selecionado sem recarregar ou limpar o formulário', async () => {
    const list = {
      execute: vi.fn().mockResolvedValue({
        items: [order],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      }),
    };
    await TestBed.configureTestingModule({
      imports: [WorkOrders],
      providers: [provideRouter([]), { provide: LIST_WORK_ORDERS, useValue: list }],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrders);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#order-state') as HTMLSelectElement;
    select.value = 'RECEBIDA';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(list.execute).toHaveBeenLastCalledWith({ page: 0, size: 20, state: 'RECEBIDA' });
    expect(select.value).toBe('RECEBIDA');
  });

  it('abre a OS com o vínculo da URL e navega ao resultado canônico', async () => {
    const open = { execute: vi.fn().mockResolvedValue(order) };
    const route = {
      snapshot: {
        queryParamMap: convertToParamMap({ clienteId: 'cliente-1', veiculoId: 'veiculo-1' }),
      },
    };
    await TestBed.configureTestingModule({
      imports: [NewWorkOrder],
      providers: [
        provideRouter([]),
        { provide: OPEN_WORK_ORDER, useValue: open },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(NewWorkOrder);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ description: 'Veículo não liga' });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(open.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'cliente-1',
        veiculoId: 'veiculo-1',
        problemDescription: 'Veículo não liga',
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/ordens-servico', 'ordem-1']);
  });

  it('consulta a OS por identificador sem carregar histórico antecipadamente', async () => {
    const get = { execute: vi.fn().mockResolvedValue(order) };
    const route = {
      snapshot: { paramMap: convertToParamMap({ ordemServicoId: 'ordem-1' }) },
    };
    await TestBed.configureTestingModule({
      imports: [WorkOrderDetail],
      providers: [
        provideRouter([]),
        { provide: GET_WORK_ORDER, useValue: get },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrderDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(get.execute).toHaveBeenCalledWith('ordem-1');
    expect(fixture.nativeElement.textContent).toContain('Veículo não liga');
    expect(fixture.nativeElement.textContent).toContain('Histórico e ações');
  });
});
