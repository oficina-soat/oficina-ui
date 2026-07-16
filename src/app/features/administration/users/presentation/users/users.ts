import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../../../core/http/api-error';
import {
  Alert,
  DataTable,
  EmptyState,
  FormField,
  Loading,
  Pagination,
} from '../../../../../shared/ui';
import type { UserPage, UserRole, UserStatus } from '../../application';
import { LIST_USERS } from '../../public-api';

const statusLabels: Readonly<Record<UserStatus, string>> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
};
const roleLabels: Readonly<Record<UserRole, string>> = {
  administrativo: 'Administrativo',
  mecanico: 'Mecânico',
  recepcionista: 'Recepcionista',
};

@Component({
  selector: 'app-users',
  imports: [
    Alert,
    DataTable,
    EmptyState,
    FormField,
    Loading,
    Pagination,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users implements OnInit {
  private readonly listUsers = inject(LIST_USERS);
  protected readonly page = signal<UserPage | null>(null);
  protected readonly loading = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  protected readonly statusLabels = statusLabels;
  protected readonly roleLabels = roleLabels;
  readonly filters = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    document: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^$|^\d{11}$/)],
    }),
    status: new FormControl<UserStatus | ''>('', { nonNullable: true }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.loadPage(0);
  }

  protected async loadPage(page: number): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.clearFailure();
    const filters = this.filters.getRawValue();
    try {
      this.page.set(
        await this.listUsers.execute({
          page,
          size: 20,
          ...this.optional('name', filters.name),
          ...this.optional('document', filters.document),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.role ? { role: filters.role } : {}),
        }),
      );
    } catch (error: unknown) {
      this.handleFailure(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected applyFilters(): void {
    if (this.filters.invalid || this.loading()) {
      this.filters.markAllAsTouched();
      return;
    }
    void this.loadPage(0);
  }

  protected clearFilters(): void {
    this.filters.reset();
    void this.loadPage(0);
  }

  protected maskDocument(document: string): string {
    return /^\d{11}$/.test(document) ? `***.***.***-${document.slice(-2)}` : 'Documento protegido';
  }

  private optional<K extends 'name' | 'document'>(
    key: K,
    value: string,
  ): Partial<Record<K, string>> {
    const normalized = value.trim();
    return normalized ? ({ [key]: normalized } as Record<K, string>) : {};
  }

  private handleFailure(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    this.failure.set(
      apiError?.status === 403
        ? 'Seu perfil não possui acesso à administração de usuários.'
        : 'Não foi possível consultar os usuários. Tente novamente.',
    );
    this.correlationId.set(apiError?.correlationId ?? null);
  }

  private clearFailure(): void {
    this.failure.set(null);
    this.correlationId.set(null);
  }
}
