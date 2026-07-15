import { inject, InjectionToken } from '@angular/core';

import {
  CreateClient,
  CreateVehicle,
  GetWorkOrder,
  ListClients,
  ListWorkOrders,
  LoadClientVehicles,
  OpenWorkOrder,
} from './application';
import { AttendanceApiAdapter } from './infrastructure';

export const LIST_CLIENTS = new InjectionToken<ListClients>('LIST_CLIENTS', {
  providedIn: 'root',
  factory: () => new ListClients(inject(AttendanceApiAdapter)),
});

export const CREATE_CLIENT = new InjectionToken<CreateClient>('CREATE_CLIENT', {
  providedIn: 'root',
  factory: () => new CreateClient(inject(AttendanceApiAdapter)),
});

export const LOAD_CLIENT_VEHICLES = new InjectionToken<LoadClientVehicles>('LOAD_CLIENT_VEHICLES', {
  providedIn: 'root',
  factory: () => new LoadClientVehicles(inject(AttendanceApiAdapter)),
});

export const CREATE_VEHICLE = new InjectionToken<CreateVehicle>('CREATE_VEHICLE', {
  providedIn: 'root',
  factory: () => new CreateVehicle(inject(AttendanceApiAdapter)),
});

export const LIST_WORK_ORDERS = new InjectionToken<ListWorkOrders>('LIST_WORK_ORDERS', {
  providedIn: 'root',
  factory: () => new ListWorkOrders(inject(AttendanceApiAdapter)),
});
export const GET_WORK_ORDER = new InjectionToken<GetWorkOrder>('GET_WORK_ORDER', {
  providedIn: 'root',
  factory: () => new GetWorkOrder(inject(AttendanceApiAdapter)),
});
export const OPEN_WORK_ORDER = new InjectionToken<OpenWorkOrder>('OPEN_WORK_ORDER', {
  providedIn: 'root',
  factory: () => new OpenWorkOrder(inject(AttendanceApiAdapter)),
});
