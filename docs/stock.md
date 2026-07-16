# Estoque operacional

A feature `execution/stock` consulta o catálogo técnico de peças, o saldo e o
histórico de movimentos diretamente no `oficina-execution-service`.

## Fronteira de negócio

- nome, código, página e tipo de movimento são enviados como filtros à API;
- a UI não pagina nem filtra uma coleção completa localmente;
- disponível, reservado, valores e movimentos são apresentados sem recálculo;
- a entrada manual só é renderizada quando `acoesPermitidas` contém
  `REGISTRAR_ENTRADA`;
- reserva, consumo e estorno continuam sendo comandados pelos fluxos de domínio
  responsáveis e não são inferidos a partir do saldo;
- a API revalida quantidade, autorização, idempotência e consistência do estoque.

## Contratos consumidos

| Operação             | Rota                                                        |
| -------------------- | ----------------------------------------------------------- |
| Catálogo paginado    | `GET /api/v1/pecas?nome=&codigo=&page=&size=`               |
| Saldo e ações        | `GET /api/v1/estoques/pecas/{pecaId}/saldo`                 |
| Movimentos paginados | `GET /api/v1/estoques/movimentos?pecaId=&tipo=&page=&size=` |
| Entrada idempotente  | `POST /api/v1/estoques/movimentos/entrada`                  |

Todos os DTOs permanecem em `infrastructure`, são convertidos para modelos da
aplicação e não chegam diretamente à apresentação.
