import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('identifica a referência visual e a navegação de forma acessível', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main')?.id).toBe('main-content');
    expect(compiled.querySelector('h1')?.textContent).toContain('Componentes operacionais');
    expect(compiled.querySelector('nav')?.getAttribute('aria-label')).toBe('Navegação principal');
  });
});
