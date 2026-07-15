// Coordenação dos fluxos de autenticação da interface.
export {};
export {
  AuthenticateUser,
  AuthenticationError,
  ActivateCredential,
  CredentialActivationError,
  LogoutUser,
  RequestCredentialActivation,
  type ActivateCredentialCommand,
  type AuthenticationFailureReason,
  type AuthGateway,
  type AuthSession,
  type AuthSessionPort,
  type EmitirTokenCommand,
  type CredentialActivation,
  type CredentialActivationFailureReason,
  type RequestCredentialActivationCommand,
} from './auth-gateway';
