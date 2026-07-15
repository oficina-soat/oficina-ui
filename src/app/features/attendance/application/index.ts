// Coordenação dos fluxos de atendimento da interface.
export {};
export type {
  AttendanceGateway,
  ClientFailureReason,
  ClienteResumo,
  ConsultarClientesQuery,
  CriarClienteCommand,
  Pagina,
} from './attendance-gateway';
export { ClientOperationError, CreateClient, ListClients } from './attendance-gateway';
