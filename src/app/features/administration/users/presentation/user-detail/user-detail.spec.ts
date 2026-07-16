import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import {
  BLOCK_OPERATIONAL_USER,
  GET_OPERATIONAL_USER,
  GET_USER_CREDENTIAL,
  INACTIVATE_OPERATIONAL_USER,
  REACTIVATE_OPERATIONAL_USER,
  REQUEST_USER_CREDENTIAL_ACTIVATION,
  UPDATE_OPERATIONAL_USER,
} from '../../public-api';
import type { OperationalUser, UserAction } from '../../application';
import { UserDetail } from './user-detail';

const route = { snapshot: { paramMap: convertToParamMap({ usuarioId: 'user-1' }) } };
const user = (allowedActions: readonly UserAction[] = ['ATUALIZAR_DADOS']): OperationalUser => ({
  id: 'user-1',
  personId: 'person-1',
  name: 'Ana Operadora',
  document: '52998224725',
  status: 'ATIVO',
  roles: ['mecanico'],
  allowedActions,
  createdAt: '2026-07-16T00:00:00Z',
  updatedAt: '2026-07-16T01:00:00Z',
});

const configure = async (
  getUser: object,
  getCredential: object,
  update: object = { execute: vi.fn() },
  block: object = { execute: vi.fn() },
  requestActivation: object = { execute: vi.fn() },
): Promise<void> => {
  await TestBed.configureTestingModule({
    imports: [UserDetail],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: GET_OPERATIONAL_USER, useValue: getUser },
      { provide: GET_USER_CREDENTIAL, useValue: getCredential },
      { provide: UPDATE_OPERATIONAL_USER, useValue: update },
      { provide: BLOCK_OPERATIONAL_USER, useValue: block },
      { provide: REACTIVATE_OPERATIONAL_USER, useValue: { execute: vi.fn() } },
      { provide: INACTIVATE_OPERATIONAL_USER, useValue: { execute: vi.fn() } },
      { provide: REQUEST_USER_CREDENTIAL_ACTIVATION, useValue: requestActivation },
    ],
  }).compileComponents();
};

describe('UserDetail', () => {
  it('mantém o cadastro disponível quando a consulta da credencial falha', async () => {
    await configure(
      { execute: vi.fn().mockResolvedValue(user()) },
      { execute: vi.fn().mockRejectedValue(new Error('auth unavailable')) },
    );
    const fixture = TestBed.createComponent(UserDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(
        'Credencial temporariamente indisponível',
      );
    });
    expect(fixture.nativeElement.textContent).toContain('Ana Operadora');
  });

  it('edita dados e papéis somente quando a ação canônica está disponível', async () => {
    const updated = user();
    const update = { execute: vi.fn().mockResolvedValue(updated) };
    await configure(
      { execute: vi.fn().mockResolvedValue(user()) },
      { execute: vi.fn().mockResolvedValue({ status: 'ATIVA', allowedActions: [] }) },
      update,
    );
    const fixture = TestBed.createComponent(UserDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.section-header button') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      name: 'Ana Atualizada',
      document: '52998224725',
      administrativo: true,
      mecanico: false,
      recepcionista: true,
    });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(update.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Ana Atualizada',
      document: '52998224725',
      roles: ['administrativo', 'recepcionista'],
    });
  });

  it('não oferece edição quando o backend não retorna a ação', async () => {
    await configure(
      { execute: vi.fn().mockResolvedValue(user([])) },
      { execute: vi.fn().mockResolvedValue({ status: 'ATIVA', allowedActions: [] }) },
    );
    const fixture = TestBed.createComponent(UserDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-header button')).toBeNull();
  });

  it('confirma e executa somente a ação operacional retornada pelo backend', async () => {
    const block = { execute: vi.fn().mockResolvedValue(user(['REATIVAR', 'INATIVAR'])) };
    await configure(
      { execute: vi.fn().mockResolvedValue(user(['BLOQUEAR'])) },
      { execute: vi.fn().mockResolvedValue({ status: 'ATIVA', allowedActions: [] }) },
      undefined,
      block,
    );
    const fixture = TestBed.createComponent(UserDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const blockButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Bloquear usuário'),
    ) as HTMLButtonElement;
    blockButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    const confirmButton = [
      ...fixture.nativeElement.querySelectorAll('[role="alertdialog"] button'),
    ].find((button: HTMLButtonElement) =>
      button.textContent?.includes('Confirmar ação'),
    ) as HTMLButtonElement;
    confirmButton.click();
    await fixture.whenStable();
    expect(block.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      idempotencyKey: expect.any(String),
    });
  });

  it('exibe transitoriamente o token gerado pela autoridade de credencial', async () => {
    const activation = {
      execute: vi.fn().mockResolvedValue({
        activationToken: 'single-use-secret',
        expiresAt: '2026-07-17T00:00:00Z',
      }),
    };
    await configure(
      { execute: vi.fn().mockResolvedValue(user([])) },
      {
        execute: vi.fn().mockResolvedValue({
          status: 'NAO_ATIVADA',
          allowedActions: ['SOLICITAR_ATIVACAO'],
        }),
      },
      undefined,
      undefined,
      activation,
    );
    const fixture = TestBed.createComponent(UserDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    let activationButton: HTMLButtonElement | undefined;
    await vi.waitFor(() => {
      fixture.detectChanges();
      activationButton = [...fixture.nativeElement.querySelectorAll('button')].find(
        (button: HTMLButtonElement) => button.textContent?.includes('Gerar token de ativação'),
      ) as HTMLButtonElement | undefined;
      expect(activationButton).toBeTruthy();
    });
    if (!activationButton) throw new Error('Botão de ativação não renderizado.');
    activationButton.click();
    fixture.detectChanges();
    const confirmButton = [
      ...fixture.nativeElement.querySelectorAll('[role="alertdialog"] button'),
    ].find((button: HTMLButtonElement) =>
      button.textContent?.includes('Confirmar ação'),
    ) as HTMLButtonElement;
    confirmButton.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(activation.execute).toHaveBeenCalledWith('user-1');
    expect(fixture.nativeElement.textContent).toContain('single-use-secret');
  });
});
