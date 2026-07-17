import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SessionStore } from '../../../core/auth/session.store';
import { LOAD_OPERATIONAL_DASHBOARD } from '../dashboard.providers';
import { Dashboard } from './dashboard';

registerLocaleData(localePt);

const token = (groups: readonly string[]): string =>
  `x.${btoa(JSON.stringify({ sub: '12345678901', groups })).replaceAll('=', '')}.x`;

describe('Dashboard', () => {
  it('apresenta agregados disponíveis e sinaliza indisponibilidade parcial', async () => {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: LOAD_OPERATIONAL_DASHBOARD,
          useValue: {
            execute: vi.fn().mockResolvedValue(fullDashboard),
          },
        },
      ],
    });
    TestBed.inject(SessionStore).start(token(['administrativo']), 3600);
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Ordens de serviço');
    });
    expect(fixture.nativeElement.textContent).toContain('Recebida');
    expect(fixture.nativeElement.textContent).toContain('Ruído no motor');
    expect(fixture.nativeElement.textContent).toContain('Execução');
    expect(fixture.nativeElement.textContent).toContain('Faturamento');
    expect(fixture.nativeElement.textContent).toContain('Credenciais');
    expect(fixture.nativeElement.textContent).not.toContain('Clientes');
  });

  it('distingue blocos vazios e oculta autoridades fora do papel', async () => {
    const data = {
      workOrders: { ...metadata, counts: [], attentions: [] },
      billing: { ...metadata, budgetCounts: [], paymentCounts: [], attentions: [] },
    };
    const fixture = await createDashboard(['recepcionista'], vi.fn().mockResolvedValue(data));

    expect(fixture.nativeElement.textContent).toContain('Nenhuma ordem requer atenção.');
    expect(fixture.nativeElement.textContent).toContain('Nenhuma pendência financeira.');
    expect(fixture.nativeElement.textContent).not.toContain('Execução');
    expect(fixture.nativeElement.textContent).not.toContain('Credenciais');
  });

  it('apresenta erro total com tentativa novamente', async () => {
    const fixture = await createDashboard(['mecanico'], vi.fn().mockResolvedValue({}));

    expect(fixture.nativeElement.textContent).toContain('Visão operacional indisponível');
    expect(
      [...fixture.nativeElement.querySelectorAll('button')].some((button: HTMLButtonElement) =>
        button.textContent?.includes('Tentar novamente'),
      ),
    ).toBe(true);
  });

  it('preserva o último snapshot quando a atualização fica parcialmente indisponível', async () => {
    const execute = vi.fn().mockResolvedValueOnce(fullDashboard).mockResolvedValueOnce({});
    const fixture = await createDashboard(['administrativo'], execute);

    const update = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Atualizar'),
    );
    update?.click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(execute).toHaveBeenCalledTimes(2);
      expect(fixture.nativeElement.textContent).toContain('Alguns indicadores estão indisponíveis');
    });
    expect(fixture.nativeElement.textContent).toContain('Ruído no motor');
  });
});

const createDashboard = async (
  roles: readonly string[],
  execute: ReturnType<typeof vi.fn>,
): Promise<ComponentFixture<Dashboard>> => {
  TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [provideRouter([]), { provide: LOAD_OPERATIONAL_DASHBOARD, useValue: { execute } }],
  });
  TestBed.inject(SessionStore).start(token(roles), 3600);
  const fixture = TestBed.createComponent(Dashboard);
  fixture.detectChanges();
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(execute).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Carregando visão operacional');
  });
  return fixture;
};

const metadata = { generatedAt: '2026-07-17T12:00:01Z', dataAsOf: '2026-07-17T12:00:00Z' };
const fullDashboard = {
  workOrders: {
    ...metadata,
    counts: [{ key: 'RECEBIDA', quantity: 3 }],
    attentions: [
      {
        id: 'ordem-12345678',
        state: 'RECEBIDA',
        description: 'Ruído no motor',
        enteredStateAt: metadata.dataAsOf,
      },
    ],
  },
  execution: {
    ...metadata,
    counts: [{ key: 'CRIADA', quantity: 1 }],
    queueTotal: 1,
    nextExecutions: [
      { id: 'execucao-123', workOrderId: 'ordem-12345678', status: 'CRIADA', position: 1 },
    ],
    stockAttentions: [{ id: 'peca-1', name: 'Filtro', balance: 1, threshold: 2 }],
  },
  billing: {
    ...metadata,
    budgetCounts: [{ key: 'GERADO', quantity: 1 }],
    paymentCounts: [{ key: 'PENDENTE', quantity: 1 }],
    attentions: [
      {
        type: 'ORCAMENTO',
        workOrderId: 'ordem-12345678',
        referenceId: 'orcamento-1',
        status: 'GERADO',
        value: 150,
        updatedAt: metadata.dataAsOf,
      },
    ],
  },
  users: {
    ...metadata,
    counts: [{ key: 'BLOQUEADO', quantity: 1 }],
    attentions: [
      { id: 'usuario-123', name: 'Maria', status: 'BLOQUEADO', updatedAt: metadata.dataAsOf },
    ],
  },
  credentials: {
    ...metadata,
    counts: [{ key: 'NAO_ATIVADA', quantity: 1 }],
    attentions: [{ id: 'usuario-123', status: 'NAO_ATIVADA', updatedAt: metadata.dataAsOf }],
  },
};
