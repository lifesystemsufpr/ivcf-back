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

## Instituições & multitenancy — decisão para saúde pública

**Contexto:** o destino do sistema é a rede pública (SUS), num projeto da UF. O IVCF-20 é aplicado por equipe multiprofissional (fisioterapia, enfermagem, medicina etc. — o campo `HealthProfessional.speciality` já cobre isso) e o idoso circula entre serviços (UBS, ambulatório, hospital).

**Decisão: sem tenant.** O valor do fluxo de compartilhamento é a coordenação do cuidado *entre* unidades — um muro de tenant por instituição quebraria a descoberta de bases no melhor caso de uso. O cidadão é um só: registro de participante único e global na instância. A estrutura administrativa da rede entra como **dimensão de análise**, não como fronteira de dados. O isolamento clínico continua sendo por profissional, via `HistoricoBase`.

**`HealthUnit` (nova, tabela de referência):**

- `id`, `name` (+ `name_normalized`, padrão do projeto), `cnesCode? @unique` (código CNES — identificador oficial de estabelecimentos do SUS, dá interoperabilidade de graça), `type?` (UBS/hospital/…), `city?`, `state?`, `active`.
- `HealthProfessional.healthUnitId?` FK opcional (lotação; opcional para não travar cadastro).
- `Researcher.institutionId` promovida de string solta a FK para `HealthUnit`.
- Ganho no fluxo: na escolha de bases, o solicitante vê "profissional — especialidade — unidade".
- Ganho na gestão/pesquisa: dashboards por unidade/tipo/região (fragilidade média por UBS etc.).

**Multitenancy fica como opção futura**, apenas se o projeto virar plataforma multi-município com exigência de segregação administrativa: aí a `HealthUnit` evolui para baixo de uma `Organization` (secretaria municipal), com coluna discriminadora `organizationId` + filtro automático via Prisma `$extends` + RLS do Postgres como defesa em profundidade. Nada disso é pago agora.

## Riscos e mitigação

- **Schema ≠ código até a fase de implementação:** a renomeação `healthProfessionalId → appliedByProfessionalId` e a remoção do vínculo quebram compilação dos services se `prisma generate` for rodado antes da fase de código. Por isso esta entrega **não** roda generate/migrate.
- **Duplicação de dados clínicos (cópias):** mitigada por `sourceResponseId` + regra de filtro em análises.
- **Divergência do `participantId` denormalizado:** escrita de respostas passa sempre pelo service que valida `response.participantId === base.participantId`.
