import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { CREATE_VEHICLE, LOAD_CLIENT_VEHICLES } from '../../attendance.providers';
import { Vehicles } from './vehicles';

const route = { snapshot: { paramMap: convertToParamMap({ clienteId: 'cliente-1' }) } };

describe('Vehicles', () => {
  it('lista os veículos retornados para o cliente da rota', async () => {
    const load = {
      execute: vi.fn().mockResolvedValue({
        client: { id: 'cliente-1', nome: 'Ana', documento: '12345678901' },
        vehicles: [
          {
            id: 'veiculo-1',
            clienteId: 'cliente-1',
            placa: 'ABC1D23',
            marca: 'Volkswagen',
            modelo: 'Gol',
            ano: 2020,
          },
        ],
      }),
    };
    await TestBed.configureTestingModule({
      imports: [Vehicles],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route },
        { provide: LOAD_CLIENT_VEHICLES, useValue: load },
        { provide: CREATE_VEHICLE, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Vehicles);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(load.execute).toHaveBeenCalledWith('cliente-1');
    expect(fixture.nativeElement.textContent).toContain('Ana');
    expect(fixture.nativeElement.textContent).toContain('ABC1D23');
  });

  it('cadastra o veículo mantendo o vínculo recebido na rota', async () => {
    const load = {
      execute: vi.fn().mockResolvedValue({
        client: { id: 'cliente-1', nome: 'Ana', documento: '12345678901' },
        vehicles: [],
      }),
    };
    const create = {
      execute: vi.fn().mockResolvedValue({
        id: 'veiculo-1',
        clienteId: 'cliente-1',
        placa: 'ABC1D23',
        marca: 'Volkswagen',
        modelo: 'Gol',
      }),
    };
    await TestBed.configureTestingModule({
      imports: [Vehicles],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route },
        { provide: LOAD_CLIENT_VEHICLES, useValue: load },
        { provide: CREATE_VEHICLE, useValue: create },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Vehicles);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.page-header button') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      placa: 'ABC1D23',
      marca: 'Volkswagen',
      modelo: 'Gol',
      ano: null,
    });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(create.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'cliente-1',
        placa: 'ABC1D23',
        marca: 'Volkswagen',
        modelo: 'Gol',
      }),
    );
    expect(create.execute.mock.calls[0]?.[0]).not.toHaveProperty('ano');
    expect(load.execute).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('cadastrado com sucesso');
  });
});
