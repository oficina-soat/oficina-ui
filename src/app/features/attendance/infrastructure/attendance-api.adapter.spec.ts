import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { apiErrorInterceptor, idempotencyInterceptor } from '../../../core/http/api.interceptors';
import { ClientOperationError } from '../application';
import { AttendanceApiAdapter } from './attendance-api.adapter';
import type { OrdemServico } from './generated/types.gen';

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
    const result = adapter.consultarClientes({
      page: 0,
      size: 20,
      nome: 'Ana',
      documento: '12345678901',
      email: 'ana@example.com',
    });
    const request = httpTesting.expectOne(
      'https://api.example/api/v1/clientes?page=0&size=20&nome=Ana&documento=12345678901&email=ana@example.com',
    );
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

  it('lista ordens com paginação e filtro canônico de estado', async () => {
    const result = adapter.listarOrdensServico({ page: 1, size: 20, state: 'RECEBIDA' });
    const request = httpTesting.expectOne(
      'https://api.example/api/v1/ordens-servico?page=1&size=20&estado=RECEBIDA',
    );
    request.flush({
      items: [
        {
          ordemServicoId: 'os-1',
          clienteId: 'cliente-1',
          veiculoId: 'veiculo-1',
          descricaoProblema: 'Não liga',
          estado: 'RECEBIDA',
          criadoEm: '2026-07-15T12:00:00Z',
          atualizadoEm: '2026-07-15T12:00:00Z',
        },
      ],
      page: 1,
      size: 20,
      totalItems: 21,
      totalPages: 2,
    });
    await expect(result).resolves.toMatchObject({
      page: 1,
      totalItems: 21,
      items: [{ id: 'os-1', state: 'RECEBIDA' }],
    });
  });

  it('abre e consulta ordem de serviço pelas rotas contratuais', async () => {
    const openResult = adapter.abrirOrdemServico({
      clienteId: 'cliente-1',
      veiculoId: 'veiculo-1',
      problemDescription: 'Não liga',
      idempotencyKey: 'order-key-123',
    });
    const openRequest = httpTesting.expectOne('https://api.example/api/v1/ordens-servico');
    expect(openRequest.request.headers.get('X-Idempotency-Key')).toBe('order-key-123');
    expect(openRequest.request.body).toEqual({
      clienteId: 'cliente-1',
      veiculoId: 'veiculo-1',
      descricaoProblema: 'Não liga',
    });
    openRequest.flush({
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      veiculoId: 'veiculo-1',
      descricaoProblema: 'Não liga',
      estado: 'RECEBIDA',
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T12:00:00Z',
    });
    await expect(openResult).resolves.toMatchObject({ id: 'os-1' });

    const getResult = adapter.consultarOrdemServico('os/1');
    httpTesting.expectOne('https://api.example/api/v1/ordens-servico/os%2F1').flush({
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      veiculoId: 'veiculo-1',
      descricaoProblema: 'Não liga',
      estado: 'RECEBIDA',
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T12:00:00Z',
    });
    await expect(getResult).resolves.toMatchObject({ id: 'os-1', problemDescription: 'Não liga' });
  });

  it('consulta histórico e envia ações da OS com idempotência', async () => {
    const historyResult = adapter.consultarHistoricoOrdemServico('os/1');
    httpTesting.expectOne('https://api.example/api/v1/ordens-servico/os%2F1/historico').flush([
      {
        estado: 'RECEBIDA',
        dataDoEstado: '2026-07-15T12:00:00Z',
        motivo: 'OS aberta',
      },
    ]);
    await expect(historyResult).resolves.toEqual([
      { state: 'RECEBIDA', occurredAt: '2026-07-15T12:00:00Z', reason: 'OS aberta' },
    ]);

    const stateResult = adapter.alterarEstadoOrdemServico({
      id: 'os/1',
      state: 'EM_DIAGNOSTICO',
      reason: 'Diagnóstico iniciado',
      idempotencyKey: 'state-key-123',
    });
    const stateRequest = httpTesting.expectOne(
      'https://api.example/api/v1/ordens-servico/os%2F1/estado',
    );
    expect(stateRequest.request.method).toBe('PATCH');
    expect(stateRequest.request.headers.get('X-Idempotency-Key')).toBe('state-key-123');
    expect(stateRequest.request.body).toEqual({
      estado: 'EM_DIAGNOSTICO',
      motivo: 'Diagnóstico iniciado',
    });
    stateRequest.flush({
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      veiculoId: 'veiculo-1',
      descricaoProblema: 'Não liga',
      estado: 'EM_DIAGNOSTICO',
      criadoEm: '2026-07-15T12:00:00Z',
      atualizadoEm: '2026-07-15T13:00:00Z',
    });
    await expect(stateResult).resolves.toMatchObject({ state: 'EM_DIAGNOSTICO' });

    const cancelResult = adapter.cancelarOrdemServico({
      id: 'os/1',
      idempotencyKey: 'cancel-key-123',
    });
    const cancelRequest = httpTesting.expectOne(
      'https://api.example/api/v1/ordens-servico/os%2F1/cancelamento',
    );
    expect(cancelRequest.request.method).toBe('POST');
    expect(cancelRequest.request.headers.get('X-Idempotency-Key')).toBe('cancel-key-123');
    cancelRequest.flush({ status: 'ACEITO', solicitadoEm: '2026-07-15T13:00:00Z' });
    await expect(cancelResult).resolves.toEqual({
      status: 'ACEITO',
      requestedAt: '2026-07-15T13:00:00Z',
    });
  });

  it('inclui serviço e peça com quantidade e idempotência sem enviar snapshots', async () => {
    const serviceResult = adapter.incluirServicoOrdemServico({
      id: 'os/1',
      serviceId: 'servico-1',
      quantity: 1.5,
      idempotencyKey: 'service-key',
    });
    const serviceRequest = httpTesting.expectOne(
      'https://api.example/api/v1/ordens-servico/os%2F1/servicos',
    );
    expect(serviceRequest.request.body).toEqual({ servicoId: 'servico-1', quantidade: 1.5 });
    expect(serviceRequest.request.headers.get('X-Idempotency-Key')).toBe('service-key');
    serviceRequest.flush(orderResponse());
    await expect(serviceResult).resolves.toMatchObject({
      services: [{ serviceId: 'servico-1', totalPrice: 150 }],
    });

    const partResult = adapter.incluirPecaOrdemServico({
      id: 'os/1',
      partId: 'peca-1',
      quantity: 2,
      idempotencyKey: 'part-key',
    });
    const partRequest = httpTesting.expectOne(
      'https://api.example/api/v1/ordens-servico/os%2F1/pecas',
    );
    expect(partRequest.request.body).toEqual({ pecaId: 'peca-1', quantidade: 2 });
    partRequest.flush(orderResponse());
    await expect(partResult).resolves.toMatchObject({ parts: [{ partId: 'peca-1' }] });
  });
});

const orderResponse = (): OrdemServico => ({
  ordemServicoId: 'os-1',
  clienteId: 'cliente-1',
  veiculoId: 'veiculo-1',
  descricaoProblema: 'Não liga',
  estado: 'EM_DIAGNOSTICO',
  criadoEm: '2026-07-15T12:00:00Z',
  atualizadoEm: '2026-07-15T13:00:00Z',
  acoesPermitidas: ['INCLUIR_SERVICO', 'INCLUIR_PECA'],
  servicos: [
    {
      servicoId: 'servico-1',
      nome: 'Revisão',
      quantidade: 1.5,
      valorUnitario: 100,
      valorTotal: 150,
    },
  ],
  pecas: [{ pecaId: 'peca-1', nome: 'Filtro', quantidade: 2, valorUnitario: 30, valorTotal: 60 }],
});
