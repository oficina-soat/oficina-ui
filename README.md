# oficina-ui

Interface operacional Angular da Oficina SOAT para recepção, administração e mecânicos.

## Estado

A fundação Angular e os guardrails arquiteturais estão ativos. O próximo incremento previsto é a integração tipada com os contratos OpenAPI dos backends.

## Desenvolvimento local

Requer Node.js `24.15.x` e npm `11.x`. Com o ambiente preparado:

```bash
npm install
npm start
```

Para apontar o desenvolvimento local ao `lab`, crie `proxy.conf.local.json` a partir do endpoint atual do API Gateway e execute `npm run start:lab`. O arquivo é local e não entra no Git nem no build de produção.

A configuração de execução fica em `public/config/runtime-config.json` e pode ser substituída no deploy sem recompilar a aplicação.

Antes de cada commit, execute:

```bash
npm run validate
```

Esse comando verifica formatação, lint, fronteiras arquiteturais, testes com cobertura, build de produção e vulnerabilidades das dependências de produção.

Para atualizar os clientes após uma mudança nos contratos canônicos:

```bash
npm run api:sync
npm run api:generate
```

O acesso às APIs usa o pipeline transversal documentado em [Arquitetura e guardrails](docs/architecture.md): sessão limitada à aba, correlação, erros canônicos e idempotência explícita para comandos.

O acesso publicado no `lab` usa uma stack opcional e isolada de S3 e CloudFront. O processo, as variáveis necessárias e a política de cache estão em [Deploy no lab](docs/deployment.md).

## Princípio arquitetural

O frontend não contém regras de negócio. Ele coordena a experiência, chama as APIs e apresenta o resultado canônico. Autorização, cálculos, transições, estoque, Saga e pagamentos permanecem nos backends.

```mermaid
flowchart LR
    UI[oficina-ui] --> API[API Gateway]
    API --> AUTH[Auth Lambda]
    API --> OS[OS Service]
    API --> EXEC[Execution Service]
    API --> BILL[Billing Service]
```

## Documentação

- [Arquitetura e guardrails](docs/architecture.md)
- [Design system operacional](docs/design-system.md)
- [Escopo do MVP](docs/product-scope.md)
- [Prontidão das APIs](docs/api-readiness.md)
- [Wireframes](docs/wireframes.md)
- [Acessibilidade](docs/accessibility.md)
- [Deploy no lab](docs/deployment.md)
- [Como contribuir](CONTRIBUTING.md)
- [Roadmap normativo](https://github.com/oficina-soat/oficina-platform/blob/main/docs/frontend/roadmap.md)
