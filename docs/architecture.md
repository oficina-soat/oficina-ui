# Arquitetura e guardrails

## Princípio

O `oficina-ui` é uma interface operacional, não um domínio adicional. Ele coordena interação e apresenta respostas; os serviços decidem o resultado.

```mermaid
flowchart LR
    P[Presentation] --> A[Application]
    I[Infrastructure] --> A
    I --> API[APIs canônicas]
    API --> B[Regras de negócio nos backends]
```

## Fronteiras

| Camada           | Pode conter                                               | Não pode conter                                                 |
| ---------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| `presentation`   | componentes, páginas, formulários, rotas, view state      | HTTP direto, DTO externo, regra de negócio                      |
| `application`    | coordenação, ports, estado efêmero, comandos da UI        | cálculo financeiro, transição de estado, autorização definitiva |
| `infrastructure` | adapters HTTP, DTOs, mappers, sessão, configuração        | componentes, decisão de negócio, estado visual                  |
| `shared/ui`      | elementos visuais reutilizáveis                           | semântica de Cliente, OS, Billing ou Execution                  |
| `core`           | autenticação, erro, correlação e configuração transversal | features ou abstrações genéricas sem uso comprovado             |

## Exemplos proibidos

```typescript
// Proibido: reproduz uma transição de negócio.
const podeIniciarReparo = os.estado === 'EM_EXECUCAO' && estoqueDisponivel;

// Proibido: calcula valor pertencente ao Billing.
const total = itens.reduce((soma, item) => soma + item.valor * item.quantidade, 0);
```

A UI deve apresentar ações fornecidas ou aceitas pela API e tratar a eventual rejeição canônica. Ocultar uma ação por papel ou estado recebido é somente melhoria de experiência; nunca é controle de segurança.

## Guardrails automatizados

- ESLint com zero warnings e proibição de `any`/imports restritos;
- TypeScript estrito;
- teste de dependências entre camadas e features;
- busca por `HttpClient` fora de `infrastructure`/`core/http`;
- proibição de armazenamento persistente de credenciais no navegador;
- orçamento de bundle e build de produção;
- testes unitários com cobertura;
- auditoria das dependências de produção.

O comando `npm run validate` executa o conjunto obrigatório. Testes de adapters, mappers, acessibilidade e E2E devem ser acrescentados junto aos fluxos que exercitam, sem esperar uma etapa posterior de estabilização.
