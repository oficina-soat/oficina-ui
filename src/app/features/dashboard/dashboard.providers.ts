import { inject, InjectionToken } from '@angular/core';
import { LoadOperationalDashboard } from './application';
import { DashboardApiAdapter } from './infrastructure/dashboard-api.adapter';

export const LOAD_OPERATIONAL_DASHBOARD = new InjectionToken<LoadOperationalDashboard>(
  'LOAD_OPERATIONAL_DASHBOARD',
  {
    providedIn: 'root',
    factory: () => new LoadOperationalDashboard(inject(DashboardApiAdapter)),
  },
);
