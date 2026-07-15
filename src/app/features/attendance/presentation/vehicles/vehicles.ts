import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Alert, DataTable, EmptyState, FormField, Loading } from '../../../../shared/ui';
import type { ClientVehicles } from '../../application';
import {
  CREATE_VEHICLE,
  LOAD_CLIENT_VEHICLES,
  VehicleOperationError,
  type VehicleFailureReason,
} from '../../public-api';

const errorMessages: Readonly<Record<VehicleFailureReason, string>> = {
  INVALID_INPUT: 'Revise os dados do veículo e tente novamente.',
  DUPLICATE: 'Já existe um veículo com os dados informados.',
  NOT_FOUND: 'O cliente não foi encontrado ou não está mais disponível.',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente para continuar.',
  SERVICE_UNAVAILABLE: 'O serviço de veículos está indisponível. Tente novamente em instantes.',
  UNKNOWN: 'Não foi possível concluir a operação.',
};

@Component({
  selector: 'app-vehicles',
  imports: [Alert, DataTable, EmptyState, FormField, Loading, ReactiveFormsModule, RouterLink],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vehicles implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly loadClientVehicles = inject(LOAD_CLIENT_VEHICLES);
  private readonly createVehicle = inject(CREATE_VEHICLE);
  private readonly clientId = this.route.snapshot.paramMap.get('clienteId');
  protected readonly data = signal<ClientVehicles | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly failureDetails = signal<readonly string[]>([]);
  protected readonly correlationId = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  readonly form = new FormGroup({
    placa: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    marca: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    modelo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    ano: new FormControl<number | null>(null, { validators: [Validators.min(1900)] }),
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    if (!this.clientId || this.loading()) {
      if (!this.clientId) this.failure.set('O identificador do cliente não foi informado.');
      return;
    }
    this.loading.set(true);
    this.clearFailure();
    try {
      this.data.set(await this.loadClientVehicles.execute(this.clientId));
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
    if (!this.clientId || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.clearFailure();
    const value = this.form.getRawValue();
    try {
      const vehicle = await this.createVehicle.execute({
        clienteId: this.clientId,
        placa: value.placa,
        marca: value.marca,
        modelo: value.modelo,
        ...(value.ano === null ? {} : { ano: value.ano }),
        idempotencyKey: crypto.randomUUID(),
      });
      this.form.reset();
      this.formOpen.set(false);
      this.success.set(`Veículo ${vehicle.placa} cadastrado com sucesso.`);
      await this.load();
    } catch (error: unknown) {
      this.handleFailure(error);
    } finally {
      this.saving.set(false);
    }
  }

  private handleFailure(error: unknown): void {
    const failure =
      error instanceof VehicleOperationError ? error : new VehicleOperationError('UNKNOWN', null);
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
