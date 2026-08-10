# Patch de migração Dev → Prod sem perda de dados

**Data:** 2026-08-10
**Status:** Aprovado

## Contexto

- O banco de produção foi criado via `prisma db push` a partir do schema da `main` — **não existe** tabela `_prisma_migrations` em prod.
- A branch `dev` introduz uma cadeia de 7 migrations começando por um `init` que cria tudo do zero; rodar `prisma migrate deploy` direto em prod falharia (tabelas já existem).
- A troca `user.cpf` → `user.email` nunca teve migration: o `init` da dev já nasce com `email`.

## Mudanças destrutivas prod → dev

1. `user.cpf` (unique) some; `user.email` (NOT NULL, unique) entra. Emails hoje só existem em `researcher.email` e `health_professional.email` — participantes e managers não têm.
2. `user.gender` move para `participant.gender` (NOT NULL); `user.phone` some.
3. `participant.scholarship` e `participant.socio_economic_level` somem (enums `Scholarship` e `SocialEconomicLevel` dropados).
4. Tabelas `institution` e `healthcare_unit` dropadas; `questionnaire_response.healthcareUnitId` some; FK `researcher.institutionId` vira coluna solta.
5. Nova tabela `health_professional_participant` (N:N).
6. Migrations de dados (`fix_ivcf_scores`, `update_ivcf_vision_hearing_questions`) precisam ter seus UPDATEs replicados no patch, pois o baseline as marcará como aplicadas **sem executá-las**.

## Decisões

- **Email sem fonte** → placeholder `<cpf>@ivcf.local`. Duplicatas de email entre users: o primeiro (por `createdAt`) mantém, os demais caem para o placeholder (com `RAISE NOTICE`).
- **Dados dropados** → arquivados no schema `legacy_backup` dentro do próprio banco (enums copiados como `text` para permitir o `DROP TYPE`). Prisma ignora schemas extras.
- **Backfill do N:N** → todos os pares distintos `(healthProfessionalId, participantId)` de `questionnaire_response`, com `createdAt = MIN(date)` (superset do comportamento da dev, que linkava só a primeira resposta).
- **Formato** → `prisma/prod-patch/patch-prod-to-dev-schema.sql` (transação única, guardas de estado, sanity checks com `RAISE EXCEPTION`) + `prisma/prod-patch/apply-prod-patch.sh` (roda o SQL com `ON_ERROR_STOP` e faz `prisma migrate resolve --applied` das 7 migrations para o baseline).

## Fluxo do SQL (transação única — falhou, rollback total)

1. Guardas: aborta se `user.cpf` não existe ou `user.email` já existe (patch já aplicado / banco errado).
2. Arquiva em `legacy_backup`: user(cpf, gender, phone), participant(scholarship, socio_economic_level), institution, healthcare_unit, questionnaire_response(healthcareUnitId), researcher(email), health_professional(email).
3. `user.email`: add coluna → copia de researcher/HP → placeholder p/ nulos → dedup → `SET NOT NULL` + `user_email_key` → dropa `cpf` e `user_cpf_key`.
4. `participant.gender`: add → copia de `user.gender` → `SET NOT NULL`; dropa scholarship/socio_economic_level; dropa `user.gender`/`user.phone`.
5. Drops estruturais: FK institution, `researcher.email`, `health_professional.email`, `healthcareUnitId` (FK/índice/coluna), tabelas institution/healthcare_unit, enums.
6. Cria `health_professional_participant` + índice + FKs (cascade) + backfill.
7. Fixes de dados: scores IVCF Q7–Q10 e texto das questões 18/19.
8. Sanity checks: sem email nulo/duplicado, contagens de user/participant/questionnaire_response preservadas, links ≥ participantes com resposta.

## Pós-migração (fora do script)

- Participantes e managers passam a logar com `<cpf>@ivcf.local` — comunicar front/equipe.
- `legacy_backup` pode ser dropado quando não for mais necessário: `DROP SCHEMA legacy_backup CASCADE;`

## Verificação (antes da entrega)

Testado contra Postgres descartável em Docker: schema de prod recriado a partir da `main` via `db push`, dados fake inseridos, patch aplicado, resultado comparado com o schema da dev via `prisma migrate diff` (esperado: sem diferenças) e baseline validado com `migrate resolve` + `migrate deploy` (esperado: nenhuma migration pendente).
