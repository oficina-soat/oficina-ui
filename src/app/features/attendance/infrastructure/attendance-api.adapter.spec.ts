import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { apiErrorInterceptor, idempotencyInterceptor } from '../../../core/http/api.interceptors';
import { ClientOperationError } from '../application';
import { AttendanceApiAdapter } from './attendance-api.adapter';

describe('AttendanceApiAdapter', () => {
  let httpTesting: HttpTestingController;
  let adapter: AttendanceApiAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: RUNTIME_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example/api/v1',
            authBaseUrl: 'https://auth.example',
          },
        },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    adapter = TestBed.inject(AttendanceApiAdapter);
  });

  it('mapeia a página de clientes para o modelo da aplicação', async () => {
    const result = adapter.consultarClientes({ page: 0, size: 20 });
    const request = httpTesting.expectOne('https://api.example/api/v1/clientes?page=0&size=20');
    request.flush({
      items: [
        {
          clienteId: 'cliente-1',
          nome: 'Ana',
          documento: '12345678901',
          criadoEm: '2026-07-15T12:00:00Z',
          atualizadoEm: '2026-07-15T12:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    });

    const page = await result;
    expect(page.items).toEqual([{ id: 'cliente-1', nome: 'Ana', documento: '12345678901' }]);
    expect(page.totalItems).toBe(1);
  });

  it('cria cliente com a chave idempotente fornecida e omite campos ausentes', async () => {
    const result = adapter.criarCliente({
      nome: 'Ana',
      documento: '12345678901',
      idempotencyKey: 'command-key-123',
    });
    const request = httpTesting.expectOne('https://api.example/api/v1/clientes');
    expect(request.request.headers.get('X-Idempotency-Key')).toBe('command-key-123');
    expect(request.request.body).toEqual({ nome: 'Ana', documento: '12345678901' });
    request.flush({
      clienteId: 'cliente-1',
      nome: 'Ana',
      documento: '12345678901',
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T12:00:00Z',
    });

    await expect(result).resolves.toEqual({
      id: 'cliente-1',
      nome: 'Ana',
      documento: '12345678901',
    });
  });

  it('mapeia conflito de cadastro sem expor o DTO HTTP', async () => {
    const result = adapter.criarCliente({
      nome: 'Ana',
      documento: '12345678901',
      idempotencyKey: 'command-key-123',
    });
    httpTesting
      .expectOne('https://api.example/api/v1/clientes')
      .flush(
        { code: 'DUPLICATE', message: 'Cliente duplicado', timestamp: '2026-07-15T12:00:00Z' },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(result).rejects.toEqual(new ClientOperationError('DUPLICATE', null));
  });

  it('consulta cliente e veículos vinculados pelas rotas contratuais', async () => {
    const clientResult = adapter.consultarCliente('cliente/1');
    httpTesting.expectOne('https://api.example/api/v1/clientes/cliente%2F1').flush({
      clienteId: 'cliente-1',
      nome: 'Ana',
      documento: '12345678901',
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T12:00:00Z',
    });
    await expect(clientResult).resolves.toMatchObject({ id: 'cliente-1', nome: 'Ana' });

    const vehiclesResult = adapter.consultarVeiculos('cliente/1');
    httpTesting.expectOne('https://api.example/api/v1/clientes/cliente%2F1/veiculos').flush([
      {
        veiculoId: 'veiculo-1',
        clienteId: 'cliente-1',
        placa: 'ABC1D23',
        marca: 'Volkswagen',
        modelo: 'Gol',
        ano: 2020,
        criadoEm: '2026-07-15T12:00:00Z',
        atualizadoEm: '2026-07-15T12:00:00Z',
      },
    ]);
    await expect(vehiclesResult).resolves.toEqual([
      {
        id: 'veiculo-1',
        clienteId: 'cliente-1',
        placa: 'ABC1D23',
        marca: 'Volkswagen',
        modelo: 'Gol',
        ano: 2020,
      },
    ]);
  });

  it('cadastra veículo no cliente com idempotência', async () => {
    const result = adapter.criarVeiculo({
      clienteId: 'cliente-1',
      placa: 'ABC1D23',
      marca: 'Volkswagen',
      modelo: 'Gol',
      idempotencyKey: 'vehicle-key-123',
    });
    const request = httpTesting.expectOne('https://api.example/api/v1/clientes/cliente-1/veiculos');
    expect(request.request.headers.get('X-Idempotency-Key')).toBe('vehicle-key-123');
    expect(request.request.body).toEqual({ placa: 'ABC1D23', marca: 'Volkswagen', modelo: 'Gol' });
    request.flush({
      veiculoId: 'veiculo-1',
      clienteId: 'cliente-1',
      placa: 'ABC1D23',
      marca: 'Volkswagen',
      modelo: 'Gol',
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T12:00:00Z',
    });
    await expect(result).resolves.toMatchObject({ id: 'veiculo-1', clienteId: 'cliente-1' });
  });
});
