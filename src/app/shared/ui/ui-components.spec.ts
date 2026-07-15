import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './alert/alert';
import { Confirmation } from './confirmation/confirmation';
import { FormField } from './form-field/form-field';
import { Pagination } from './pagination/pagination';

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

  it('expõe confirmação como diálogo modal acessível', () => {
    const fixture = TestBed.createComponent(Confirmation);
    fixture.componentRef.setInput('title', 'Confirmar');
    fixture.componentRef.setInput('description', 'Descrição segura');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
