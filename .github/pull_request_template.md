## Objetivo

Descreva o comportamento da interface alterado.

## Contratos consumidos

Liste as rotas/OpenAPI afetadas.

## Checklist

- [ ] Não inclui nem duplica regra de negócio.
- [ ] APIs continuam responsáveis por autorização e validação definitiva.
- [ ] Componentes não acessam HTTP diretamente.
- [ ] DTOs externos permanecem na infraestrutura.
- [ ] Loading, vazio, erro e rejeição foram tratados.
- [ ] JWT, senha e dados sensíveis não são registrados.
- [ ] Acessibilidade e responsividade foram verificadas.
- [ ] Lint, testes, arquitetura e build passaram sem warnings.
- [ ] Documentação e contratos relacionados continuam coerentes.
