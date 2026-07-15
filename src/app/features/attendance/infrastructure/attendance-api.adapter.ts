import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RUNTIME_CONFIG } from '../../../core/config/runtime-config';
import { ApiError } from '../../../core/http/api-error';
import { idempotentCommandContext } from '../../../core/http/request-context';
import {
  ClientOperationError,
  type ClientFailureReason,
  type AttendanceGateway,
  type ClienteResumo,
  type ConsultarClientesQuery,
  type CriarClienteCommand,
  type CriarVeiculoCommand,
  type Pagina,
  VehicleOperationError,
  type VehicleFailureReason,
  type VeiculoResumo,
} from '../application';
import type { Cliente, ConsultarClientesResponse, Veiculo } from './generated/types.gen';

const mapCliente = (cliente: Cliente): ClienteResumo => ({
  id: cliente.clienteId,
  nome: cliente.nome,
  documento: cliente.documento,
  ...(cliente.telefone === undefined ? {} : { telefone: cliente.telefone }),
  ...(cliente.email === undefined ? {} : { email: cliente.email }),
});

const mapVeiculo = (vehicle: Veiculo): VeiculoResumo => ({
  id: vehicle.veiculoId,
  clienteId: vehicle.clienteId,
  placa: vehicle.placa,
  marca: vehicle.marca,
  modelo: vehicle.modelo,
  ...(vehicle.ano === undefined ? {} : { ano: vehicle.ano }),
});

@Injectable({ providedIn: 'root' })
export class AttendanceApiAdapter implements AttendanceGateway {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RUNTIME_CONFIG);

  async consultarClientes(query: ConsultarClientesQuery = {}): Promise<Pagina<ClienteResumo>> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    const headers = query.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': query.correlationId })
      : undefined;
    let data: ConsultarClientesResponse;
    try {
      data = await firstValueFrom(
        this.http.get<ConsultarClientesResponse>(`${this.config.apiBaseUrl}/clientes`, {
          params,
          ...(headers ? { headers } : {}),
        }),
      );
    } catch (error: unknown) {
      throw this.clientError(error);
    }

    return {
      items: (data.items ?? []).map(mapCliente),
      page: data.page,
      size: data.size,
      totalItems: data.totalItems,
      totalPages: data.totalPages,
    };
  }

  async criarCliente(command: CriarClienteCommand): Promise<ClienteResumo> {
    const headers = command.correlationId
      ? new HttpHeaders({ 'X-Correlation-Id': command.correlationId })
      : undefined;
    try {
      const data = await firstValueFrom(
        this.http.post<Cliente>(
          `${this.config.apiBaseUrl}/clientes`,
          {
            nome: command.nome,
            documento: command.documento,
            ...(command.telefone === undefined ? {} : { telefone: command.telefone }),
            ...(command.email === undefined ? {} : { email: command.email }),
          },
          {
            context: idempotentCommandContext(command.idempotencyKey),
            ...(headers ? { headers } : {}),
          },
        ),
      );
      return mapCliente(data);
    } catch (error: unknown) {
      throw this.clientError(error);
    }
  }

  async consultarCliente(clienteId: string): Promise<ClienteResumo> {
    try {
      const data = await firstValueFrom(
        this.http.get<Cliente>(
          `${this.config.apiBaseUrl}/clientes/${encodeURIComponent(clienteId)}`,
        ),
      );
      return mapCliente(data);
    } catch (error: unknown) {
      throw this.vehicleError(error);
    }
  }

  async consultarVeiculos(clienteId: string): Promise<readonly VeiculoResumo[]> {
    try {
      const data = await firstValueFrom(
        this.http.get<Veiculo[]>(
          `${this.config.apiBaseUrl}/clientes/${encodeURIComponent(clienteId)}/veiculos`,
        ),
      );
      return data.map(mapVeiculo);
    } catch (error: unknown) {
      throw this.vehicleError(error);
    }
  }

  async criarVeiculo(command: CriarVeiculoCommand): Promise<VeiculoResumo> {
    try {
      const data = await firstValueFrom(
        this.http.post<Veiculo>(
          `${this.config.apiBaseUrl}/clientes/${encodeURIComponent(command.clienteId)}/veiculos`,
          {
            placa: command.placa,
            marca: command.marca,
            modelo: command.modelo,
            ...(command.ano === undefined ? {} : { ano: command.ano }),
          },
          { context: idempotentCommandContext(command.idempotencyKey) },
        ),
      );
      return mapVeiculo(data);
    } catch (error: unknown) {
      throw this.vehicleError(error);
    }
  }

  private clientError(error: unknown): ClientOperationError {
    if (!(error instanceof ApiError)) return new ClientOperationError('SERVICE_UNAVAILABLE', null);
    const reasons: Readonly<Record<number, ClientFailureReason>> = {
      400: 'INVALID_INPUT',
      401: 'UNAUTHENTICATED',
      409: 'DUPLICATE',
    };
    return new ClientOperationError(
      error.status === 0 || error.status >= 500
        ? 'SERVICE_UNAVAILABLE'
        : (reasons[error.status] ?? 'UNKNOWN'),
      error.correlationId,
      error.details.map((detail) => detail.message),
    );
  }

  private vehicleError(error: unknown): VehicleOperationError {
    if (!(error instanceof ApiError)) {
      return new VehicleOperationError('SERVICE_UNAVAILABLE', null);
    }
    const reasons: Readonly<Record<number, VehicleFailureReason>> = {
      400: 'INVALID_INPUT',
      401: 'UNAUTHENTICATED',
      404: 'NOT_FOUND',
      409: 'DUPLICATE',
    };
    return new VehicleOperationError(
      error.status === 0 || error.status >= 500
        ? 'SERVICE_UNAVAILABLE'
        : (reasons[error.status] ?? 'UNKNOWN'),
      error.correlationId,
      error.details.map((detail) => detail.message),
    );
  }
}
