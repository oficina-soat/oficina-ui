# Deploy no lab

A UI é publicada por um pipeline próprio em uma stack opcional de S3 e CloudFront. Ela não participa dos deploys dos backends nem altera a infraestrutura obrigatória da oficina.

## Pré-requisitos

1. Garanta que o Terraform opcional de hospedagem esteja disponível no branch `main` do `oficina-infra`; o deploy da UI aplica essa composição de forma idempotente antes da publicação.
2. Configure no `oficina-ui` os secrets AWS usados pelos demais repositórios.
3. Opcionalmente, configure variables para sobrescrever a descoberta automática:
   - `AWS_REGION`, normalmente `us-east-1`;
   - `TF_STATE_BUCKET`, `TF_STATE_REGION` e, se usado, `TF_STATE_DYNAMODB_TABLE`;
   - `UI_API_BASE_URL`, incluindo `/api/v1`;
   - `UI_AUTH_BASE_URL`, contendo somente o origin do API Gateway;
   - `UI_OBSERVABILITY_ENDPOINT`, com o endpoint HTTPS do coletor de telemetria.

Sem overrides, o pipeline deriva o bucket compartilhado pela conta e região AWS, lê `api_gateway_endpoint` do state principal, monta os endpoints públicos e usa o origin como `connect-src` da CSP. Em seguida, aplica de forma idempotente a hospedagem S3 e CloudFront no state isolado.

O pipeline lê `bucket_name`, `cloudfront_distribution_id` e `ui_url` diretamente do state isolado. Nenhum nome de recurso de hospedagem é duplicado no repositório da UI.

## Política de publicação

- o workflow reutilizável [UI Quality Gate](continuous-integration.md) executa instalação reproduzível, validações e E2E; qualquer falha bloqueia o deploy;
- o deploy baixa exatamente o artefato produzido pelo Quality Gate, sem recompilar a aplicação;
- artefatos com hash recebem cache de um ano e `immutable`;
- `index.html`, `config/runtime-config.json` e `deploy-metadata.json` não são armazenados em cache;
- somente caminhos mutáveis são invalidados no CloudFront;
- endpoints são injetados depois do build, sem recompilar nem armazenar credenciais;
- `deploy-metadata.json` registra repositório, revisão, run e horário do deploy.

Após um push em `main`, a URL aparece no summary do workflow `Deploy UI Lab`. O workflow também pode ser executado manualmente.
