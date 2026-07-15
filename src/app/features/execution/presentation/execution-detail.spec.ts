import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import {
  CANCEL_EXECUTION,
  COMPLETE_DIAGNOSIS,
  COMPLETE_REPAIR,
  GET_EXECUTION,
  START_DIAGNOSIS,
  START_REPAIR,
} from '../execution.providers';
import { ExecutionDetail } from './execution-detail';

const execution = {
  id: 'execucao-1',
  ordemServicoId: 'ordem-1',
  status: 'CRIADA' as const,
  prioridade: 10,
  criadoEm: '2026-07-15T12:00:00Z',
  atualizadoEm: '2026-07-15T12:00:00Z',
  allowedActions: ['INICIAR_DIAGNOSTICO', 'CANCELAR'] as const,
};

describe('ExecutionDetail', () => {
  it('consulta a execução e delega o início do diagnóstico à API', async () => {
    const get = { execute: vi.fn().mockResolvedValue(execution) };
    const start = {
      execute: vi.fn().mockResolvedValue({
        ...execution,
        status: 'EM_DIAGNOSTICO',
        allowedActions: ['CONCLUIR_DIAGNOSTICO', 'CANCELAR'],
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
        { provide: START_DIAGNOSIS, useValue: start },
        { provide: COMPLETE_DIAGNOSIS, useValue: { execute: vi.fn() } },
        { provide: START_REPAIR, useValue: { execute: vi.fn() } },
        { provide: COMPLETE_REPAIR, useValue: { execute: vi.fn() } },
        { provide: CANCEL_EXECUTION, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExecutionDetail);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Criada');
    });

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
    expect(button.hidden).toBe(true);
    const completeButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (item: HTMLButtonElement) => item.textContent?.includes('Concluir diagnóstico'),
    ) as HTMLButtonElement;
    expect(completeButton.hidden).toBe(false);
  });
});
