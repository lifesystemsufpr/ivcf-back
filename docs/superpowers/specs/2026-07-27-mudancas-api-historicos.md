# Mudanças na API — Históricos independentes & Notificações

**Data:** 2026-07-27 · **Base:** [spec de design](2026-07-21-historicos-notificacoes-design.md) + `prisma/schema.prisma` da branch `feat/der-historicos-notificacoes`

Levantamento do que deve ser **criado** e **adaptado** na API NestJS para o fluxograma funcionar sobre o schema novo. Não é implementação — é o mapa da fase seguinte.

## 1. Módulos novos

### 1.1 `historico` (ou dentro de `participant`)

| Método/Rota | Papel no fluxograma | Comportamento |
|---|---|---|
| `GET /participants/:id/historico-bases` | "Sistema lista os profissionais" | Lista bases **ativas** do participante: dono (nome, especialidade, unidade via `HealthUnit`), `origin`, `createdAt`, contagem de respostas. Query única no índice `historico_base(participantId)`. Roles: `HEALTH_PROFESSIONAL`. |
| `POST /participants/:id/historico-bases` | "Criar uma base do zero" | Cria `HistoricoBase(FROM_SCRATCH)` para o profissional autenticado sobre participante **já existente**. 409 se já possui base (unique do par). |

### 1.2 `share-request`

| Método/Rota | Papel no fluxograma | Comportamento |
|---|---|---|
| `POST /share-requests` | "Profissional escolhe quais quer" | Body: `participantId`, `sourceHistoricoBaseIds[]` (1..N). Para cada: valida base ativa, cria `ShareRequest(PENDING, snapshotAt=now)` + `Notification(SHARE_REQUEST_RECEIVED)` ao dono. Rejeita duplicata `PENDING` do mesmo (requester, source) — invariante de aplicação. |
| `GET /share-requests?as=owner\|requester&status=` | Caixas de entrada/saída | `as=owner`: pedidos que devo responder (índice `[ownerProfessionalId, status]`). `as=requester`: meus pedidos. |
| `PATCH /share-requests/:id/approve` | "Dono aprova" | Só o `ownerProfessional`. **Transação**: cria/reusa `HistoricoBase(COPIED)` do solicitante → copia `QuestionnaireResponse` (+ `Answer`) com `date <= snapshotAt`, setando `appliedByProfessionalId` original e `sourceResponseId` → seta `targetHistoricoBaseId`, `status=APPROVED`, `respondedAt` → `Notification(SHARE_REQUEST_APPROVED)` ao solicitante. |
| `PATCH /share-requests/:id/reject` | "Dono recusa" | `status=REJECTED` + `Notification(SHARE_REQUEST_REJECTED)`. Nada copiado. |
| `PATCH /share-requests/:id/cancel` | — | Solicitante cancela um `PENDING` próprio. |

### 1.3 `notification`

| Método/Rota | Comportamento |
|---|---|
| `GET /notifications?unread=true&page=` | Do usuário autenticado (qualquer role — FK é em `User`). Índice `[recipientUserId, readAt]`. |
| `PATCH /notifications/:id/read` | Marca `readAt`. Só o destinatário. |
| `PATCH /notifications/read-all` | Marca todas não-lidas. |

### 1.4 `health-unit`

CRUD simples (`GET /health-units` com busca por `name_normalized`, `POST/PATCH` restritos a `MANAGER`) para alimentar selects de lotação e a exibição "profissional — especialidade — unidade" na listagem de bases.

## 2. Endpoints existentes adaptados

### 2.1 `participant` ([participant.service.ts](../../../src/modules/participant/participant.service.ts))

- **`POST /participant` (create)** — troca `healthProfessionalsLinks.create` pela criação de `HistoricoBase(FROM_SCRATCH)` na mesma transação. Continua sendo o caminho do ramo "não existe" do fluxograma.
- **Ramo "já existe"** — `GET /participant/check-email/:email` já detecta existência; estender a resposta com `hasActiveBases: boolean` (e opcionalmente a contagem), para o front decidir entre alertar e seguir para `GET /participants/:id/historico-bases`. O cadastro de participante existente **não** passa por `POST /participant` (que deve continuar retornando 409 para e-mail duplicado): o front usa `POST .../historico-bases` (do zero) ou `POST /share-requests` (aproveitar).
- **`findAll`/`findOne`** — filtro `healthProfessionalsLinks: { some: ... } }` vira `historicoBases: { some: { ownerProfessionalId, active: true } }`.
- **`remove`/`checkDeletability`** — as relações consultadas passam a incluir `HistoricoBase` e `ShareRequest`.

