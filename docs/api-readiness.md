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
| Clientes               | `GET/POST /api/v1/clientes`, `GET/PUT /clientes/{id}`         | Pronto, com filtros por nome, CPF e e-mail    |
| Veículos               | rotas por cliente e por ID                                    | Pronto para cadastro/consulta vinculada       |
| Ordens de serviço      | listagem, abertura, detalhe, histórico, estado e cancelamento | Parcial                                       |
| Fila do mecânico       | `GET /api/v1/execucoes/fila`                                  | Parcial: lista ordenada sem paginação         |
| Diagnóstico e reparo   | comandos de início/conclusão e consulta da execução           | Pronto                                        |
| Erros e correlação     | contratos canônicos compartilhados                            | Pronto, sujeito à validação no cliente gerado |
| CORS                   | não é expresso nas OpenAPI                                    | Precisa validação no `oficina-infra`          |

## Lacunas antes das respectivas telas

### Busca de clientes

A listagem paginada contrata filtros opcionais por trecho de nome, CPF completo e trecho de e-mail. Os critérios são aplicados no OS antes da paginação; a UI envia os filtros como query parameters e não filtra resultados localmente. Busca por placa continua pertencendo às consultas de veículos ou a uma futura consulta operacional composta.

### Listagem de ordens

A API permite paginação e filtro de estado, mas deve ser confirmada a necessidade de busca por cliente, veículo, placa e período. Esses filtros pertencem ao backend.

### Fila do mecânico

A fila retorna execuções ordenadas por prioridade e criação, com filtro opcional de status, mas não possui paginação. O MVP pode consumir a lista atual em baixo volume; paginação deve ser implementada no Execution antes de crescimento do volume, nunca simulada pela UI sobre uma carga total potencialmente grande.

### Ações disponíveis

Os detalhes de OS e execução expõem listas canônicas de ações permitidas. A UI renderiza exclusivamente essas ações, enquanto os serviços revalidam autorização e transição ao receber cada comando.

### CORS e configuração de origem

Validar preflight, headers `Authorization`, `Content-Type`, `X-Correlation-Id` e `X-Idempotency-Key` e métodos usados pelo MVP. Como UI e APIs compartilham o HTTP API, o caminho padrão é same-origin; qualquer override externo deve continuar declarado no `oficina-infra`, nunca contornado com proxy de produção no Angular.

### Sessão

O JWT emitido foi confirmado com `groups` contendo os papéis `administrativo`, `mecanico` e `recepcionista`; `expiresIn` define a duração da sessão da aba. A UI decodifica apenas `groups` para guards e navegação visual, sem validar assinatura no navegador e sem usar claims para autorização definitiva.

O erro atual de autenticação usa o mesmo `motivo` (`Usuário inativo`) para usuário `INATIVO`, `BLOQUEADO` ou sem senha ativada. A UI apresenta orientação única de conta indisponível. Se o produto exigir mensagens distintas, o contrato deve fornecer códigos estáveis sem facilitar enumeração de usuários.

O fluxo de ativação preserva os dois passos do contrato serverless: a geração administrativa usa a sessão em memória e exibe o segredo somente no estado transitório da tela; a conclusão é pública e envia token e nova senha diretamente para `POST /auth/ativacoes`. Token, senha e confirmação não são gravados em storage, URL ou logs e são descartados após a conclusão.

## Decisão de início

Não há bloqueio contratual para autenticação, cadastro vinculado, pesquisa de clientes, fila e comandos de execução. CORS deve ser validado antes da hospedagem da UI em uma origem AWS própria.
