import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {
  it('cria o composition root com outlet de rotas', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
