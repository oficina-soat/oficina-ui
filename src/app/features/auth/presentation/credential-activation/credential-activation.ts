import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Alert, FormField } from '../../../../shared/ui';
import {
  ACTIVATE_CREDENTIAL,
  CredentialActivationError,
  type CredentialActivationFailureReason,
} from '../../public-api';

const errorMessages: Readonly<Record<CredentialActivationFailureReason, string>> = {
  INVALID_INPUT: 'O token é inválido ou expirou. Solicite um novo token à administração.',
  UNAUTHENTICATED: 'A sessão administrativa expirou.',
  FORBIDDEN: 'Esta operação exige acesso administrativo.',
  USER_NOT_FOUND: 'O usuário ainda não está disponível para ativação.',
  ACCOUNT_UNAVAILABLE: 'A credencial não pode ser ativada no estado atual informado pela API.',
  SERVICE_UNAVAILABLE: 'A ativação está indisponível. Tente novamente em instantes.',
};

@Component({
  selector: 'app-credential-activation',
  imports: [Alert, FormField, ReactiveFormsModule, RouterLink],
  templateUrl: './credential-activation.html',
  styleUrl: './credential-activation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredentialActivation {
  private readonly activate = inject(ACTIVATE_CREDENTIAL);
  protected readonly pending = signal(false);
  protected readonly completed = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  readonly form = new FormGroup({
    token: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(43), Validators.maxLength(512)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)],
    }),
    confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.controls.password.value !== this.form.controls.confirmation.value) {
      this.failure.set('A confirmação deve ser igual à nova senha.');
      this.form.controls.confirmation.setErrors({ mismatch: true });
      return;
    }

    this.pending.set(true);
    this.failure.set(null);
    this.correlationId.set(null);
    try {
      const { token, password } = this.form.getRawValue();
      await this.activate.execute({ token, password });
      this.form.reset();
      this.completed.set(true);
    } catch (error: unknown) {
      const failure =
        error instanceof CredentialActivationError
          ? error
          : new CredentialActivationError('SERVICE_UNAVAILABLE', null);
      this.failure.set(errorMessages[failure.reason]);
      this.correlationId.set(failure.correlationId);
      this.form.controls.password.reset();
      this.form.controls.confirmation.reset();
    } finally {
      this.pending.set(false);
    }
  }
}
