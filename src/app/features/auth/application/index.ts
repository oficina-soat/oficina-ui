// Coordenação dos fluxos de autenticação da interface.
export {};
export {
  AuthenticateUser,
  AuthenticationError,
  LogoutUser,
  type AuthenticationFailureReason,
  type AuthGateway,
  type AuthSession,
  type AuthSessionPort,
  type EmitirTokenCommand,
} from './auth-gateway';
