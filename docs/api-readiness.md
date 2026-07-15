# Auditoria de prontidão das APIs para o MVP

## Fontes

- `oficina-platform/contracts/openapi/oficina-auth-lambda.yaml`
- `oficina-platform/contracts/openapi/oficina-os-service.yaml`
- `oficina-platform/contracts/openapi/oficina-execution-service.yaml`
- `oficina-platform/docs/infrastructure/api-gateway-public-routes.md`

## Matriz do MVP

| Capacidade             | Contrato atual                                                | Situação                                      |
| ---------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Login por CPF e senha  | `POST /auth/token`                                            | Pronto                                        |
| Ativação de credencial | `POST /auth/ativacoes`                                        | Pronto                                        |
| Clientes               | `GET/POST /api/v1/clientes`, `GET/PUT /clientes/{id}`         | Parcial                                       |
| Veículos               | rotas por cliente e por ID                                    | Pronto para cadastro/consulta vinculada       |
| Ordens de serviço      | listagem, abertura, detalhe, histórico, estado e cancelamento | Parcial                                       |
| Fila do mecânico       | `GET /api/v1/execucoes/fila`                                  | Parcial: lista ordenada sem paginação         |
| Diagnóstico e reparo   | comandos de início/conclusão e consulta da execução           | Pronto                                        |
| Erros e correlação     | contratos canônicos compartilhados                            | Pronto, sujeito à validação no cliente gerado |
| CORS                   | não é expresso nas OpenAPI                                    | Precisa validação no `oficina-infra`          |

## Lacunas antes das respectivas telas

### Busca de clientes

A listagem atual é paginada, mas não contrata busca por CPF, nome, e-mail ou placa. O MVP pode começar com paginação simples, porém uma operação cotidiana eficiente exige filtros implementados no OS. A UI não deve baixar todos os clientes e filtrar localmente.

### Listagem de ordens

A API permite paginação e filtro de estado, mas deve ser confirmada a necessidade de busca por cliente, veículo, placa e período. Esses filtros pertencem ao backend.

### Fila do mecânico

A fila retorna execuções ordenadas por prioridade e criação, com filtro opcional de status, mas não possui paginação. O MVP pode consumir a lista atual em baixo volume; paginação deve ser implementada no Execution antes de crescimento do volume, nunca simulada pela UI sobre uma carga total potencialmente grande.

### Ações disponíveis

Os contratos expõem estado e endpoints mutáveis, mas não uma lista explícita de ações permitidas. A primeira versão pode apresentar ações conforme papel/fluxo visual e sempre aceitar a rejeição do backend; não pode reproduzir a máquina de estados para decidir validade. Recomenda-se evoluir a representação de detalhe caso a experiência exija ações canônicas retornadas pelo serviço.

### CORS e configuração de origem

Validar preflight, headers `Authorization`, `Content-Type`, `X-Correlation-Id` e `X-Idempotency-Key`, métodos usados pelo MVP e origem CloudFront. A configuração deve ser declarada no `oficina-infra`, nunca contornada com proxy de produção no Angular.

### Sessão

O contrato retorna JWT, mas o MVP precisa confirmar `expiresIn`/claims necessárias para expiração e navegação por papel. A UI não usará claims para autorização definitiva.

## Decisão de início

Não há bloqueio para criar o scaffold, autenticação, cadastro vinculado, fila e comandos de execução. Busca operacional avançada e CORS devem ser resolvidos antes da homologação das telas afetadas.
