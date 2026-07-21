# Design — Históricos independentes por profissional & Notificações

**Data:** 2026-07-21 · **Status:** aprovado para planejamento · **Escopo desta entrega:** DER + este documento + `prisma/schema.prisma` (sem services/endpoints/migration)

Artifact com DER e fluxograma (dark): https://claude.ai/code/artifact/69d56354-19b4-4246-a744-4083c4368a8d

## Problema

Hoje `QuestionnaireResponse` liga participante ↔ profissional ↔ questionário diretamente: todo profissional vinculado enxerga o mesmo conjunto de respostas e não existe conceito de "histórico do profissional X sobre o participante Y". O produto precisa de:

1. Múltiplos históricos **independentes** por participante, isolados por profissional (dono).
2. Fluxo de **solicitação/aprovação** para um profissional iniciar seu histórico a partir da base de outro (fluxograma do projeto).
3. **Notificações** persistidas para esse fluxo (e reutilizáveis no futuro).
4. Consulta eficiente de "quais profissionais têm histórico ativo com o participante X" antes de disparar notificações.

## Decisões (com o produto)

| Decisão | Escolha |
|---|---|
| Semântica do compartilhamento | **Cópia (snapshot)**: aprovado o pedido, o solicitante recebe uma cópia das respostas até `snapshotAt` (momento do pedido). Evoluções posteriores do dono **não** aparecem para ele. |
| Granularidade do container | **Uma `HistoricoBase` por (participante + profissional)**, agrupando todas as aplicações de questionário daquele dono. |
| Notificações | **Entidade genérica reutilizável** (`Notification`), com FK de conveniência para `ShareRequest`. |
| Vínculo existente | **`HealthProfessionalParticipant` é removida** — a `HistoricoBase` tem o mesmo grão e passa a ser a única fonte de verdade do vínculo (decisão de arquitetura, abaixo). |

## Decisão de arquitetura: HistoricoBase substitui a tabela de vínculo

`health_professional_participant` tem grão `(healthProfessionalId, participantId)` — o mesmo da nova `HistoricoBase`. Manter ambas criaria duas fontes de verdade para "quem atende quem", que inevitavelmente divergem. Portanto:

- `HistoricoBase` **é** o vínculo, enriquecido com `origin` (`FROM_SCRATCH`/`COPIED`) e `active`, e agrupa as respostas do dono.
- Backfill (fase de migração, fora deste escopo): cada linha do vínculo atual vira uma `HistoricoBase(origin=FROM_SCRATCH)`; respostas existentes religam-se pela dupla (participantId, healthProfessionalId aplicador).
- Services que hoje usam `participantsLinks`/`healthProfessionalsLinks` passarão a consultar `HistoricoBase` (fase de implementação, fora deste escopo).

## Modelo de dados

### Novas entidades

**`HistoricoBase`** (`historico_base`) — vínculo + container de evolução por dono

- `id`, `participantId` (FK), `ownerProfessionalId` (FK), `origin: HistoricoOrigin`, `active`, timestamps
- `@@unique([participantId, ownerProfessionalId])` — um histórico por dono por participante; o prefixo do índice único atende a consulta "donos com base ativa do participante X" (requisito de performance)
- `@@index([ownerProfessionalId])` — "meus pacientes"

**`ShareRequest`** (`share_request`) — transição do opt-in/aprovação

- `id`, `participantId`, `requesterProfessionalId`, `ownerProfessionalId`
- `sourceHistoricoBaseId` (base do dono), `targetHistoricoBaseId?` (base criada para o solicitante na aprovação)
- `status: ShareRequestStatus` (`PENDING | APPROVED | REJECTED | CANCELLED`)
- `snapshotAt` (corte temporal da cópia = momento do pedido), `requestedAt`, `respondedAt?`
- `@@index([ownerProfessionalId, status])` (pendências do dono), `@@index([requesterProfessionalId, status])`, `@@index([participantId])`
- Invariante de aplicação (Postgres partial unique não é expressável no Prisma): **no máximo uma `ShareRequest` `PENDING` por (requester, source)** — validar no service.

**`Notification`** (`notification`) — genérica reutilizável

- `id`, `recipientUserId` (FK `User`), `type: NotificationType`, `title`, `body?`
- Ponteiro genérico `entityType?`/`entityId?` + FK de conveniência `shareRequestId?`
- `readAt?` (não-lida = `NULL`), `createdAt`
- `@@index([recipientUserId, readAt])`, `@@index([recipientUserId, createdAt])`

### Entidades alteradas

**`QuestionnaireResponse`**

