# Acessibilidade

A interface operacional busca conformidade com WCAG 2.1 nível AA. A validação combina automação e inspeção manual, porque ferramentas automáticas não avaliam integralmente contexto, clareza e ordem de leitura.

## Guardrails implementados

- conteúdo semântico com um título principal por página, landmarks e tabelas identificadas;
- link para pular ao conteúdo e foco no conteúdo principal após navegação;
- foco visível, alvos interativos com altura mínima e operação por teclado;
- diálogos modais com nome, descrição, foco inicial, confinamento, fechamento por `Escape` e restauração do foco;
- campos com labels explícitos, mensagens associadas e indicação textual de obrigatoriedade e erro;
- estados de carregamento e retorno com regiões vivas apropriadas;
- layout adaptável a telas estreitas, sem exigir rolagem horizontal da página;
- preferência por movimento reduzido respeitada globalmente;
- paleta com contraste AA para texto e controles nos estados definidos pelo design system.

## Validação

`npm run test:e2e` executa axe-core nos fluxos de login e shell operacional usando regras WCAG A/AA, além de verificar navegação e foco em viewport móvel. Os testes unitários cobrem os contratos acessíveis dos componentes compartilhados, incluindo o comportamento de foco dos diálogos.

Antes de uma homologação, execute também a lista manual abaixo nos três fluxos do MVP:

1. Percorra controles, links, tabelas roláveis e diálogos apenas com `Tab`, `Shift+Tab`, `Enter`, `Espaço` e `Escape`.
2. Confirme ordem de foco, foco sempre visível, retorno ao acionador e ausência de armadilhas fora de diálogos.
3. Confira zoom em 200% e viewports de 320 px, 768 px e desktop, sem perda de conteúdo ou funcionalidade.
4. Use um leitor de tela para conferir landmarks, hierarquia de títulos, labels, erros, alertas e mudanças assíncronas.
5. Valide contraste de conteúdo dinâmico ou novos tokens antes de incorporá-los ao design system.
