import { describe, expect, it, vi } from 'vitest';
import {
  BlockOperationalUser,
  CreateOperationalUser,
  GetOperationalUser,
  GetUserCredential,
  InactivateOperationalUser,
  ListUsers,
  ReactivateOperationalUser,
  RequestUserCredentialActivation,
  UpdateOperationalUser,
  type OperationalUsersGateway,
  type UserCredentialsGateway,
} from './user-administration';

const operationalGateway = (): OperationalUsersGateway => ({
  list: vi.fn().mockResolvedValue({ items: [] }),
  get: vi.fn().mockResolvedValue({ id: 'user-1' }),
  create: vi.fn().mockResolvedValue({ id: 'user-1' }),
  update: vi.fn().mockResolvedValue({ id: 'user-1' }),
  block: vi.fn().mockResolvedValue({ id: 'user-1' }),
  reactivate: vi.fn().mockResolvedValue({ id: 'user-1' }),
  inactivate: vi.fn().mockResolvedValue(undefined),
});

const credentialsGateway = (): UserCredentialsGateway => ({
  get: vi.fn().mockResolvedValue({ status: 'ATIVA', allowedActions: [] }),
  requestActivation: vi.fn().mockResolvedValue({ activationToken: 'secret', expiresAt: 'later' }),
});

describe('casos de uso da administração de usuários', () => {
  it('delega consultas e comandos operacionais sem inferir ações', async () => {
    const gateway = operationalGateway();
    const query = { page: 1, status: 'ATIVO' as const };
    const create = {
      name: 'Ana',
      document: '52998224725',
      roles: ['mecanico' as const],
      idempotencyKey: 'create-key',
    };
    const update = { userId: 'user-1', ...create };
    const state = { userId: 'user-1', idempotencyKey: 'state-key' };

    await new ListUsers(gateway).execute(query);
    await new GetOperationalUser(gateway).execute('user-1');
    await new CreateOperationalUser(gateway).execute(create);
    await new UpdateOperationalUser(gateway).execute(update);
    await new BlockOperationalUser(gateway).execute(state);
    await new ReactivateOperationalUser(gateway).execute(state);
    await new InactivateOperationalUser(gateway).execute('user-1');

    expect(gateway.list).toHaveBeenCalledWith(query);
    expect(gateway.get).toHaveBeenCalledWith('user-1');
    expect(gateway.create).toHaveBeenCalledWith(create);
    expect(gateway.update).toHaveBeenCalledWith(update);
    expect(gateway.block).toHaveBeenCalledWith(state);
    expect(gateway.reactivate).toHaveBeenCalledWith(state);
    expect(gateway.inactivate).toHaveBeenCalledWith('user-1');
  });

  it('mantém a autoridade de credencial separada', async () => {
    const gateway = credentialsGateway();
    await new GetUserCredential(gateway).execute('user-1');
    await new RequestUserCredentialActivation(gateway).execute('user-1');
    expect(gateway.get).toHaveBeenCalledWith('user-1');
    expect(gateway.requestActivation).toHaveBeenCalledWith('user-1');
  });
});