- `+ historicoBaseId` (FK) — a que base a resposta pertence (agrupamento primário)
- `healthProfessionalId` → **`appliedByProfessionalId`** — autoria original preservada; numa cópia, difere do dono da base
- `+ sourceResponseId?` (auto-FK) — linhagem: cópia aponta a resposta original
- `participantId` **mantido denormalizado** (= `historicoBase.participantId`) para não quebrar dashboards/consultas de pesquisa; invariante garantida no service
- **Regra de negócio obrigatória:** análises populacionais/pesquisa filtram `sourceResponseId IS NULL` para não contar cópias em duplicidade

**`Participant` / `HealthProfessional` / `User`** — trocam as relações de vínculo antigas pelas novas (`historicoBases`, `shareRequests*`, `notifications`).

### Removida

**`HealthProfessionalParticipant`** — substituída pela `HistoricoBase` (ver decisão acima).

### Enums novos

`HistoricoOrigin { FROM_SCRATCH, COPIED }` · `ShareRequestStatus { PENDING, APPROVED, REJECTED, CANCELLED }` · `NotificationType { SHARE_REQUEST_RECEIVED, SHARE_REQUEST_APPROVED, SHARE_REQUEST_REJECTED, SYSTEM }`

## Fluxo mapeado (fluxograma → modelo)

1. **Profissional X cria participante.** Não existe → fluxo padrão (`User` + `Participant`) + `HistoricoBase(origin=FROM_SCRATCH)` para X.
2. **Já existe** → sistema alerta e oferece: criar do zero **ou** partir da base de outro profissional.
3. **Criar do zero** → nova `HistoricoBase(FROM_SCRATCH)` vazia; sem herança.
4. **Usar base de outro** → query no índice de `historico_base(participantId)` lista donos ativos; X escolhe 1..N.
5. Para cada dono: `ShareRequest(PENDING, snapshotAt=now)` + `Notification(SHARE_REQUEST_RECEIVED)` ao dono.
6. **Aprova** → transação: cria `HistoricoBase(COPIED)` para X (se ainda não criada), copia `QuestionnaireResponse` (+`Answer`) com `date <= snapshotAt` marcando `sourceResponseId`, seta `targetHistoricoBaseId`, `status=APPROVED`, `Notification(SHARE_REQUEST_APPROVED)` ao solicitante. Cópia é independente dali em diante.
7. **Recusa** → `status=REJECTED` + `Notification(SHARE_REQUEST_REJECTED)`; nada é copiado.

## Fora de escopo desta entrega (próximas fases)

- Migration SQL + backfill (`prisma/backfill.ts` como referência de padrão).
- Ajuste dos services/módulos NestJS (`participant`, `questionnaire`, `dashboard`) e novos módulos `historico`/`notification`.
- Endpoints do fluxo de solicitação/aprovação e de leitura de notificações.
- Detecção de duplicidade no cadastro ("já existe?") — hoje inexistente; exigirá critério (e-mail/CPF).

## Sugestão: Multitenancy (fora de escopo, recomendação)

**Diagnóstico:** o sistema hoje **não é multitenant**. Não há entidade de tenant; `Researcher.institutionId` é uma string sem FK e não escopa nada. Instituições diferentes na mesma instância compartilham o espaço de dados — e a listagem de "profissionais com base ativa" do fluxo de compartilhamento atravessaria instituições sem controle.

**Recomendação (quando for priorizado):** banco e schema compartilhados com **coluna discriminadora** `organizationId` — estratégia padrão para o porte do projeto; RLS do Postgres como endurecimento posterior.

- Nova `Organization` (`id`, `name`, `slug @unique`, `active`).
- `User.organizationId` FK obrigatória; `Participant`/`HealthProfessional`/`Researcher` herdam o escopo via `User` (id compartilhado). `Researcher.institutionId` promovida a FK para `Organization`.
- `organizationId` **denormalizado** em `HistoricoBase`, `ShareRequest` e `Notification`, com índices compostos (`@@index([organizationId, ...])`), para que as queries do fluxo nasçam filtradas por tenant sem join até `User`.
- **Decisão de produto pendente:** compartilhamento de base entre instituições. Sugestão: mesmo tenant por padrão (service valida requester e owner na mesma org); cross-org apenas como exceção explícita e auditada.

Diagrama da camada de tenant no artifact (seção "Multitenancy") e na cópia HTML ao lado desta spec.

## Riscos e mitigação

- **Schema ≠ código até a fase de implementação:** a renomeação `healthProfessionalId → appliedByProfessionalId` e a remoção do vínculo quebram compilação dos services se `prisma generate` for rodado antes da fase de código. Por isso esta entrega **não** roda generate/migrate.
- **Duplicação de dados clínicos (cópias):** mitigada por `sourceResponseId` + regra de filtro em análises.
- **Divergência do `participantId` denormalizado:** escrita de respostas passa sempre pelo service que valida `response.participantId === base.participantId`.
