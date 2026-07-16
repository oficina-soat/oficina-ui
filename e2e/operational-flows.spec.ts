import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
            acoesPermitidas: ['INICIAR_DIAGNOSTICO', 'CANCELAR'],
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
          acoesPermitidas: ['INICIAR_DIAGNOSTICO', 'CANCELAR'],
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
          acoesPermitidas: ['CONCLUIR_DIAGNOSTICO', 'CANCELAR'],
        },
      });
      return;
    }
    if (url.pathname === '/api/v1/pecas') {
      await route.fulfill({
        json: {
          items: [
            {
              pecaId: 'peca-1',
              nome: 'Bateria 60Ah',
              codigo: 'BAT-60',
              valorUnitario: 320,
              ativo: true,
              criadoEm: '2026-01-01T00:00:00Z',
              atualizadoEm: '2026-01-01T00:00:00Z',
            },
          ],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      });
      return;
    }
    if (url.pathname === '/api/v1/estoques/pecas/peca-1/saldo') {
      await route.fulfill({
        json: {
          pecaId: 'peca-1',
          quantidadeDisponivel: 4,
          quantidadeReservada: 1,
          atualizadoEm: '2026-01-01T00:00:00Z',
          acoesPermitidas: ['REGISTRAR_ENTRADA'],
        },
      });
      return;
    }
    if (url.pathname === '/api/v1/estoques/movimentos' && request.method() === 'GET') {
      await route.fulfill({
        json: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 },
      });
      return;
    }
    if (url.pathname === '/api/v1/estoques/movimentos/entrada') {
      await route.fulfill({
        status: 201,
        json: {
          movimentoId: 'mov-1',
          pecaId: 'peca-1',
          tipo: 'ENTRADA',
          quantidade: 2,
          criadoEm: '2026-01-01T00:00:00Z',
        },
      });
      return;
    }
    if (url.pathname === '/api/v1/ordens-servico/ordem-1/orcamentos') {
      await route.fulfill({
        json: [
          {
            orcamentoId: 'orcamento-1',
            ordemServicoId: 'ordem-1',
            itens: [
              {
                tipo: 'SERVICO',
                itemId: 'item-1',
                nome: 'Troca de óleo',
                quantidade: 1,
                valorUnitario: 150,
                valorTotal: 150,
              },
            ],
            valorTotal: 150,
            status: 'GERADO',
            criadoEm: '2026-01-01T00:00:00Z',
            atualizadoEm: '2026-01-01T00:00:00Z',
            acoesPermitidas: ['APROVAR'],
          },
        ],
      });
      return;
    }
    if (url.pathname === '/api/v1/ordens-servico/ordem-1') {
      await route.fulfill({ json: { ordemServicoId: 'ordem-1', estado: 'AGUARDANDO_APROVACAO' } });
      return;
    }
    if (url.pathname === '/api/v1/ordens-servico/ordem-1/pagamentos') {
      await route.fulfill({
        json: [
          {
            pagamentoId: 'pagamento-1',
            ordemServicoId: 'ordem-1',
            orcamentoId: 'orcamento-1',
            valor: 150,
            metodo: 'PIX',
            status: 'CRIADO',
            criadoEm: '2026-01-01T00:00:00Z',
            atualizadoEm: '2026-01-01T00:00:00Z',
            acoesPermitidas: ['CONFIRMAR'],
          },
        ],
      });
      return;
    }
    if (url.pathname === '/api/v1/orcamentos/orcamento-1/aprovacao') {
      await route.fulfill({
        json: {
          orcamentoId: 'orcamento-1',
          ordemServicoId: 'ordem-1',
          itens: [],
          valorTotal: 150,
          status: 'APROVADO',
          criadoEm: '2026-01-01T00:00:00Z',
          atualizadoEm: '2026-01-01T01:00:00Z',
          acoesPermitidas: [],
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

const expectNoAccessibilityViolations = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
};

test('fluxo de login e shell não apresentam violações WCAG automatizáveis', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await expectNoAccessibilityViolations(page);

  await page.getByLabel('CPF').fill(cpf);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/session$/);
  await expectNoAccessibilityViolations(page);
});

test('shell móvel mantém menu e conteúdo acessíveis por teclado', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await mockApi(page);
  await login(page);

  const menu = page.getByRole('button', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();

  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test('login abre a visão operacional e permite consultar atendimento', async ({ page }) => {
  await mockApi(page);
  await login(page);

  await expect(page).toHaveURL(/\/session$/);
  await expect(page.getByRole('heading', { name: 'Visão operacional' })).toBeVisible();
  await expect(page.getByText('8', { exact: true })).toHaveCount(2);
  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
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

test('faturamento consulta, aprova e acompanha pagamento pelas respostas canônicas', async ({
  page,
}) => {
  await mockApi(page, { roles: ['administrativo'] });
  await login(page);
  await page.getByRole('link', { name: 'Faturamento' }).click();
  await page.getByLabel('Identificador da ordem de serviço').fill('ordem-1');
  await page.getByRole('button', { name: 'Consultar' }).click();
  await expect(page.getByText('Troca de óleo')).toBeVisible();
  await expect(page.getByText('CRIADO')).toBeVisible();
  await expect(page.getByText('AGUARDANDO_APROVACAO')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recusar orçamento' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Aprovar orçamento' }).click();
  await expect(page.getByText('Orçamento aprovado.')).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test('sessão expirada redireciona ao login após recarga', async ({ page }) => {
  await mockApi(page, { expiresIn: 1 });
  await login(page);
  await expect(page).toHaveURL(/\/session$/);
  await page.waitForTimeout(1100);
  await page.reload();

  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fsession$/);
});

test('estoque consulta saldo e registra somente ação oferecida pela API', async ({ page }) => {
  await mockApi(page, { roles: ['administrativo'] });
  await login(page);
  await page.getByRole('link', { name: 'Estoque' }).click();
  await expect(page.getByRole('cell', { name: 'Bateria 60Ah' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver estoque' }).click();
  await expect(page.getByTestId('stock-actions')).toHaveText('REGISTRAR_ENTRADA');
  await expect(page.getByRole('heading', { name: 'Registrar entrada' })).toBeVisible();
  await page.getByLabel('Quantidade').fill('2');
  await page.getByRole('button', { name: 'Registrar entrada' }).click();
  await expect(page.getByText('Disponível')).toBeVisible();
  await expectNoAccessibilityViolations(page);
});
