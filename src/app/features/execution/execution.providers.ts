import { inject, InjectionToken } from '@angular/core';

import {
  CancelExecution,
  CompleteDiagnosis,
  CompleteRepair,
  GetExecution,
  ListExecutionQueue,
  StartDiagnosis,
  StartRepair,
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
export const START_REPAIR = new InjectionToken<StartRepair>('START_REPAIR', {
  providedIn: 'root',
  factory: () => new StartRepair(inject(ExecutionApiAdapter)),
});
export const COMPLETE_REPAIR = new InjectionToken<CompleteRepair>('COMPLETE_REPAIR', {
  providedIn: 'root',
  factory: () => new CompleteRepair(inject(ExecutionApiAdapter)),
});
export const CANCEL_EXECUTION = new InjectionToken<CancelExecution>('CANCEL_EXECUTION', {
  providedIn: 'root',
  factory: () => new CancelExecution(inject(ExecutionApiAdapter)),
});
