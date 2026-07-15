import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { AUTHENTICATE_USER } from '../../auth.providers';
import { AuthenticationError } from '../../application';
import { Login } from './login';

describe('Login', () => {
  it('autentica com CPF e senha e segue para a sessão', async () => {
    const authenticate = { execute: vi.fn().mockResolvedValue(undefined) };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AUTHENTICATE_USER, useValue: authenticate }],
    }).compileComponents();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ cpf: '84191404067', password: 'secret' });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(authenticate.execute).toHaveBeenCalledWith({ cpf: '84191404067', password: 'secret' });
    expect(navigate).toHaveBeenCalledWith('/session');
  });

  it('orienta conta indisponível sem expor detalhes internos', async () => {
    const authenticate = {
      execute: vi.fn().mockRejectedValue(new AuthenticationError('ACCOUNT_UNAVAILABLE', null)),
    };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AUTHENTICATE_USER, useValue: authenticate }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ cpf: '84191404067', password: 'secret' });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('bloqueada, inativa ou ainda não possui');
    expect(fixture.componentInstance.form.controls.password.value).toBe('');
  });
});
