export interface EmitirTokenCommand {
  readonly cpf: string;
  readonly password: string;
  readonly correlationId?: string;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresInSeconds: number;
}

export interface AuthGateway {
  emitirToken(command: EmitirTokenCommand): Promise<AuthSession>;
}

export type AuthenticationFailureReason =
  'INVALID_INPUT' | 'INVALID_CREDENTIALS' | 'ACCOUNT_UNAVAILABLE' | 'SERVICE_UNAVAILABLE';

export class AuthenticationError extends Error {
  constructor(
    readonly reason: AuthenticationFailureReason,
    readonly correlationId: string | null,
  ) {
    super(reason);
  }
}

export interface AuthSessionPort {
  start(session: AuthSession): void;
  clear(): void;
}

export class AuthenticateUser {
  constructor(
    private readonly gateway: AuthGateway,
    private readonly session: AuthSessionPort,
  ) {}

  async execute(command: EmitirTokenCommand): Promise<void> {
    const session = await this.gateway.emitirToken(command);
    this.session.start(session);
  }
}

export class LogoutUser {
  constructor(private readonly session: AuthSessionPort) {}

  execute(): void {
    this.session.clear();
  }
}
