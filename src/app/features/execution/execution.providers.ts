import { inject, InjectionToken } from '@angular/core';

import {
  CompleteDiagnosis,
  CompleteRepair,
  GetExecution,
  ListExecutionQueue,
  GetStockBalance,
  ListStockMovements,
  ListStockParts,
  ListCatalogServices,
  RegisterStockEntry,
  StartDiagnosis,
} from './application';
import { ExecutionApiAdapter } from './infrastructure';

export const LIST_EXECUTION_QUEUE = new InjectionToken<ListExecutionQueue>('LIST_EXECUTION_QUEUE', {
  providedIn: 'root',
  factory: () => new ListExecutionQueue(inject(ExecutionApiAdapter)),
});
export const GET_EXECUTION = new InjectionToken<GetExecution>('GET_EXECUTION', {
  providedIn: 'root',
  factory: () => new GetExecution(inject(ExecutionApiAdapter)),
});
export const START_DIAGNOSIS = new InjectionToken<StartDiagnosis>('START_DIAGNOSIS', {
  providedIn: 'root',
  factory: () => new StartDiagnosis(inject(ExecutionApiAdapter)),
});
export const COMPLETE_DIAGNOSIS = new InjectionToken<CompleteDiagnosis>('COMPLETE_DIAGNOSIS', {
  providedIn: 'root',
  factory: () => new CompleteDiagnosis(inject(ExecutionApiAdapter)),
});
export const COMPLETE_REPAIR = new InjectionToken<CompleteRepair>('COMPLETE_REPAIR', {
  providedIn: 'root',
  factory: () => new CompleteRepair(inject(ExecutionApiAdapter)),
});
export const LIST_STOCK_PARTS = new InjectionToken<ListStockParts>('LIST_STOCK_PARTS', {
  providedIn: 'root',
  factory: () => new ListStockParts(inject(ExecutionApiAdapter)),
});
export const LIST_CATALOG_SERVICES = new InjectionToken<ListCatalogServices>(
  'LIST_CATALOG_SERVICES',
  {
    providedIn: 'root',
    factory: () => new ListCatalogServices(inject(ExecutionApiAdapter)),
  },
);
export const GET_STOCK_BALANCE = new InjectionToken<GetStockBalance>('GET_STOCK_BALANCE', {
  providedIn: 'root',
  factory: () => new GetStockBalance(inject(ExecutionApiAdapter)),
});
export const LIST_STOCK_MOVEMENTS = new InjectionToken<ListStockMovements>('LIST_STOCK_MOVEMENTS', {
  providedIn: 'root',
  factory: () => new ListStockMovements(inject(ExecutionApiAdapter)),
});
export const REGISTER_STOCK_ENTRY = new InjectionToken<RegisterStockEntry>('REGISTER_STOCK_ENTRY', {
  providedIn: 'root',
  factory: () => new RegisterStockEntry(inject(ExecutionApiAdapter)),
});
