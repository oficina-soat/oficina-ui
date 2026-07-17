import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { LIST_EXECUTION_QUEUE } from '../execution.providers';
import { ExecutionQueue } from './execution-queue';

const entries = [
  {
    id: 'execucao-2',
    ordemServicoId: 'ordem-2',
    status: 'EM_DIAGNOSTICO' as const,
    prioridade: 1,
    posicao: 1,
    criadoEm: '2026-07-15T12:00:00Z',
  },
  {
    id: 'execucao-1',
    ordemServicoId: 'ordem-1',
    status: 'CRIADA' as const,
    prioridade: 10,
    posicao: 2,
    criadoEm: '2026-07-15T11:00:00Z',
  },
];

describe('ExecutionQueue', () => {
  it('preserva a ordem da API e atualiza manualmente com o filtro selecionado', async () => {
    const list = { execute: vi.fn().mockResolvedValue(entries) };
    await TestBed.configureTestingModule({
      imports: [ExecutionQueue],
      providers: [provideRouter([]), { provide: LIST_EXECUTION_QUEUE, useValue: list }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExecutionQueue);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(2);
    });

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Em diagnóstico');
    expect(rows[1].textContent).toContain('Criada');
    expect(list.execute).toHaveBeenCalledWith({});

    const select = fixture.nativeElement.querySelector('#execution-status') as HTMLSelectElement;
    select.value = 'CRIADA';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(list.execute).toHaveBeenLastCalledWith({ status: 'CRIADA' });
    expect(select.value).toBe('CRIADA');
  });
});
