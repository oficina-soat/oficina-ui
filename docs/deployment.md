# Deploy no lab

A UI é publicada por um pipeline próprio em uma stack opcional de S3 e CloudFront. Ela não participa dos deploys dos backends nem altera a infraestrutura obrigatória da oficina.

## Pré-requisitos

1. Aplique `terraform/optional/ui-hosting/lab` no `oficina-infra` pelo workflow manual `UI Hosting Lab`.
2. Configure no `oficina-ui` os secrets AWS usados pelos demais repositórios.
3. Configure as variables:
   - `AWS_REGION`, normalmente `us-east-1`;
   - `TF_STATE_BUCKET`, `TF_STATE_REGION` e, se usado, `TF_STATE_DYNAMODB_TABLE`;
   - `UI_API_BASE_URL`, incluindo `/api/v1`;
   - `UI_AUTH_BASE_URL`, contendo somente o origin do API Gateway.

O pipeline lê `bucket_name`, `cloudfront_distribution_id` e `ui_url` diretamente do state isolado. Nenhum nome de recurso de hospedagem é duplicado no repositório da UI.

## Política de publicação

- `npm ci` garante instalação reproduzível e `npm run validate` bloqueia o deploy quando algum gate falha;
- artefatos com hash recebem cache de um ano e `immutable`;
- `index.html`, `config/runtime-config.json` e `deploy-metadata.json` não são armazenados em cache;
- somente caminhos mutáveis são invalidados no CloudFront;
- endpoints são injetados depois do build, sem recompilar nem armazenar credenciais;
- `deploy-metadata.json` registra repositório, revisão, run e horário do deploy.

Após um push em `main`, a URL aparece no summary do workflow `Deploy UI Lab`. O workflow também pode ser executado manualmente.
