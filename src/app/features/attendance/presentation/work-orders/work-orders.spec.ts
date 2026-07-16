import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import {
  CANCEL_WORK_ORDER,
  CHANGE_WORK_ORDER_STATE,
  GET_WORK_ORDER,
  GET_WORK_ORDER_HISTORY,
  LIST_WORK_ORDERS,
  OPEN_WORK_ORDER,
  ADD_WORK_ORDER_SERVICE,
  ADD_WORK_ORDER_PART,
} from '../../attendance.providers';
import { LIST_CATALOG_SERVICES, LIST_STOCK_PARTS } from '../../../execution/public-api';
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
  allowedActions: ['INICIAR_DIAGNOSTICO', 'CANCELAR'] as const,
  services: [],
  parts: [],
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

  it('consulta a OS por identificador com histórico e ações delegadas à API', async () => {
    const get = { execute: vi.fn().mockResolvedValue(order) };
    const getHistory = {
      execute: vi
        .fn()
        .mockResolvedValue([
          { state: 'RECEBIDA', occurredAt: '2026-07-15T12:00:00Z', reason: 'OS aberta' },
        ]),
    };
    const route = {
      snapshot: { paramMap: convertToParamMap({ ordemServicoId: 'ordem-1' }) },
    };
    await TestBed.configureTestingModule({
      imports: [WorkOrderDetail],
      providers: [
        provideRouter([]),
        { provide: GET_WORK_ORDER, useValue: get },
        { provide: GET_WORK_ORDER_HISTORY, useValue: getHistory },
        { provide: CHANGE_WORK_ORDER_STATE, useValue: { execute: vi.fn() } },
        { provide: CANCEL_WORK_ORDER, useValue: { execute: vi.fn() } },
        { provide: ADD_WORK_ORDER_SERVICE, useValue: { execute: vi.fn() } },
        { provide: ADD_WORK_ORDER_PART, useValue: { execute: vi.fn() } },
        { provide: LIST_CATALOG_SERVICES, useValue: { execute: vi.fn() } },
        { provide: LIST_STOCK_PARTS, useValue: { execute: vi.fn() } },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrderDetail);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Veículo não liga');
    });

    expect(get.execute).toHaveBeenCalledWith('ordem-1');
    expect(getHistory.execute).toHaveBeenCalledWith('ordem-1');
    expect(fixture.nativeElement.textContent).toContain('OS aberta');
    expect(fixture.nativeElement.textContent).toContain('Ações da OS');
    const states = [...fixture.nativeElement.querySelectorAll('#next-state option')].map(
      (option: HTMLOptionElement) => option.value,
    );
    expect(states).toEqual(['', 'EM_DIAGNOSTICO']);
    expect(fixture.nativeElement.querySelector('.cancel-action')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#service-id')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#part-id')).toBeFalsy();
  });

  it('pesquisa e inclui somente os tipos de item oferecidos pela API', async () => {
    const composable = {
      ...order,
      state: 'EM_DIAGNOSTICO' as const,
      allowedActions: ['INCLUIR_SERVICO', 'INCLUIR_PECA', 'CONCLUIR_DIAGNOSTICO'] as const,
    };
    const addService = {
      execute: vi.fn().mockResolvedValue({
        ...composable,
        services: [
          {
            serviceId: 'servico-1',
            name: 'Revisão',
            quantity: 1,
            unitPrice: 150,
            totalPrice: 150,
          },
        ],
      }),
    };
    const addPart = { execute: vi.fn().mockResolvedValue(composable) };
    const route = { snapshot: { paramMap: convertToParamMap({ ordemServicoId: 'ordem-1' }) } };
    await TestBed.configureTestingModule({
      imports: [WorkOrderDetail],
      providers: [
        provideRouter([]),
        { provide: GET_WORK_ORDER, useValue: { execute: vi.fn().mockResolvedValue(composable) } },
        { provide: GET_WORK_ORDER_HISTORY, useValue: { execute: vi.fn().mockResolvedValue([]) } },
        { provide: CHANGE_WORK_ORDER_STATE, useValue: { execute: vi.fn() } },
        { provide: CANCEL_WORK_ORDER, useValue: { execute: vi.fn() } },
        { provide: ADD_WORK_ORDER_SERVICE, useValue: addService },
        { provide: ADD_WORK_ORDER_PART, useValue: addPart },
        {
          provide: LIST_CATALOG_SERVICES,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              items: [{ id: 'servico-1', name: 'Revisão', basePrice: 150, active: true }],
              page: 0,
              size: 50,
              totalElements: 1,
              totalPages: 1,
            }),
          },
        },
        {
          provide: LIST_STOCK_PARTS,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              items: [{ id: 'peca-1', name: 'Filtro', code: 'FIL', unitPrice: 30, active: true }],
              page: 0,
              size: 50,
              totalElements: 1,
              totalPages: 1,
            }),
          },
        },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrderDetail);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#service-id')).toBeTruthy();
    });

    const select = fixture.nativeElement.querySelector('#service-id') as HTMLSelectElement;
    select.value = 'servico-1';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.closest('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(addService.execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ordem-1', serviceId: 'servico-1', quantity: 1 }),
    );
    expect(fixture.nativeElement.textContent).toContain('Revisão');
    expect(fixture.nativeElement.querySelector('#part-id')).toBeTruthy();
  });
});
