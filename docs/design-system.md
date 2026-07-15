# Design system operacional

## Objetivo

Fornecer uma linguagem visual pequena, previsível e acessível para os fluxos internos. Os componentes não conhecem Cliente, Ordem de Serviço, execução, autorização ou transições; recebem texto, estado visual e conteúdo dos consumidores.

## Tokens

Os custom properties globais em `src/styles.scss` definem cores semânticas, espaçamento, raios, sombra e foco. Novas telas devem reutilizar esses tokens em vez de introduzir valores isolados.

As cores de feedback não podem ser o único meio de comunicar estado. Texto, título, roles e atributos ARIA continuam obrigatórios.

## Componentes

| Componente         | Responsabilidade                                                       |
| ------------------ | ---------------------------------------------------------------------- |
| `app-shell`        | layout responsivo, skip link, identidade e navegação principal         |
| `app-form-field`   | label, obrigatoriedade visual, hint e erro acessível                   |
| `app-alert`        | feedback informativo, sucesso, atenção ou erro                         |
| `app-data-table`   | região identificada e rolável para tabelas sem perder semântica nativa |
| `app-pagination`   | navegação anterior/próxima com anúncio da página atual                 |
| `app-loading`      | progresso indeterminado anunciado sem bloquear a tela inteira          |
| `app-empty-state`  | ausência de conteúdo e ação opcional                                   |
| `app-confirmation` | confirmação explícita de operação sensível                             |

Botões preservam o elemento nativo `button` e usam as classes `ui-button--primary`, `ui-button--secondary` ou `ui-button--danger`. Links não devem simular botões quando a ação for navegação.

## Regras de uso

- Cada página possui um único `h1` e hierarquia de títulos sem saltos.
- Campos possuem `id`, label e `aria-describedby` apontando para o hint ou erro do `app-form-field`.
- Tabelas mantêm `caption` visível ou nome equivalente no `app-data-table`, além de `th` com `scope`.
- Loading, vazio, erro e retry são estados explícitos e mutuamente compreensíveis.
- Confirmações explicam a operação; não afirmam que ela é válida. A API continua decidindo o resultado.
- Layouts devem continuar utilizáveis a 320 px, com zoom de 200% e somente teclado.
- Animações respeitam `prefers-reduced-motion`.

A página inicial funciona temporariamente como referência visual executável. Ela será substituída pelo shell real durante `UI-AUTH-001` e `UI-SHELL-001`, sem remover os componentes compartilhados.
