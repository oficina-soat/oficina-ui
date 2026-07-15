import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { REQUEST_CREDENTIAL_ACTIVATION } from '../../auth.providers';
import { ActivationRequest } from './activation-request';

describe('ActivationRequest', () => {
  it('exibe o segredo retornado somente no estado da tela', async () => {
    const requestActivation = {
      execute: vi.fn().mockResolvedValue({
        token: 'token-unico',
        expiresAt: '2026-07-15T18:00:00Z',
      }),
    };
    await TestBed.configureTestingModule({
      imports: [ActivationRequest],
      providers: [
        provideRouter([]),
        { provide: REQUEST_CREDENTIAL_ACTIVATION, useValue: requestActivation },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ActivationRequest);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ userId: '0190c128-7b78-7a6c-9a9d-37dbfe65ecad' });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(requestActivation.execute).toHaveBeenCalledWith({
      userId: '0190c128-7b78-7a6c-9a9d-37dbfe65ecad',
    });
    expect(fixture.nativeElement.querySelector('output').textContent).toContain('token-unico');
    expect(fixture.componentInstance.form.controls.userId.value).toBe('');
  });
});
