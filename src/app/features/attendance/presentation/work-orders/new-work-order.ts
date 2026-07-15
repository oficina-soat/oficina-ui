import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Alert, FormField } from '../../../../shared/ui';
import { OPEN_WORK_ORDER, WorkOrderOperationError } from '../../public-api';

@Component({
  selector: 'app-new-work-order',
  imports: [Alert, FormField, ReactiveFormsModule, RouterLink],
  template: `
    <section class="new-order" aria-labelledby="new-order-title">
      <a routerLink="/clientes">← Voltar para clientes</a>
      <header>
        <p class="eyebrow">Atendimento</p>
        <h1 id="new-order-title">Abrir ordem de serviço</h1>
        <p>Descreva o problema relatado para o veículo selecionado.</p>
      </header>
      @if (!contextValid) {
        <app-alert title="Veículo não selecionado" tone="warning"
          ><p>Inicie a abertura pela ação disponível na lista de veículos do cliente.</p></app-alert
        >
      }
      @if (failure()) {
        <app-alert title="Não foi possível abrir a OS" tone="danger"
          ><p>{{ failure() }}</p>
          @if (correlationId()) {
            <p>Referência: {{ correlationId() }}</p>
          }
        </app-alert>
      }
      @if (contextValid) {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-form-field
            inputId="problem-description"
            label="Problema relatado"
            messageId="problem-description-message"
            [required]="true"
            [error]="
              form.controls.description.touched && form.controls.description.invalid
                ? 'Descreva o problema relatado.'
                : undefined
            "
          >
            <textarea
              id="problem-description"
              formControlName="description"
              rows="5"
              aria-describedby="problem-description-message"
            ></textarea>
          </app-form-field>
          <button class="ui-button ui-button--primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Abrindo…' : 'Abrir ordem de serviço' }}
          </button>
        </form>
      }
    </section>
  `,
  styles: `
    .new-order {
      display: grid;
      gap: var(--space-6);
      max-width: 48rem;
    }
    header h1,
    header p {
      margin-block: 0 var(--space-2);
    }
    .eyebrow {
      color: var(--color-brand-600);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    form {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-6);
      border: 1px solid var(--color-neutral-300);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }
    .ui-button {
      justify-self: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewWorkOrder {
  private readonly open = inject(OPEN_WORK_ORDER);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly clienteId = this.route.snapshot.queryParamMap.get('clienteId');
  private readonly veiculoId = this.route.snapshot.queryParamMap.get('veiculoId');
  protected readonly contextValid = this.clienteId !== null && this.veiculoId !== null;
  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly correlationId = signal<string | null>(null);
  readonly form = new FormGroup({
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected async submit(): Promise<void> {
    if (!this.clienteId || !this.veiculoId || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.failure.set(null);
    this.correlationId.set(null);
    try {
      const order = await this.open.execute({
        clienteId: this.clienteId,
        veiculoId: this.veiculoId,
        problemDescription: this.form.controls.description.value,
        idempotencyKey: crypto.randomUUID(),
      });
      await this.router.navigate(['/ordens-servico', order.id]);
    } catch (error: unknown) {
      const failure =
        error instanceof WorkOrderOperationError
          ? error
          : new WorkOrderOperationError('UNKNOWN', null);
      const messages = {
        INVALID_INPUT: 'Revise a descrição informada.',
        CONFLICT: 'A OS não pode ser aberta neste momento.',
        NOT_FOUND: 'Cliente ou veículo não encontrado.',
        UNAUTHENTICATED: 'Sua sessão expirou.',
        SERVICE_UNAVAILABLE: 'O serviço está indisponível.',
        UNKNOWN: 'Não foi possível abrir a ordem.',
      } as const;
      this.failure.set(messages[failure.reason]);
      this.correlationId.set(failure.correlationId);
    } finally {
      this.saving.set(false);
    }
  }
}
