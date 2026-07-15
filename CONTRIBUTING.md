# Contribuindo com o oficina-ui

## Antes de implementar

Confirme que a tela usa uma rota presente nas OpenAPI do `oficina-platform`. Se a implementação exigir calcular, inferir ou validar definitivamente uma decisão de negócio, interrompa o frontend e registre a lacuna no contrato/backend.

## Fluxo mínimo

1. Escolha o próximo item aberto do roadmap do frontend.
2. Crie ou atualize os testes antes de concluir a implementação.
3. Execute format check, lint, testes, testes arquiteturais e build.
4. Revise acessibilidade, erros, loading e dados sensíveis.
5. Use commit local em português seguindo Conventional Commits.

## Checklist de revisão

- [ ] Nenhuma regra de negócio foi implementada ou duplicada.
- [ ] Componentes não acessam HTTP diretamente.
- [ ] DTOs externos ficaram restritos à infraestrutura.
- [ ] Autorização continua obrigatória no backend.
- [ ] Erros canônicos são apresentados sem serem reinterpretados.
- [ ] JWT, senha, CPF completo e dados financeiros não aparecem em logs.
- [ ] Formulários, foco e mensagens são acessíveis.
- [ ] Testes e build passaram sem warnings.
- [ ] Contratos e documentação relacionados continuam coerentes.
