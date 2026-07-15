import { describe, expect, it, vi } from 'vitest';

import type { AttendanceGateway } from './attendance-gateway';
import { CreateClient, CreateVehicle, ListClients, LoadClientVehicles } from './attendance-gateway';

const gateway = (): AttendanceGateway => ({
  consultarClientes: vi.fn().mockResolvedValue({
    items: [],
    page: 0,
    size: 20,
    totalItems: 0,
    totalPages: 0,
  }),
  criarCliente: vi.fn().mockResolvedValue({
    id: 'cliente-1',
    nome: 'Ana',
    documento: '12345678901',
  }),
  consultarCliente: vi.fn().mockResolvedValue({
    id: 'cliente-1',
    nome: 'Ana',
    documento: '12345678901',
  }),
  consultarVeiculos: vi.fn().mockResolvedValue([]),
  criarVeiculo: vi.fn().mockResolvedValue({
    id: 'veiculo-1',
    clienteId: 'cliente-1',
    placa: 'ABC1D23',
    marca: 'Volkswagen',
    modelo: 'Gol',
  }),
});

describe('casos de uso de clientes', () => {
  it('delega paginação integralmente ao gateway', async () => {
    const attendance = gateway();
    await new ListClients(attendance).execute({ page: 2, size: 20 });
    expect(attendance.consultarClientes).toHaveBeenCalledWith({ page: 2, size: 20 });
  });

  it('delega o cadastro sem reinterpretar seus dados', async () => {
    const attendance = gateway();
    const command = {
      nome: 'Ana',
      documento: '12345678901',
      idempotencyKey: 'command-key-123',
    };
    await new CreateClient(attendance).execute(command);
    expect(attendance.criarCliente).toHaveBeenCalledWith(command);
  });

  it('carrega cliente e veículos sem reconstruir o vínculo', async () => {
    const attendance = gateway();
    const result = await new LoadClientVehicles(attendance).execute('cliente-1');
    expect(attendance.consultarCliente).toHaveBeenCalledWith('cliente-1');
    expect(attendance.consultarVeiculos).toHaveBeenCalledWith('cliente-1');
    expect(result.client.id).toBe('cliente-1');
    expect(result.vehicles).toEqual([]);
  });

  it('delega o cadastro vinculado ao gateway', async () => {
    const attendance = gateway();
    const command = {
      clienteId: 'cliente-1',
      placa: 'ABC1D23',
      marca: 'Volkswagen',
      modelo: 'Gol',
      idempotencyKey: 'command-key-123',
    };
    await new CreateVehicle(attendance).execute(command);
    expect(attendance.criarVeiculo).toHaveBeenCalledWith(command);
  });
});
