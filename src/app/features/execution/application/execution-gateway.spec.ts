import { describe, expect, it, vi } from 'vitest';

import {
  CompleteDiagnosis,
  CompleteRepair,
  GetExecution,
  ListExecutionQueue,
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
});

describe('casos de uso de execução', () => {
  it('delega a consulta da fila e do detalhe sem reordenar ou reinterpretar', async () => {
    const execution = gateway();
    await new ListExecutionQueue(execution).execute({ status: 'CRIADA' });
    await new GetExecution(execution).execute('execucao-1');

    expect(execution.consultarFila).toHaveBeenCalledWith({ status: 'CRIADA' });
    expect(execution.consultarExecucao).toHaveBeenCalledWith('execucao-1');
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

    expect(execution.iniciarDiagnostico).toHaveBeenCalledWith(command);
    expect(execution.concluirDiagnostico).toHaveBeenCalledWith(command);
    expect(execution.iniciarReparo).toHaveBeenCalledWith(command);
    expect(execution.concluirReparo).toHaveBeenCalledWith(command);
  });
});
