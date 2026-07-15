import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CREATE_CLIENT, LIST_CLIENTS } from '../../attendance.providers';
import { Clients } from './clients';

describe('Clients', () => {
  it('lista somente a página retornada pela API e mascara o documento', async () => {
    const listClients = {
      execute: vi.fn().mockResolvedValue({
        items: [{ id: 'cliente-1', nome: 'Ana', documento: '12345678901' }],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      }),
    };
    await TestBed.configureTestingModule({
      imports: [Clients],
      providers: [
        { provide: LIST_CLIENTS, useValue: listClients },
        { provide: CREATE_CLIENT, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Clients);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listClients.execute).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(fixture.nativeElement.textContent).toContain('Ana');
    expect(fixture.nativeElement.textContent).toContain('***.***.***-01');
    expect(fixture.nativeElement.textContent).not.toContain('12345678901');
  });

  it('cadastra e recarrega a página sem incluir campos opcionais vazios', async () => {
    const listClients = {
      execute: vi.fn().mockResolvedValue({
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
      }),
    };
    const createClient = {
      execute: vi.fn().mockResolvedValue({
        id: 'cliente-1',
        nome: 'Ana',
        documento: '12345678901',
      }),
    };
    await TestBed.configureTestingModule({
      imports: [Clients],
      providers: [
        { provide: LIST_CLIENTS, useValue: listClients },
        { provide: CREATE_CLIENT, useValue: createClient },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Clients);
    fixture.detectChanges();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.page-header button') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      nome: 'Ana',
      documento: '12345678901',
      telefone: '',
      email: '',
    });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(createClient.execute).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Ana', documento: '12345678901' }),
    );
    const command = createClient.execute.mock.calls[0]?.[0];
    expect(command).not.toHaveProperty('telefone');
    expect(command).not.toHaveProperty('email');
    expect(command.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(listClients.execute).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('cadastrado com sucesso');
  });
});
