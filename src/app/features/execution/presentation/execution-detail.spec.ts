import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import {
  ADD_WORK_ORDER_PART,
  ADD_WORK_ORDER_SERVICE,
  GET_WORK_ORDER,
} from '../../attendance/public-api';
import {
  COMPLETE_DIAGNOSIS,
  COMPLETE_REPAIR,
  GET_EXECUTION,
  LIST_CATALOG_SERVICES,
  LIST_STOCK_PARTS,
  START_DIAGNOSIS,
} from '../execution.providers';
import { ExecutionDetail } from './execution-detail';

const execution = {
  id: 'execucao-1',
  ordemServicoId: 'ordem-1',
  status: 'CRIADA' as const,
  prioridade: 10,
  criadoEm: '2026-07-15T12:00:00Z',
  atualizadoEm: '2026-07-15T12:00:00Z',
  allowedActions: ['INICIAR_DIAGNOSTICO'] as const,
};

const order = {
  id: 'ordem-1',
  clienteId: 'cliente-1',
  veiculoId: 'veiculo-1',
  problemDescription: 'Ruído no motor',
  state: 'EM_DIAGNOSTICO' as const,
  createdAt: '2026-07-15T12:00:00Z',
  updatedAt: '2026-07-15T12:00:00Z',
  allowedActions: ['INCLUIR_SERVICO', 'INCLUIR_PECA'] as const,
  services: [],
  parts: [],
};

describe('ExecutionDetail', () => {
  it('consulta a execução e delega o início do diagnóstico à API', async () => {
    const get = { execute: vi.fn().mockResolvedValue(execution) };
    const start = {
      execute: vi.fn().mockResolvedValue({
        ...execution,
        status: 'EM_DIAGNOSTICO',
        allowedActions: ['CONCLUIR_DIAGNOSTICO'],
      }),
    };
    await TestBed.configureTestingModule({
      imports: [ExecutionDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ execucaoId: 'execucao-1' }) } },
        },
        { provide: GET_EXECUTION, useValue: get },
        { provide: GET_WORK_ORDER, useValue: { execute: vi.fn().mockResolvedValue(order) } },
        { provide: ADD_WORK_ORDER_SERVICE, useValue: { execute: vi.fn() } },
        { provide: ADD_WORK_ORDER_PART, useValue: { execute: vi.fn() } },
        {
          provide: LIST_CATALOG_SERVICES,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue({ items: [], page: 0, size: 50, totalElements: 0, totalPages: 0 }),
          },
        },
        {
          provide: LIST_STOCK_PARTS,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue({ items: [], page: 0, size: 50, totalElements: 0, totalPages: 0 }),
          },
        },
        { provide: START_DIAGNOSIS, useValue: start },
        { provide: COMPLETE_DIAGNOSIS, useValue: { execute: vi.fn() } },
        { provide: COMPLETE_REPAIR, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExecutionDetail);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Criada');
    });
    expect(fixture.nativeElement.textContent).toContain('Composição técnica da OS');
    expect(fixture.nativeElement.textContent).toContain('Incluir serviço');
    expect(fixture.nativeElement.textContent).toContain('Incluir peça');
    expect(fixture.nativeElement.textContent).not.toContain('Concluir diagnóstico');
    expect(fixture.nativeElement.textContent).not.toContain('Reparo');

    const button = [...fixture.nativeElement.querySelectorAll('button')].find(
      (item: HTMLButtonElement) => item.textContent?.includes('Iniciar diagnóstico'),
    ) as HTMLButtonElement;
    button.click();
    await vi.waitFor(() => expect(start.execute).toHaveBeenCalled());

    expect(start.execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'execucao-1', idempotencyKey: expect.any(String) }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Em diagnóstico');
    expect(fixture.nativeElement.textContent).not.toContain('Iniciar diagnóstico');
    const completeButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (item: HTMLButtonElement) => item.textContent?.includes('Concluir diagnóstico'),
    ) as HTMLButtonElement;
    expect(completeButton).toBeTruthy();
  });
});
