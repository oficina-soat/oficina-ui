import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Alert,
  DataTable,
  EmptyState,
  FormField,
  Loading,
  Pagination,
} from '../../../../shared/ui';
import { type ClienteResumo, type Pagina } from '../../application';
import {
  ClientOperationError,
  type ClientFailureReason,
  CREATE_CLIENT,
  LIST_CLIENTS,
} from '../../public-api';

const errorMessages: Readonly<Record<ClientFailureReason, string>> = {
  INVALID_INPUT: 'Revise os dados informados e tente novamente.',
  DUPLICATE: 'Já existe um cliente com os dados informados.',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente para continuar.',
  SERVICE_UNAVAILABLE: 'O serviço de clientes está indisponível. Tente novamente em instantes.',
  UNKNOWN: 'Não foi possível concluir a operação.',
};

@Component({
  selector: 'app-clients',
  imports: [Alert, DataTable, EmptyState, FormField, Loading, Pagination, ReactiveFormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clients implements OnInit {
  private readonly listClients = inject(LIST_CLIENTS);
  private readonly createClient = inject(CREATE_CLIENT);
  protected readonly page = signal<Pagina<ClienteResumo> | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly failureDetails = signal<readonly string[]>([]);
  protected readonly correlationId = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  readonly form = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    documento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{11}$/)],
    }),
    telefone: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
  });

  ngOnInit(): void {
    void this.loadPage(0);
  }

  protected async loadPage(page: number): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.clearFailure();
    try {
      this.page.set(await this.listClients.execute({ page, size: 20 }));
    } catch (error: unknown) {
      this.handleFailure(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected openForm(): void {
    this.formOpen.set(true);
    this.success.set(null);
  }

  protected closeForm(): void {
    this.form.reset();
    this.formOpen.set(false);
    this.clearFailure();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.clearFailure();
    const value = this.form.getRawValue();
    try {
      const client = await this.createClient.execute({
        nome: value.nome,
        documento: value.documento,
        ...(value.telefone ? { telefone: value.telefone } : {}),
        ...(value.email ? { email: value.email } : {}),
        idempotencyKey: crypto.randomUUID(),
      });
      this.form.reset();
      this.formOpen.set(false);
      this.success.set(`Cliente ${client.nome} cadastrado com sucesso.`);
      await this.loadPage(this.page()?.page ?? 0);
    } catch (error: unknown) {
      this.handleFailure(error);
    } finally {
      this.saving.set(false);
    }
  }

  protected maskDocument(document: string): string {
    return /^\d{11}$/.test(document) ? `***.***.***-${document.slice(-2)}` : 'Documento protegido';
  }

  private handleFailure(error: unknown): void {
    const failure =
      error instanceof ClientOperationError ? error : new ClientOperationError('UNKNOWN', null);
    this.failure.set(errorMessages[failure.reason]);
    this.failureDetails.set(failure.details);
    this.correlationId.set(failure.correlationId);
  }

  private clearFailure(): void {
    this.failure.set(null);
    this.failureDetails.set([]);
    this.correlationId.set(null);
  }
}
