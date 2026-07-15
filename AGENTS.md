# AGENTS.md

## Contexto

Este repositório contém a interface operacional Angular da Oficina SOAT. A fonte normativa é o repositório irmão [`../oficina-platform`](../oficina-platform/), especialmente a [ADR-013](../oficina-platform/adr/ADR-013%20-%20Frontend%20Operacional%20Angular.md), os contratos OpenAPI e o [roadmap do frontend](../oficina-platform/docs/frontend/roadmap.md).

## Regra principal

**Não implemente regras de negócio no frontend.** O backend é a única autoridade para autorização, estados, cálculos, estoque, Saga, pagamento, idempotência de negócio e publicação de eventos.

A UI pode validar forma e usabilidade, mas deve enviar a operação à API e apresentar sua resposta canônica. Não reconstrua ações permitidas combinando estados ou respostas. Quando faltar informação para uma tela, evolua primeiro o contrato e o serviço responsável.

## Arquitetura

- Organize código por feature.
- Preserve `presentation -> application <- infrastructure`.
- `presentation` contém páginas, componentes, formulários e navegação.
- `application` coordena estado e fluxos da tela por ports, sem decisões de negócio.
- `infrastructure` implementa HTTP, DTOs, mappers, autenticação e configuração.
- `core` contém apenas capacidades transversais realmente globais.
- `shared/ui` contém componentes visuais sem semântica de negócio.
- Componentes não podem importar ou injetar `HttpClient`.
- Features não podem importar diretórios internos de outra feature; use contratos públicos explícitos.
- DTOs gerados ou externos permanecem em `infrastructure` e devem ser mapeados antes de chegar à apresentação.
- Não crie pasta `utils` genérica, service locator, estado global indiscriminado ou abstração sem consumidor real.

## Angular e TypeScript

- Use a versão estável definida no `package.json`; atualizações de major exigem validação e registro.
- Use standalone components, lazy loading, Reactive Forms e TypeScript estrito.
- Prefira Signals para estado da interface; não adicione NgRx sem decisão explícita.
- Prefira componentes pequenos, acessíveis e com dependências explícitas.
- Templates não contêm chamadas complexas nem regras de decisão.
- Evite subscriptions manuais; quando inevitáveis, garanta teardown.
- Não use `any`, casts duplos ou supressões para contornar o compilador.
- Não altere o DOM diretamente quando uma API Angular equivalente existir.

## Integração

- Consuma apenas rotas públicas contratadas no `oficina-platform`.
- Encapsule clientes OpenAPI em adapters.
- Propague `Authorization`, `X-Correlation-Id` e chave idempotente conforme os contratos.
- Nunca registre JWT, senha, token de ativação, CPF completo ou dados financeiros sensíveis.
- Trate o modelo canônico de erro; não converta falha HTTP em sucesso visual.
- Guards e ocultação de botões melhoram a experiência, mas não substituem autorização no backend.

## Segurança e acessibilidade

- Não inclua secrets no build, environment files versionados ou source maps públicos.
- Preserve CSP e headers de segurança definidos pela infraestrutura.
- Todo fluxo deve funcionar por teclado, manter foco previsível e possuir labels acessíveis.
- Inclua estados de loading, vazio, erro, retry e confirmação proporcional à ação.
- Use datas, moeda e textos no padrão brasileiro sem alterar o valor canônico recebido.

## Testes e validação

Antes de concluir uma mudança, execute os scripts disponíveis no `package.json` para format check, lint, testes, arquitetura e build.

Mudanças de feature devem cobrir:

- coordenação da camada `application`;
- adapters HTTP e mappers;
- componentes e formulários relevantes;
- rejeições e erros canônicos;
- acessibilidade básica;
- teste E2E quando alterarem um fluxo principal.

O pipeline deve falhar em violações arquiteturais, warnings de lint, testes, cobertura, build ou Quality Gate.

## Commits

- Crie commits locais em português seguindo Conventional Commits.
- Não faça push sem solicitação explícita.
- Preserve mudanças preexistentes do usuário.
- Mudanças de arquitetura, contrato, framework, sessão, hospedagem ou dependência estrutural exigem atualização da documentação relacionada.
