import { inject, InjectionToken } from '@angular/core';

import { CreateClient, ListClients } from './application';
import { AttendanceApiAdapter } from './infrastructure';

export const LIST_CLIENTS = new InjectionToken<ListClients>('LIST_CLIENTS', {
  providedIn: 'root',
  factory: () => new ListClients(inject(AttendanceApiAdapter)),
});

export const CREATE_CLIENT = new InjectionToken<CreateClient>('CREATE_CLIENT', {
  providedIn: 'root',
  factory: () => new CreateClient(inject(AttendanceApiAdapter)),
});
