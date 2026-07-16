import { TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import {
  GET_STOCK_BALANCE,
  LIST_STOCK_MOVEMENTS,
  LIST_STOCK_PARTS,
  REGISTER_STOCK_ENTRY,
} from '../execution.providers';
import { Stock } from './stock';

registerLocaleData(localePt);

describe('Stock', () => {
  it('mostra entrada somente quando a ação é retornada pelo backend', async () => {
    const list = {
      execute: vi.fn().mockResolvedValue({
        items: [{ id: 'peca-1', name: 'Bateria', code: 'BAT', unitPrice: 300, active: true }],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      }),
    };
    const balance = {
      execute: vi.fn().mockResolvedValue({
        partId: 'peca-1',
        available: 4,
        reserved: 1,
        updatedAt: '2026-01-01T00:00:00Z',
        allowedActions: ['REGISTRAR_ENTRADA'],
      }),
    };
    await TestBed.configureTestingModule({
      imports: [Stock],
      providers: [
        provideRouter([]),
        { provide: LIST_STOCK_PARTS, useValue: list },
        { provide: GET_STOCK_BALANCE, useValue: balance },
        {
          provide: LIST_STOCK_MOVEMENTS,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
          },
        },
        { provide: REGISTER_STOCK_ENTRY, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Stock);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Registrar entrada');
  });
});
