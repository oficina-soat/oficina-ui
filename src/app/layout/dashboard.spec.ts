import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { LIST_CLIENTS, LIST_WORK_ORDERS } from '../features/attendance/public-api';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  it('apresenta totais e ordens recentes retornados pelas APIs', async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: LIST_CLIENTS,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              items: [],
              page: 0,
              size: 1,
              totalItems: 8,
              totalPages: 8,
            }),
          },
        },
        {
          provide: LIST_WORK_ORDERS,
          useValue: {
            execute: vi.fn().mockResolvedValue({
              items: [
                {
                  id: 'f05dd17b-0000-4000-8000-000000000001',
                  clienteId: 'cliente-1',
                  veiculoId: 'veiculo-1',
                  problemDescription: 'Veículo não liga',
                  state: 'RECEBIDA',
                  createdAt: '2026-07-15T12:00:00Z',
                  updatedAt: '2026-07-15T12:00:00Z',
                },
              ],
              page: 0,
              size: 3,
              totalItems: 8,
              totalPages: 3,
            }),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Clientes');
    });

    expect(fixture.nativeElement.textContent).toContain('Ordens de serviço');
    expect(fixture.nativeElement.textContent).toContain('Veículo não liga');
    expect(fixture.nativeElement.textContent).toContain('Recebida');
  });
});
