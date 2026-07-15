import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  Alert,
  Confirmation,
  DataTable,
  EmptyState,
  FormField,
  Loading,
  Pagination,
  Shell,
  type NavigationItem,
} from './shared/ui';

@Component({
  selector: 'app-root',
  imports: [Alert, Confirmation, DataTable, EmptyState, FormField, Loading, Pagination, Shell],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly navigation: readonly NavigationItem[] = [
    { label: 'Atendimento', href: '#componentes', current: true },
    { label: 'Ordens', href: '#tabela' },
    { label: 'Fila mecânica', href: '#estados' },
  ];
  protected readonly currentPage = signal(1);
  protected readonly confirmationOpen = signal(false);
}
