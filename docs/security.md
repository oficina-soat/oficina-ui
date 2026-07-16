# Segurança da interface

A UI não é uma fronteira de autorização. As APIs continuam responsáveis por papéis, transições, cálculos e validações de negócio. Os controles deste documento reduzem exposição no navegador e na hospedagem estática.

## Build e configuração

- source maps e nomes de chunks estão explicitamente desabilitados em produção;
- a configuração de runtime aceita somente `apiBaseUrl`, `authBaseUrl` e a seção opcional `observability`, usando caminhos relativos ou HTTPS;
- endpoints são configuração pública, nunca local para credenciais, tokens ou chaves;
- o bootstrap registra apenas uma mensagem genérica, sem serializar erros ou respostas;
- `npm run test:security` inspeciona o build e falha ao encontrar source maps, arquivos de chave ou padrões de credenciais e tokens;
- `npm audit --omit=dev --audit-level=high` bloqueia vulnerabilidades altas ou críticas em dependências de produção.

## Sessão e dados sensíveis

O JWT permanece em `sessionStorage`, limitado à aba e removido no logout ou ao expirar. Senhas, tokens de ativação, JWT, CPF completo e dados financeiros não podem ser enviados a logs, telemetria ou metadados de deploy. Erros visuais usam mensagens canônicas e `correlationId` quando disponível.

## Hospedagem

O CloudFront define CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy`. O bucket é privado e aceita leitura somente pelo Origin Access Control da distribuição. A CSP restringe scripts ao mesmo origin e conexões aos origins HTTPS informados na stack opcional; `unsafe-inline` é permitido apenas para os estilos de componentes injetados pelo Angular.

Após o primeiro deploy, a homologação deve conferir os headers na resposta pública, o bloqueio de framing, o fallback de rotas e a ausência de arquivos `.map`. Essa evidência depende do ambiente e não substitui os guardrails locais.
