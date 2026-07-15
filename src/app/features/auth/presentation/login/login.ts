import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Alert, FormField } from '../../../../shared/ui';
import {
  AUTHENTICATE_USER,
  AuthenticationError,
  type AuthenticationFailureReason,
} from '../../public-api';

const errorMessages: Readonly<Record<AuthenticationFailureReason, string>> = {
  INVALID_INPUT: 'Informe um CPF válido com 11 números.',
  INVALID_CREDENTIALS: 'CPF ou senha inválidos.',
  ACCOUNT_UNAVAILABLE:
    'A conta está bloqueada, inativa ou ainda não possui uma credencial ativada. Procure a administração.',
  SERVICE_UNAVAILABLE: 'A autenticação está indisponível. Tente novamente em instantes.',
};

@Component({
  selector: 'app-login',
  imports: [Alert, FormField, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authenticate = inject(AUTHENTICATE_USER);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly pending = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  readonly form = new FormGroup({
    cpf: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{11}$/)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(128)],
    }),
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.failure.set(null);
    this.correlationId.set(null);
    try {
      await this.authenticate.execute(this.form.getRawValue());
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(isSafeReturnUrl(returnUrl) ? returnUrl : '/session');
    } catch (error: unknown) {
      const failure =
        error instanceof AuthenticationError
          ? error
          : new AuthenticationError('SERVICE_UNAVAILABLE', null);
      this.failure.set(errorMessages[failure.reason]);
      this.correlationId.set(failure.correlationId);
      this.form.controls.password.reset();
      this.form.controls.password.markAsTouched();
    } finally {
      this.pending.set(false);
    }
  }
}

const isSafeReturnUrl = (value: string | null): value is string =>
  value !== null && value.startsWith('/') && !value.startsWith('//');
