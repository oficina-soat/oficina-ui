export type UserStatus = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
export type UserRole = 'administrativo' | 'mecanico' | 'recepcionista';
export type UserAction = 'ATUALIZAR_DADOS' | 'BLOQUEAR' | 'REATIVAR' | 'INATIVAR';
export type CredentialStatus = 'NAO_ATIVADA' | 'ATIVACAO_PENDENTE' | 'ATIVA';
export type CredentialAction = 'SOLICITAR_ATIVACAO';

export interface OperationalUser {
  readonly id: string;
  readonly personId: string;
  readonly name: string;
  readonly document: string;
  readonly status: UserStatus;
  readonly roles: readonly UserRole[];
  readonly allowedActions: readonly UserAction[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UserPage {
  readonly items: readonly OperationalUser[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ListUsersQuery {
  readonly page?: number;
  readonly size?: number;
  readonly name?: string;
  readonly document?: string;
  readonly status?: UserStatus;
  readonly role?: UserRole;
}

export interface CreateUserCommand {
  readonly name: string;
  readonly document: string;
  readonly roles: readonly UserRole[];
  readonly idempotencyKey: string;
}

export interface UpdateUserCommand {
  readonly userId: string;
  readonly name: string;
  readonly document: string;
  readonly roles: readonly UserRole[];
}

export interface UserStateCommand {
  readonly userId: string;
  readonly idempotencyKey: string;
}

export interface UserCredential {
  readonly status: CredentialStatus;
  readonly expiresAt?: string;
  readonly allowedActions: readonly CredentialAction[];
}

export interface CredentialActivation {
  readonly activationToken: string;
  readonly expiresAt: string;
}

export interface OperationalUsersGateway {
  list(query: ListUsersQuery): Promise<UserPage>;
  get(userId: string): Promise<OperationalUser>;
  create(command: CreateUserCommand): Promise<OperationalUser>;
  update(command: UpdateUserCommand): Promise<OperationalUser>;
  block(command: UserStateCommand): Promise<OperationalUser>;
  reactivate(command: UserStateCommand): Promise<OperationalUser>;
  inactivate(userId: string): Promise<void>;
}

export interface UserCredentialsGateway {
  get(userId: string): Promise<UserCredential>;
  requestActivation(userId: string): Promise<CredentialActivation>;
}

export class ListUsers {
  constructor(private readonly gateway: OperationalUsersGateway) {}
  execute(query: ListUsersQuery): Promise<UserPage> {
    return this.gateway.list(query);
  }
}

export class GetOperationalUser {
  constructor(private readonly gateway: OperationalUsersGateway) {}
  execute(userId: string): Promise<OperationalUser> {
    return this.gateway.get(userId);
  }
}

export class CreateOperationalUser {
  constructor(private readonly gateway: OperationalUsersGateway) {}
  execute(command: CreateUserCommand): Promise<OperationalUser> {
    return this.gateway.create(command);
  }
}

export class UpdateOperationalUser {
  constructor(private readonly gateway: OperationalUsersGateway) {}
  execute(command: UpdateUserCommand): Promise<OperationalUser> {
    return this.gateway.update(command);
  }
}

export class BlockOperationalUser {
  constructor(private readonly gateway: OperationalUsersGateway) {}
  execute(command: UserStateCommand): Promise<OperationalUser> {
    return this.gateway.block(command);
  }
}

export class ReactivateOperationalUser {
  constructor(private readonly gateway: OperationalUsersGateway) {}
  execute(command: UserStateCommand): Promise<OperationalUser> {
    return this.gateway.reactivate(command);
  }
}

export class InactivateOperationalUser {
  constructor(private readonly gateway: OperationalUsersGateway) {}
  execute(userId: string): Promise<void> {
    return this.gateway.inactivate(userId);
  }
}

export class GetUserCredential {
  constructor(private readonly gateway: UserCredentialsGateway) {}
  execute(userId: string): Promise<UserCredential> {
    return this.gateway.get(userId);
  }
}

export class RequestUserCredentialActivation {
  constructor(private readonly gateway: UserCredentialsGateway) {}
  execute(userId: string): Promise<CredentialActivation> {
    return this.gateway.requestActivation(userId);
  }
}
