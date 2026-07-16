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
| Botões apresentados pela capacidade contratada                 |
| [Iniciar diagnóstico] [Cancelar]                               |
+----------------------------------------------------------------+
```

## Administração de usuários

```text
+----------------------------------------------------------------+
| Usuários operacionais                                          |
| Nome [____] CPF [____] Estado [__] Papel [__] [Pesquisar]      |
|----------------------------------------------------------------|
| Nome       CPF mascarado       Estado     Papéis     [Detalhe] |
+----------------------------------------------------------------+

+----------------------------------------------------------------+
| Cadastro operacional                         [Editar, se válido]|
| Nome | CPF | Estado | Papéis                                   |
|----------------------------------------------------------------|
| Credencial de acesso                                           |
| estado | expiração, ou indisponibilidade parcial com retry     |
+----------------------------------------------------------------+
```

Edição e ações são exibidas somente quando a autoridade correspondente as retorna em `acoesPermitidas`. Bloqueio, reativação, inativação e geração do token exigem confirmação acessível. O token permanece apenas no estado transitório da tela. Falha do Auth não oculta nem invalida o cadastro operacional carregado do OS.

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
