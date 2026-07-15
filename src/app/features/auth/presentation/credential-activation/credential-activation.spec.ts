import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { ACTIVATE_CREDENTIAL } from '../../auth.providers';
import { CredentialActivation } from './credential-activation';

describe('CredentialActivation', () => {
  it('envia somente token e senha e descarta os campos após o sucesso', async () => {
    const activate = { execute: vi.fn().mockResolvedValue(undefined) };
    await TestBed.configureTestingModule({
      imports: [CredentialActivation],
      providers: [provideRouter([]), { provide: ACTIVATE_CREDENTIAL, useValue: activate }],
    }).compileComponents();
    const fixture = TestBed.createComponent(CredentialActivation);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      token: 't'.repeat(43),
      password: 'senha-segura-123',
      confirmation: 'senha-segura-123',
    });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(activate.execute).toHaveBeenCalledWith({
      token: 't'.repeat(43),
      password: 'senha-segura-123',
    });
    expect(fixture.nativeElement.textContent).toContain('Credencial ativada');
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      token: '',
      password: '',
      confirmation: '',
    });
  });

  it('não envia senhas com confirmação diferente', async () => {
    const activate = { execute: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CredentialActivation],
      providers: [provideRouter([]), { provide: ACTIVATE_CREDENTIAL, useValue: activate }],
    }).compileComponents();
    const fixture = TestBed.createComponent(CredentialActivation);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      token: 't'.repeat(43),
      password: 'senha-segura-123',
      confirmation: 'senha-diferente',
    });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(activate.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('confirmação deve ser igual');
  });
});