### 2.2 `questionnaire` ([questionnaire.service.ts](../../../src/modules/questionnaire/questionnaire.service.ts) — ~30 usos de `healthProfessionalId`)

- **`POST /questionnaires/response`** — o service resolve a `HistoricoBase` do profissional autenticado para o `participantId` (erro 403/404 se não houver base ativa dele) e grava `historicoBaseId` + `appliedByProfessionalId = user.id`. O DTO **não** recebe `historicoBaseId` do cliente — deriva do token, mantendo a fronteira de escrita.
- **`GET /questionnaires` (findAll)** — semântica muda de "respostas que apliquei" para "respostas das **minhas bases**" (`historicoBase: { ownerProfessionalId: user.id }`) — inclui cópias recebidas, que agora são parte do meu histórico.
- **`GET /questionnaires/participant/:id/*`** (`evolution`, `evolution/daily`, `summary`, `score-history`, `domain-history`, `assessment/:id`, e `getByParticipant`) — hoje esses endpoints **não têm escopo de profissional** (qualquer autenticado vê tudo do participante). Com bases isoladas isso vira vazamento: todos passam a filtrar pela base do profissional autenticado (`historicoBase: { ownerProfessionalId: user.id, participantId }`). Para o role `PARTICIPANT`, visão da própria evolução = união das bases? **Decisão de produto pendente** — sugestão: participante vê tudo sobre si (é titular do dado), filtrando `sourceResponseId IS NULL` para não ver duplicatas.
- **Dashboards** (`dashboard`, `dashboard/export`, `dashboard/current-month`) — já são por profissional; trocam o filtro para as bases próprias. Cópias **contam** aqui (são o histórico do profissional), mas qualquer agregação populacional/pesquisa futura filtra `sourceResponseId IS NULL`.
- **`POST /questionnaires/responses/recompute`** — sem mudança estrutural; ao recompor scores deve processar originais e cópias igualmente.

### 2.3 `health-professional`

- `create/update`: aceitar `healthUnitId?` no DTO.
- Listagens que hoje expõem `participantsLinks` passam a derivar de `historicoBases`.

### 2.4 `researcher`

- `institutionId` vira FK: DTO passa a receber id de `HealthUnit` existente (ou endpoint de criação inline), com validação de existência.

## 3. DTOs novos/alterados

- **Novos:** `CreateShareRequestDto`, `RespondShareRequestDto` (se reject levar justificativa), `FilterShareRequestDto`, `FilterNotificationDto`, `CreateHealthUnitDto`/`UpdateHealthUnitDto`, `CreateHistoricoBaseDto` (vazio ou só validação de rota).
- **Alterados:** `CreateHealthProfessionalDto` (+`healthUnitId?`), `CreateResearcherDto` (`institutionId` validado como FK), resposta do `check-email` (+`hasActiveBases`), respostas de listagem de participantes (links → bases).

## 4. Regras transversais

- **Autorização por posse de base**: um profissional só lê/escreve respostas de bases onde é `ownerProfessional`. Centralizar num helper/guard (`assertBaseOwnership`) para não repetir em 10 endpoints.
- **Invariantes no service** (não expressáveis no Prisma): 1 `PENDING` por (requester, source); `response.participantId === base.participantId`; aprovação idempotente (re-aprovar `APPROVED` = no-op 409).
- **Transação de aprovação** é o ponto crítico de consistência — cópia de respostas+answers + update do pedido + notificação, tudo num `$transaction`.

## 5. Ordem de implementação sugerida

1. **Migration + backfill** (link → bases `FROM_SCRATCH`, religação das respostas, unidades a partir das strings de `institutionId`).
2. **Módulos novos** (`notification`, `share-request`, `historico`, `health-unit`) — não quebram nada existente.
3. **Adaptação** de `participant` e `questionnaire` (a parte com risco de regressão — cobrir com os specs de regressão existentes no padrão de `auth.regression.spec.ts`).
4. Frontend do fluxo (alerta de existência → escolha → caixa de aprovação → notificações).
