# Observabilidade do navegador

A instrumentação do navegador é independente de fornecedor e permanece desativada enquanto `observability.endpoint` não for informado na configuração de runtime. Ela nunca interfere no fluxo operacional: falhas de coleta são descartadas, sem retry ou persistência local.

## Eventos

- `api_error`: método HTTP, status, código canônico e `correlationId` devolvido pelo backend;
- `browser_error`: apenas a classificação genérica da falha tratada pelo Angular;
- `web_vital`: navegação, Largest Contentful Paint, Cumulative Layout Shift e Interaction to Next Paint quando suportados pelo navegador.

Cada envelope inclui somente versão do schema, UUID do evento, instante UTC, ambiente e revisão do deploy. Métricas são arredondadas antes do envio.

## Privacidade e segurança

Não são coletados URL, rota, query string, payload, mensagem, stack, conteúdo de formulários, CPF, JWT, senha, token de ativação ou dado financeiro. Método, código, ambiente, release e `correlationId` passam por allowlist de caracteres e limite de tamanho.

O envio usa `navigator.sendBeacon` com JSON diretamente ao endpoint HTTPS configurado. O coletor deve:

- aceitar `POST` com `Content-Type: application/json` e configurar CORS para o domínio do CloudFront;
- tratar `eventId` como chave de deduplicação;
- indexar `correlationId` para correlação com logs dos backends;
- aplicar retenção e controle de acesso compatíveis com telemetria operacional;
- retornar rapidamente, pois a UI não aguarda nem repete o envio.

O origin do coletor também precisa constar em `UI_CONNECT_SRC_ORIGINS` na stack de hospedagem para ser permitido pela CSP.

## Configuração

O pipeline cria a seção opcional abaixo quando a variable `UI_OBSERVABILITY_ENDPOINT` estiver definida:

```json
{
  "observability": {
    "endpoint": "https://telemetry.example/events",
    "environment": "lab",
    "release": "commit-sha"
  }
}
```

Sem essa variable, nenhum evento sai do navegador. A integração real com um coletor e a busca conjunta pelo `correlationId` serão verificadas na homologação do lab.
