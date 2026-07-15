import { describe, expect, it, vi } from 'vitest';

import type { AttendanceGateway } from './attendance-gateway';
import { CreateClient, ListClients } from './attendance-gateway';

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
});
