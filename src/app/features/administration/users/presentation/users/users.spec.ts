import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { LIST_USERS } from '../../public-api';
import { Users } from './users';

describe('Users', () => {
  it('lista usuários e envia filtros remotos sem expor o CPF completo na tabela', async () => {
    const list = {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            id: 'user-1',
            personId: 'person-1',
            name: 'Ana Operadora',
            document: '52998224725',
            status: 'ATIVO',
            roles: ['mecanico'],
            allowedActions: ['ATUALIZAR_DADOS'],
            createdAt: '2026-07-16T00:00:00Z',
            updatedAt: '2026-07-16T00:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      }),
    };
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [provideRouter([]), { provide: LIST_USERS, useValue: list }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Users);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana Operadora');
    expect(fixture.nativeElement.textContent).toContain('***.***.***-25');
    expect(fixture.nativeElement.textContent).not.toContain('52998224725');

    fixture.componentInstance.filters.setValue({
      name: 'Ana',
      document: '52998224725',
      status: 'ATIVO',
      role: 'mecanico',
    });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(list.execute).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      name: 'Ana',
      document: '52998224725',
      status: 'ATIVO',
      role: 'mecanico',
    });
  });
});
