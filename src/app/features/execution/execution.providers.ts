import { inject, InjectionToken } from '@angular/core';

import { ListExecutionQueue } from './application';
import { ExecutionApiAdapter } from './infrastructure';

export const LIST_EXECUTION_QUEUE = new InjectionToken<ListExecutionQueue>('LIST_EXECUTION_QUEUE', {
  providedIn: 'root',
  factory: () => new ListExecutionQueue(inject(ExecutionApiAdapter)),
});
