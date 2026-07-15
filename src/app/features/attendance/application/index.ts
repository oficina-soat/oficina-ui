// Coordenação dos fluxos de atendimento da interface.
export {};
export type {
  AttendanceGateway,
  ClientFailureReason,
  ClientVehicles,
  ClienteResumo,
  ConsultarClientesQuery,
  CriarClienteCommand,
  CriarVeiculoCommand,
  Pagina,
  VehicleFailureReason,
  VeiculoResumo,
} from './attendance-gateway';
export {
  ClientOperationError,
  CreateClient,
  CreateVehicle,
  ListClients,
  LoadClientVehicles,
  VehicleOperationError,
} from './attendance-gateway';
