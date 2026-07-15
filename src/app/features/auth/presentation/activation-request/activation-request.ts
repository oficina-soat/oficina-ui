import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Alert, FormField } from '../../../../shared/ui';
import {
  CredentialActivationError,
  type CredentialActivationFailureReason,
  REQUEST_CREDENTIAL_ACTIVATION,
} from '../../public-api';
import type { CredentialActivation as CredentialActivationResult } from '../../application';

const errorMessages: Readonly<Record<CredentialActivationFailureReason, string>> = {
  INVALID_INPUT: 'Informe um identificador de usuário válido.',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Esta operação exige acesso administrativo.',
  USER_NOT_FOUND: 'O usuário ainda não foi projetado no serviço de autenticação.',
  ACCOUNT_UNAVAILABLE: 'O usuário não está ativo ou já possui uma credencial.',
  SERVICE_UNAVAILABLE: 'A geração do token está indisponível. Tente novamente em instantes.',
};

@Component({
  selector: 'app-activation-request',
  imports: [Alert, DatePipe, FormField, ReactiveFormsModule, RouterLink],
  templateUrl: './activation-request.html',
  styleUrl: './activation-request.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivationRequest {
  private readonly requestActivation = inject(REQUEST_CREDENTIAL_ACTIVATION);
  protected readonly pending = signal(false);
  protected readonly activation = signal<CredentialActivationResult | null>(null);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  readonly form = new FormGroup({
    userId: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      ],
    }),
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.activation.set(null);
    this.failure.set(null);
    this.correlationId.set(null);
    try {
      this.activation.set(
        await this.requestActivation.execute({ userId: this.form.controls.userId.value }),
      );
      this.form.reset();
    } catch (error: unknown) {
      const failure =
        error instanceof CredentialActivationError
          ? error
          : new CredentialActivationError('SERVICE_UNAVAILABLE', null);
      this.failure.set(errorMessages[failure.reason]);
      this.correlationId.set(failure.correlationId);
    } finally {
      this.pending.set(false);
    }
  }
}
