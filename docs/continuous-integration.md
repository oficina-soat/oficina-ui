# Integração contínua

O workflow `UI Quality Gate` é a barreira única de qualidade da interface. Ele é executado em pull requests para `main`, pode ser acionado manualmente e é reutilizado obrigatoriamente pelo deploy.

## Jobs obrigatórios

### Build, testes e segurança

1. Faz checkout da revisão exata.
2. Usa a versão de Node.js fixada em `.node-version` e cacheia somente o cache do npm.
3. Executa `npm ci`, respeitando integralmente o `package-lock.json`.
4. Executa geração dos clientes, format check, lint, guardrails arquiteturais, testes com cobertura, build de produção, scanner de segurança e auditoria das dependências de produção.
5. Publica o build validado como artefato temporário e imutável da revisão.

### E2E, teclado e acessibilidade

1. Instala as mesmas dependências reproduzíveis.
2. Cacheia o binário do Chromium pela versão do lockfile.
3. Executa os fluxos Playwright contra APIs simuladas somente na fronteira HTTP.
4. Valida caminho feliz, rejeição, autorização, idempotência, sessão, teclado, viewport móvel e regras WCAG automatizáveis.
5. Preserva traces, screenshots e relatório somente quando houver falha.

Os jobs são independentes e executam em paralelo. Qualquer falha bloqueia o job de deploy; este apenas baixa o build que passou pelo Quality Gate, sem recompilá-lo.

## Proteção de branch

Depois que o workflow estiver publicado, configure a branch `main` para exigir o status `UI Quality Gate / Build, tests and security` e `UI Quality Gate / E2E, keyboard and accessibility` antes do merge. Essa configuração é externa ao repositório e deve ser feita depois do primeiro run, quando os nomes dos checks estiverem disponíveis no GitHub.
