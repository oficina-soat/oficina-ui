import { inject, InjectionToken } from '@angular/core';

import { CreateClient, CreateVehicle, ListClients, LoadClientVehicles } from './application';
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
