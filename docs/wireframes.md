# Wireframes do MVP

Os wireframes definem hierarquia e estados, não identidade visual definitiva.

## Login

```text
+--------------------------------------+
| Oficina SOAT                         |
|                                      |
| CPF        [____________________]     |
| Senha      [____________________]     |
|                                      |
|                 [ Entrar ]            |
|                                      |
| <erro acessível, quando houver>       |
+--------------------------------------+
```

## Shell operacional

```text
+----------------+---------------------------------------------+
| Oficina SOAT   | Usuário / papel                     [Sair]  |
|----------------+---------------------------------------------|
| Atendimento    | Breadcrumb                                  |
| Ordens         |                                             |
| Fila mecânica  | Conteúdo da rota                            |
|                | loading | vazio | conteúdo | erro/retry     |
+----------------+---------------------------------------------+
```

## Atendimento

```text
+----------------------------------------------------------------+
| Clientes                                      [Novo cliente]   |
| Buscar [________________] [Buscar]                               |
|----------------------------------------------------------------|
| Nome              Documento mascarado       Ações               |
| Cliente exemplo   ***.***.***-**            [Abrir]             |
|----------------------------------------------------------------|
| Página < 1 2 3 >                                               |
+----------------------------------------------------------------+
```

O campo de busca só será ativado quando houver filtro correspondente na API. Até lá, a tela usa paginação sem simular busca local.

## Detalhes da OS

```text
+----------------------------------------------------------------+
| OS <id curto>                    Estado retornado pela API      |
| Cliente | Veículo | Problema                                   |
|----------------------------------------------------------------|
| Histórico                                                      |
| data/hora     estado     motivo                                 |
|----------------------------------------------------------------|
| Ações apresentadas pela capacidade contratada                  |
| [ação] [ação]                                                   |
+----------------------------------------------------------------+
```

## Fila do mecânico

```text
+----------------------------------------------------------------+
| Fila de execução                         [Atualizar]            |
|----------------------------------------------------------------|
| Prioridade | OS | Status | Entrada | Ação                       |
| 10         | .. | ...    | ...     | [Abrir]                    |
+----------------------------------------------------------------+
```

Em telas estreitas, navegação vira menu e tabelas usam cards ou rolagem identificada, preservando labels, foco e ordem de leitura.
