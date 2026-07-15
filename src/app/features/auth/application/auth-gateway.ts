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
