import { expect, test, type Page, type Route } from '@playwright/test';

const cpf = '84191404067';
const password = 'secret';

const jwt = (roles: readonly string[], expiresIn = 3600): { token: string; expiresIn: number } => {
  const payload = Buffer.from(JSON.stringify({ sub: cpf, groups: roles })).toString('base64url');
  return { token: `header.${payload}.signature`, expiresIn };
};

interface ApiOptions {
  readonly roles?: readonly string[];
  readonly expiresIn?: number;
  readonly rejectLogin?: boolean;
  readonly onExecutionCommand?: (route: Route) => void;
}

const mockApi = async (page: Page, options: ApiOptions = {}): Promise<void> => {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/auth/token') {
      if (options.rejectLogin) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' }),
        });
        return;
      }
      const session = jwt(
        options.roles ?? ['administrativo', 'mecanico', 'recepcionista'],
        options.expiresIn,
      );
      await route.fulfill({
        json: { access_token: session.token, token_type: 'Bearer', expires_in: session.expiresIn },
      });
      return;
    }
    if (url.pathname === '/api/v1/clientes') {
      await route.fulfill({ json: { items: [], page: 0, size: 20, totalItems: 8, totalPages: 1 } });
      return;
    }
    if (url.pathname === '/api/v1/ordens-servico') {
      await route.fulfill({ json: { items: [], page: 0, size: 20, totalItems: 8, totalPages: 1 } });
      return;
    }
    if (url.pathname === '/api/v1/execucoes/fila') {
      await route.fulfill({
        json: [
          {
            execucaoId: 'execucao-1',
            ordemServicoId: 'ordem-1',
            status: 'CRIADA',
            prioridade: 10,
            posicao: 1,
            criadoEm: '2026-07-15T12:00:00Z',
            atualizadoEm: '2026-07-15T12:00:00Z',
          },
        ],
      });
      return;
    }
    if (url.pathname === '/api/v1/execucoes/execucao-1' && request.method() === 'GET') {
      await route.fulfill({
        json: {
          execucaoId: 'execucao-1',
          ordemServicoId: 'ordem-1',
          status: 'CRIADA',
          prioridade: 10,
          criadoEm: '2026-07-15T12:00:00Z',
          atualizadoEm: '2026-07-15T12:00:00Z',
        },
      });
      return;
    }
    if (url.pathname === '/api/v1/execucoes/execucao-1/diagnostico/inicio') {
      options.onExecutionCommand?.(route);
      await route.fulfill({
        json: {
          execucaoId: 'execucao-1',
          ordemServicoId: 'ordem-1',
          status: 'EM_DIAGNOSTICO',
          prioridade: 10,
          criadoEm: '2026-07-15T12:00:00Z',
          atualizadoEm: '2026-07-15T13:00:00Z',
        },
      });
      return;
    }
    await route.continue();
  });
};

const login = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('CPF').fill(cpf);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
};

test('login abre a visão operacional e permite consultar atendimento', async ({ page }) => {
  await mockApi(page);
  await login(page);

  await expect(page).toHaveURL(/\/session$/);
  await expect(page.getByRole('heading', { name: 'Visão operacional' })).toBeVisible();
  await expect(page.getByText('8', { exact: true })).toHaveCount(2);
  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
});

test('login rejeitado apresenta erro sem criar sessão', async ({ page }) => {
  await mockApi(page, { rejectLogin: true });
  await login(page);

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('CPF ou senha inválidos.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => sessionStorage.length)).toBe(0);
});

test('guard visual impede acesso administrativo de mecânico', async ({ page }) => {
  await mockApi(page, { roles: ['mecanico'] });
  await login(page);
  await page.goto('/administracao/ativacoes/nova');

  await expect(page).toHaveURL(/\/acesso-negado$/);
  await expect(page.getByRole('heading', { name: 'Acesso não disponível' })).toBeVisible();
});

test('fila executa comando idempotente e apresenta estado aceito', async ({ page }) => {
  let idempotencyKey: string | null = null;
  await mockApi(page, {
    roles: ['mecanico'],
    onExecutionCommand: (route) => {
      idempotencyKey = route.request().headers()['x-idempotency-key'] ?? null;
    },
  });
  await login(page);
  await page.getByRole('link', { name: 'Fila de execução' }).click();
  await expect(page.getByRole('cell', { name: 'Criada' })).toBeVisible();
  await page.getByRole('link', { name: 'Executar' }).click();
  await page.getByRole('button', { name: 'Iniciar diagnóstico' }).click();

  await expect(page.getByText('Diagnóstico iniciado.')).toBeVisible();
  await expect(page.getByText('Em diagnóstico', { exact: true })).toBeVisible();
  expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
});

test('sessão expirada redireciona ao login após recarga', async ({ page }) => {
  await mockApi(page, { expiresIn: 1 });
  await login(page);
  await expect(page).toHaveURL(/\/session$/);
  await page.waitForTimeout(1100);
  await page.reload();

  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fsession$/);
});
