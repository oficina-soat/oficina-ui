import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiError } from '../../../../../core/http/api-error';
import { Alert, Confirmation, FormField, Loading } from '../../../../../shared/ui';
import type {
  CredentialAction,
  OperationalUser,
  UserAction,
  UserCredential,
  UserRole,
  UserStatus,
} from '../../application';
import {
  BLOCK_OPERATIONAL_USER,
  GET_OPERATIONAL_USER,
  GET_USER_CREDENTIAL,
  INACTIVATE_OPERATIONAL_USER,
  REACTIVATE_OPERATIONAL_USER,
  REQUEST_USER_CREDENTIAL_ACTIVATION,
  UPDATE_OPERATIONAL_USER,
} from '../../public-api';

type PendingUserAction = Exclude<UserAction, 'ATUALIZAR_DADOS'> | CredentialAction;

const statusLabels: Readonly<Record<UserStatus, string>> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
};
const credentialLabels = {
  NAO_ATIVADA: 'Não ativada',
  ATIVACAO_PENDENTE: 'Ativação pendente',
  ATIVA: 'Ativa',
} as const;

@Component({
  selector: 'app-user-detail',
  imports: [Alert, Confirmation, FormField, Loading, ReactiveFormsModule, RouterLink],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly getUser = inject(GET_OPERATIONAL_USER);
  private readonly updateUser = inject(UPDATE_OPERATIONAL_USER);
  private readonly blockUser = inject(BLOCK_OPERATIONAL_USER);
  private readonly reactivateUser = inject(REACTIVATE_OPERATIONAL_USER);
  private readonly inactivateUser = inject(INACTIVATE_OPERATIONAL_USER);
  private readonly getCredential = inject(GET_USER_CREDENTIAL);
  private readonly requestActivation = inject(REQUEST_USER_CREDENTIAL_ACTIVATION);
  private readonly userId = this.route.snapshot.paramMap.get('usuarioId') ?? '';
  protected readonly user = signal<OperationalUser | null>(null);
  protected readonly credential = signal<UserCredential | null>(null);
  protected readonly loading = signal(false);
  protected readonly credentialLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editing = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  protected readonly credentialFailure = signal(false);
  protected readonly success = signal<string | null>(null);
  protected readonly pendingAction = signal<PendingUserAction | null>(null);
  protected readonly activationToken = signal<string | null>(null);
  protected readonly statusLabels = statusLabels;
  protected readonly credentialLabels = credentialLabels;
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    document: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{11}$/)],
    }),
    administrativo: new FormControl(false, { nonNullable: true }),
    mecanico: new FormControl(false, { nonNullable: true }),
    recepcionista: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    if (!this.userId || this.loading()) return;
    this.loading.set(true);
    this.clearFailure();
    try {
      const user = await this.getUser.execute(this.userId);
      this.user.set(user);
      this.fillForm(user);
      void this.loadCredential();
    } catch (error: unknown) {
      this.handleFailure(error);
    } finally {
      this.loading.set(false);
    }
  }

  protected async loadCredential(): Promise<void> {
    if (this.credentialLoading()) return;
    this.credentialLoading.set(true);
    this.credentialFailure.set(false);
    try {
      this.credential.set(await this.getCredential.execute(this.userId));
    } catch {
      this.credential.set(null);
      this.credentialFailure.set(true);
    } finally {
      this.credentialLoading.set(false);
    }
  }

  protected startEditing(): void {
    const user = this.user();
    if (!user?.allowedActions.includes('ATUALIZAR_DADOS')) return;
    this.fillForm(user);
    this.editing.set(true);
    this.success.set(null);
  }

  protected cancelEditing(): void {
    this.editing.set(false);
    this.clearFailure();
  }

  protected async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const roles = this.selectedRoles();
    if (roles.length === 0) {
      this.failure.set('Selecione ao menos um papel operacional.');
      return;
    }
    this.saving.set(true);
    this.clearFailure();
    const value = this.form.getRawValue();
    try {
      const user = await this.updateUser.execute({
        userId: this.userId,
        name: value.name.trim(),
        document: value.document,
        roles,
      });
      this.user.set(user);
      this.fillForm(user);
      this.editing.set(false);
      this.success.set('Dados do usuário atualizados com sucesso.');
    } catch (error: unknown) {
      this.handleFailure(error);
    } finally {
      this.saving.set(false);
    }
  }

  protected confirmAction(action: PendingUserAction): void {
    const operational = this.user()?.allowedActions.includes(action as UserAction) ?? false;
    const credential =
      this.credential()?.allowedActions.includes(action as CredentialAction) ?? false;
    if (operational || credential) this.pendingAction.set(action);
  }

  protected cancelAction(): void {
    this.pendingAction.set(null);
  }

  protected async executeConfirmedAction(): Promise<void> {
    const action = this.pendingAction();
    this.pendingAction.set(null);
    if (!action || this.saving()) return;
    this.saving.set(true);
    this.clearFailure();
    this.success.set(null);
    try {
      if (action === 'SOLICITAR_ATIVACAO') {
        const activation = await this.requestActivation.execute(this.userId);
        this.activationToken.set(activation.activationToken);
        this.success.set('Token de ativação gerado. Ele será exibido somente nesta tela.');
        await this.loadCredential();
        return;
      }
      if (action === 'INATIVAR') {
        await this.inactivateUser.execute(this.userId);
        const user = await this.getUser.execute(this.userId);
        this.updateCurrentUser(user);
        this.success.set('Usuário inativado conforme resposta do serviço.');
        return;
      }
      const command = { userId: this.userId, idempotencyKey: crypto.randomUUID() };
      const user =
        action === 'BLOQUEAR'
          ? await this.blockUser.execute(command)
          : await this.reactivateUser.execute(command);
      this.updateCurrentUser(user);
      this.success.set(
        action === 'BLOQUEAR'
          ? 'Usuário bloqueado conforme resposta do serviço.'
          : 'Usuário reativado conforme resposta do serviço.',
      );
      await this.loadCredential();
    } catch (error: unknown) {
      this.handleFailure(error);
    } finally {
      this.saving.set(false);
    }
  }

  protected confirmationTitle(): string {
    const titles: Record<PendingUserAction, string> = {
      BLOQUEAR: 'Bloquear usuário',
      REATIVAR: 'Reativar usuário',
      INATIVAR: 'Inativar usuário',
      SOLICITAR_ATIVACAO: 'Gerar token de ativação',
    };
    return this.pendingAction()
      ? titles[this.pendingAction() as PendingUserAction]
      : 'Confirmar ação';
  }

  protected confirmationDescription(): string {
    const descriptions: Record<PendingUserAction, string> = {
      BLOQUEAR: 'O acesso do usuário será bloqueado. Deseja continuar?',
      REATIVAR: 'O usuário voltará ao estado ativo. Deseja continuar?',
      INATIVAR: 'O usuário será inativado e deixará de operar na oficina. Deseja continuar?',
      SOLICITAR_ATIVACAO:
        'Um novo segredo de uso único será gerado e tokens anteriores serão invalidados. Deseja continuar?',
    };
    return this.pendingAction()
      ? descriptions[this.pendingAction() as PendingUserAction]
      : 'Deseja continuar?';
  }

  protected clearActivationToken(): void {
    this.activationToken.set(null);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(value),
    );
  }

  private selectedRoles(): UserRole[] {
    const value = this.form.getRawValue();
    return (
      [
        ['administrativo', value.administrativo],
        ['mecanico', value.mecanico],
        ['recepcionista', value.recepcionista],
      ] as const
    )
      .filter(([, selected]) => selected)
      .map(([role]) => role);
  }

  private fillForm(user: OperationalUser): void {
    this.form.setValue({
      name: user.name,
      document: user.document,
      administrativo: user.roles.includes('administrativo'),
      mecanico: user.roles.includes('mecanico'),
      recepcionista: user.roles.includes('recepcionista'),
    });
  }

  private updateCurrentUser(user: OperationalUser): void {
    this.user.set(user);
    this.fillForm(user);
    this.editing.set(false);
  }

  private handleFailure(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    this.failure.set(
      apiError?.status === 404
        ? 'Usuário não encontrado.'
        : 'Não foi possível concluir a operação. Tente novamente.',
    );
    this.correlationId.set(apiError?.correlationId ?? null);
  }
  private clearFailure(): void {
    this.failure.set(null);
    this.correlationId.set(null);
  }
}
