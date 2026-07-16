import { describe, expect, it, vi } from 'vitest';

import {
  CancelExecution,
  CompleteDiagnosis,
  CompleteRepair,
  GetExecution,
  ListExecutionQueue,
  GetStockBalance,
  ListStockMovements,
  ListStockParts,
  RegisterStockEntry,
  StartDiagnosis,
  StartRepair,
  type ExecutionGateway,
} from './execution-gateway';

const gateway = (): ExecutionGateway => ({
  consultarFila: vi.fn().mockResolvedValue([]),
  consultarExecucao: vi.fn().mockResolvedValue({ id: 'execucao-1' }),
  iniciarDiagnostico: vi.fn().mockResolvedValue({ id: 'execucao-1' }),
  concluirDiagnostico: vi.fn().mockResolvedValue({ id: 'execucao-1' }),
  iniciarReparo: vi.fn().mockResolvedValue({ id: 'execucao-1' }),
  concluirReparo: vi.fn().mockResolvedValue({ id: 'execucao-1' }),
  cancelar: vi.fn().mockResolvedValue({ id: 'execucao-1' }),
  consultarPecas: vi
    .fn()
    .mockResolvedValue({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
  consultarSaldo: vi.fn().mockResolvedValue({ partId: 'peca-1' }),
  consultarMovimentos: vi
    .fn()
    .mockResolvedValue({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
  registrarEntrada: vi.fn().mockResolvedValue({ id: 'movimento-1' }),
});

describe('casos de uso de execução', () => {
  it('delega a consulta da fila e do detalhe sem reordenar ou reinterpretar', async () => {
    const execution = gateway();
    await new ListExecutionQueue(execution).execute({ status: 'CRIADA' });
    await new GetExecution(execution).execute('execucao-1');

    expect(execution.consultarFila).toHaveBeenCalledWith({ status: 'CRIADA' });
    expect(execution.consultarExecucao).toHaveBeenCalledWith('execucao-1');
  });

  it('delega consultas e entrada de estoque sem decidir ações', async () => {
    const execution = gateway();
    const query = { name: 'filtro', page: 1 };
    const movementQuery = { partId: 'peca-1', type: 'ENTRADA' as const };
    const command = { partId: 'peca-1', quantity: 2, idempotencyKey: 'stock-key-123' };
    await new ListStockParts(execution).execute(query);
    await new GetStockBalance(execution).execute('peca-1');
    await new ListStockMovements(execution).execute(movementQuery);
    await new RegisterStockEntry(execution).execute(command);
    expect(execution.consultarPecas).toHaveBeenCalledWith(query);
    expect(execution.consultarSaldo).toHaveBeenCalledWith('peca-1');
    expect(execution.consultarMovimentos).toHaveBeenCalledWith(movementQuery);
    expect(execution.registrarEntrada).toHaveBeenCalledWith(command);
  });

  it('delega cada comando integralmente ao gateway', async () => {
    const execution = gateway();
    const command = {
      id: 'execucao-1',
      idempotencyKey: 'command-key-123',
      notes: 'Resultado informado pelo mecânico',
    };

    await new StartDiagnosis(execution).execute(command);
    await new CompleteDiagnosis(execution).execute(command);
    await new StartRepair(execution).execute(command);
    await new CompleteRepair(execution).execute(command);
    await new CancelExecution(execution).execute(command);

    expect(execution.iniciarDiagnostico).toHaveBeenCalledWith(command);
    expect(execution.concluirDiagnostico).toHaveBeenCalledWith(command);
    expect(execution.iniciarReparo).toHaveBeenCalledWith(command);
    expect(execution.concluirReparo).toHaveBeenCalledWith(command);
    expect(execution.cancelar).toHaveBeenCalledWith(command);
  });
});
