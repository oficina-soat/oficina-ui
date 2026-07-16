import type { OperationalUser, UserCredential, UserPage } from '../application';
import type { CredencialStatusResponse } from './generated/auth/types.gen';
import type { PageResponse, Usuario } from './generated/os/types.gen';

export const mapOperationalUser = (value: Usuario): OperationalUser => ({
  id: value.usuarioId,
  personId: value.pessoaId,
  name: value.nome,
  document: value.documento,
  status: value.status,
  roles: value.papeis,
  allowedActions: value.acoesPermitidas,
  createdAt: value.criadoEm,
  updatedAt: value.atualizadoEm,
});

export const mapUserPage = (
  value: PageResponse & { readonly items: readonly Usuario[] },
): UserPage => ({
  items: value.items.map(mapOperationalUser),
  page: value.page,
  size: value.size,
  totalItems: value.totalItems,
  totalPages: value.totalPages,
});

export const mapUserCredential = (value: CredencialStatusResponse): UserCredential => ({
  status: value.status,
  ...(value.expiresAt ? { expiresAt: value.expiresAt } : {}),
  allowedActions: value.acoesPermitidas,
});
