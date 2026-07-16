import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RUNTIME_CONFIG } from '../../../../core/config/runtime-config';
import { idempotencyInterceptor } from '../../../../core/http/api.interceptors';
import type { Usuario } from './generated/os/types.gen';
import { OsUsersApiAdapter } from './os-users-api.adapter';

const userDto = (status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO' = 'ATIVO'): Usuario => {
  const actions: Usuario['acoesPermitidas'] =
    status === 'ATIVO' ? ['ATUALIZAR_DADOS', 'BLOQUEAR'] : ['REATIVAR'];
  return {
    usuarioId: 'user-1',
    pessoaId: 'person-1',
    nome: 'Ana Operadora',
    documento: '52998224725',
    tipoPessoa: 'FISICA',
    status,
    papeis: ['mecanico'],
    acoesPermitidas: actions,
    criadoEm: '2026-07-16T00:00:00Z',
    atualizadoEm: '2026-07-16T01:00:00Z',
  };
};

describe('OsUsersApiAdapter', () => {
  let http: HttpTestingController;
  let adapter: OsUsersApiAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor])),
        provideHttpClientTesting(),
        {
          provide: RUNTIME_CONFIG,
          useValue: { apiBaseUrl: 'https://api.example/api/v1', authBaseUrl: '' },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    adapter = TestBed.inject(OsUsersApiAdapter);
  });

  afterEach(() => http.verify());

  it('envia filtros remotos e preserva ações canônicas no mapper', async () => {
    const result = adapter.list({
      page: 1,
      size: 10,
      name: 'ana',
      document: '52998224725',
      status: 'ATIVO',
      role: 'mecanico',
    });
    const request = http.expectOne(
      (candidate) =>
        candidate.url === 'https://api.example/api/v1/usuarios' &&
        candidate.params.get('nome') === 'ana' &&
        candidate.params.get('documento') === '52998224725' &&
        candidate.params.get('status') === 'ATIVO' &&
        candidate.params.get('papel') === 'mecanico',
    );
    request.flush({ items: [userDto()], page: 1, size: 10, totalItems: 1, totalPages: 1 });
    await expect(result).resolves.toMatchObject({
      items: [{ id: 'user-1', allowedActions: ['ATUALIZAR_DADOS', 'BLOQUEAR'] }],
      totalItems: 1,
    });
  });

  it('mapeia CRUD e envia comandos de estado com idempotência', async () => {
    const detail = adapter.get('user/1');
    http.expectOne('https://api.example/api/v1/usuarios/user%2F1').flush(userDto());
    await expect(detail).resolves.toMatchObject({ id: 'user-1', roles: ['mecanico'] });

    const created = adapter.create({
      name: 'Ana',
      document: '52998224725',
      roles: ['mecanico'],
      idempotencyKey: 'create-key',
    });
    const createRequest = http.expectOne('https://api.example/api/v1/usuarios');
    expect(createRequest.request.body).toEqual({
      nome: 'Ana',
      documento: '52998224725',
      papeis: ['mecanico'],
    });
    expect(createRequest.request.headers.get('X-Idempotency-Key')).toBe('create-key');
    createRequest.flush(userDto());
    await created;

    const updated = adapter.update({
      userId: 'user-1',
      name: 'Ana Atualizada',
      document: '52998224725',
      roles: ['administrativo'],
    });
    const updateRequest = http.expectOne('https://api.example/api/v1/usuarios/user-1');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).not.toHaveProperty('status');
    updateRequest.flush(userDto());
    await updated;

    const blocked = adapter.block({ userId: 'user-1', idempotencyKey: 'block-key' });
    const blockRequest = http.expectOne('https://api.example/api/v1/usuarios/user-1/bloqueio');
    expect(blockRequest.request.headers.get('X-Idempotency-Key')).toBe('block-key');
    blockRequest.flush(userDto('BLOQUEADO'));
    await expect(blocked).resolves.toMatchObject({ status: 'BLOQUEADO' });

    const reactivated = adapter.reactivate({
      userId: 'user-1',
      idempotencyKey: 'reactivate-key',
    });
    http.expectOne('https://api.example/api/v1/usuarios/user-1/reativacao').flush(userDto());
    await reactivated;

    const inactivated = adapter.inactivate('user-1');
    const deleteRequest = http.expectOne('https://api.example/api/v1/usuarios/user-1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await inactivated;
  });
});
