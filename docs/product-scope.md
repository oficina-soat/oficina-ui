# Escopo do frontend operacional

## Personas do MVP

| Persona        | Necessidade principal                              | Escopo inicial                                                   |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| Recepcionista  | registrar chegada e acompanhar atendimento         | login, clientes, veículos, abertura e consulta de OS             |
| Mecânico       | visualizar trabalho e registrar diagnóstico/reparo | login, fila, detalhes da execução, início e conclusão das etapas |
| Administrativo | acessar e apoiar os fluxos operacionais            | mesmos fluxos do MVP conforme autorização das APIs               |

Portal do cliente, gestão completa de usuários, estoque, financeiro e dashboards não pertencem ao MVP.

## Mapa de navegação

```mermaid
flowchart TD
    LOGIN[Login] --> APP[Shell operacional]
    APP --> CLIENTES[Clientes]
    CLIENTES --> CLIENTE[Cliente e veículos]
    CLIENTE --> NOVAOS[Abrir OS]
    APP --> ORDENS[Ordens de serviço]
    ORDENS --> OS[Detalhes e histórico]
    APP --> FILA[Fila do mecânico]
    FILA --> EXEC[Diagnóstico e reparo]
```

## Fluxos do MVP

### Atendimento

```mermaid
sequenceDiagram
    actor R as Recepcionista
    participant UI as oficina-ui
    participant API as OS API
    R->>UI: informa cliente e veículo
    UI->>API: solicita cadastro/consulta
    API-->>UI: resultado canônico
    R->>UI: solicita abertura da OS
    UI->>API: POST ordem de serviço
    API-->>UI: OS criada ou erro canônico
    UI-->>R: apresenta resultado
```

### Execução

```mermaid
sequenceDiagram
    actor M as Mecânico
    participant UI as oficina-ui
    participant API as Execution API
    M->>UI: consulta fila
    UI->>API: GET fila
    API-->>UI: execuções ordenadas
    M->>UI: solicita início/conclusão
    UI->>API: envia comando
    API-->>UI: estado aceito ou rejeição
    UI-->>M: apresenta resposta
```

## Critérios de experiência

Cada página deve prever carregamento, ausência de dados, indisponibilidade, erro de validação, rejeição de negócio, conflito idempotente, expiração da sessão e tentativa de operação não autorizada.
