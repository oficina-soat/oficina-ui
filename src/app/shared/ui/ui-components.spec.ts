import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './alert/alert';
import { Confirmation } from './confirmation/confirmation';
import { FormField } from './form-field/form-field';
import { Pagination } from './pagination/pagination';
import { Shell } from './shell/shell';

describe('componentes básicos de UI', () => {
  it('usa alert para falha e status para informação', () => {
    const fixture = TestBed.createComponent(Alert);
    fixture.componentRef.setInput('title', 'Falha');
    fixture.componentRef.setInput('tone', 'danger');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section').getAttribute('role')).toBe('alert');
  });

  it('associa label e mensagem ao campo projetado', () => {
    const fixture = TestBed.createComponent(FormField);
    fixture.componentRef.setInput('inputId', 'documento');
    fixture.componentRef.setInput('label', 'Documento');
    fixture.componentRef.setInput('error', 'Valor inválido');
    fixture.componentRef.setInput('messageId', 'documento-message');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('label').getAttribute('for')).toBe('documento');
    expect(fixture.nativeElement.querySelector('[role="alert"]').id).toBe('documento-message');
  });

  it('emite somente páginas válidas', () => {
    const fixture = TestBed.createComponent(Pagination);
    const pageChange = vi.fn();
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentInstance.pageChange.subscribe(pageChange);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0]?.disabled).toBe(true);
    buttons[1]?.click();
    expect(pageChange).toHaveBeenCalledWith(2);
  });

  it('expõe confirmação como diálogo modal acessível e confina o foco', async () => {
    const origin = document.createElement('button');
    document.body.appendChild(origin);
    origin.focus();
    const fixture = TestBed.createComponent(Confirmation);
    fixture.componentRef.setInput('title', 'Confirmar');
    fixture.componentRef.setInput('description', 'Descrição segura');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    const buttons = dialog.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(document.activeElement).toBe(buttons[0]);

    buttons[1]?.focus();
    buttons[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(buttons[0]);

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(origin);
    origin.remove();
  });

  it('oferece navegação responsiva e breadcrumb acessíveis', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Shell);
    fixture.componentRef.setInput('userLabel', 'Mecânico');
    fixture.componentRef.setInput('navigation', [{ label: 'Início', href: '/session' }]);
    fixture.componentRef.setInput('breadcrumb', ['Início', 'Fila']);
    fixture.detectChanges();

    const menuButton = fixture.nativeElement.querySelector(
      '.ui-shell__menu-button',
    ) as HTMLButtonElement;
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    menuButton.click();
    fixture.detectChanges();
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Caminho da página"]').textContent,
    ).toContain('Fila');
  });
});
