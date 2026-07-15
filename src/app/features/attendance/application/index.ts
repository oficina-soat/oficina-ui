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
  ListWorkOrdersQuery,
  OpenWorkOrderCommand,
  VehicleFailureReason,
  VeiculoResumo,
  WorkOrderFailureReason,
  WorkOrderState,
  WorkOrderSummary,
} from './attendance-gateway';
export {
  ClientOperationError,
  CreateClient,
  CreateVehicle,
  ListClients,
  LoadClientVehicles,
  GetWorkOrder,
  ListWorkOrders,
  OpenWorkOrder,
  VehicleOperationError,
  WorkOrderOperationError,
} from './attendance-gateway';
