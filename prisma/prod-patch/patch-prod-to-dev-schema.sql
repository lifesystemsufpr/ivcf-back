-- ============================================================================
-- Patch de migração Dev → Prod SEM PERDA DE DADOS
-- ============================================================================
-- Transforma o banco de produção (criado via `prisma db push` a partir do
-- schema da main, SEM _prisma_migrations) no schema final da branch dev,
-- preservando todos os dados existentes.
--
-- - Roda em UMA transação: qualquer erro → rollback total, banco intacto.
-- - Dados que o schema novo remove são arquivados no schema `legacy_backup`.
-- - Replica os UPDATEs das migrations de dados (fix_ivcf_scores e
--   update_ivcf_vision_hearing_questions), pois o baseline as marcará como
--   aplicadas sem executá-las.
--
-- Uso: ./apply-prod-patch.sh  (ou: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f patch-prod-to-dev-schema.sql)
-- Depois do patch, o wrapper faz `prisma migrate resolve --applied` de cada
-- migration para que `prisma migrate deploy` futuro funcione normalmente.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Guardas: aborta se o banco não está no estado esperado de produção
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'cpf'
  ) THEN
    RAISE EXCEPTION 'Estado inesperado: coluna "user"."cpf" não existe. O patch já foi aplicado ou este não é o banco de produção esperado.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'Estado inesperado: coluna "user"."email" já existe. O patch já foi aplicado.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'health_professional_participant'
  ) THEN
    RAISE EXCEPTION 'Estado inesperado: tabela "health_professional_participant" já existe. O patch já foi aplicado.';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Arquivo: copia para legacy_backup tudo que o schema novo remove
--    (enums viram text para permitir o DROP TYPE no final)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS legacy_backup;

CREATE TABLE legacy_backup.user_legacy AS
  SELECT id, cpf, gender::text AS gender, phone FROM public."user";

CREATE TABLE legacy_backup.participant_legacy AS
  SELECT id,
         scholarship::text          AS scholarship,
         socio_economic_level::text AS socio_economic_level
  FROM public.participant;

CREATE TABLE legacy_backup.institution AS
  TABLE public.institution;

CREATE TABLE legacy_backup.healthcare_unit AS
  TABLE public.healthcare_unit;

CREATE TABLE legacy_backup.questionnaire_response_legacy AS
  SELECT id, "healthcareUnitId" FROM public.questionnaire_response;

CREATE TABLE legacy_backup.researcher_legacy AS
  SELECT id, email FROM public.researcher;

CREATE TABLE legacy_backup.health_professional_legacy AS
  SELECT id, email FROM public.health_professional;

-- ----------------------------------------------------------------------------
-- 2. user.cpf → user.email
--    Fonte do email: researcher.email / health_professional.email.
--    Participantes e managers (sem email) recebem placeholder <cpf>@ivcf.local.
--    Emails duplicados entre users: o mais antigo mantém, os demais caem
--    para o placeholder.
-- ----------------------------------------------------------------------------
ALTER TABLE public."user" ADD COLUMN "email" TEXT;

UPDATE public."user" u
SET "email" = r."email"
FROM public.researcher r
WHERE r."id" = u."id"
  AND r."email" IS NOT NULL
  AND btrim(r."email") <> '';

UPDATE public."user" u
SET "email" = hp."email"
FROM public.health_professional hp
WHERE hp."id" = u."id"
  AND u."email" IS NULL
  AND hp."email" IS NOT NULL
  AND btrim(hp."email") <> '';

DO $$
DECLARE
  v_placeholder integer;
  v_dedup       integer;
BEGIN
  -- Placeholder para quem não tem email (participantes, managers, órfãos)
  UPDATE public."user"
  SET "email" = cpf || '@ivcf.local'
  WHERE "email" IS NULL OR btrim("email") = '';
  GET DIAGNOSTICS v_placeholder = ROW_COUNT;

  -- Dedup: mantém o email no user mais antigo, demais caem para o placeholder
  WITH ranked AS (
    SELECT id,
           row_number() OVER (PARTITION BY lower("email") ORDER BY "createdAt", id) AS rn
    FROM public."user"
  )
  UPDATE public."user" u
  SET "email" = u.cpf || '@ivcf.local'
  FROM ranked
  WHERE ranked.id = u.id AND ranked.rn > 1;
  GET DIAGNOSTICS v_dedup = ROW_COUNT;

  RAISE NOTICE 'user.email: % usuário(s) receberam placeholder <cpf>@ivcf.local; % duplicata(s) de email resolvidas com placeholder.', v_placeholder, v_dedup;
END $$;

ALTER TABLE public."user" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX "user_email_key" ON public."user"("email");

DROP INDEX IF EXISTS public."user_cpf_key";
ALTER TABLE public."user" DROP COLUMN "cpf";

-- ----------------------------------------------------------------------------
-- 3. user.gender → participant.gender; remove phone/scholarship/socio_economic
-- ----------------------------------------------------------------------------
ALTER TABLE public.participant ADD COLUMN "gender" "Gender";

UPDATE public.participant p
SET "gender" = u."gender"
FROM public."user" u
WHERE u."id" = p."id";

ALTER TABLE public.participant ALTER COLUMN "gender" SET NOT NULL;

ALTER TABLE public.participant
  DROP COLUMN "scholarship",
  DROP COLUMN "socio_economic_level";

ALTER TABLE public."user"
  DROP COLUMN "gender",
  DROP COLUMN "phone";

-- ----------------------------------------------------------------------------
-- 4. Drops estruturais: institution, healthcare_unit, emails filhos,
--    questionnaire_response.healthcareUnitId, enums órfãos
-- ----------------------------------------------------------------------------
ALTER TABLE public.researcher DROP CONSTRAINT IF EXISTS "researcher_institutionId_fkey";
ALTER TABLE public.researcher DROP COLUMN "email";

ALTER TABLE public.health_professional DROP COLUMN "email";

ALTER TABLE public.questionnaire_response DROP CONSTRAINT IF EXISTS "questionnaire_response_healthcareUnitId_fkey";
DROP INDEX IF EXISTS public."questionnaire_response_healthcareUnitId_idx";
ALTER TABLE public.questionnaire_response DROP COLUMN "healthcareUnitId";

DROP TABLE public.healthcare_unit;
DROP TABLE public.institution;

DROP TYPE IF EXISTS "Scholarship";
DROP TYPE IF EXISTS "SocialEconomicLevel";

-- ----------------------------------------------------------------------------
-- 5. Nova tabela N:N health_professional_participant + backfill
--    Backfill: todos os pares distintos presentes nas respostas existentes,
--    com createdAt = data da primeira resposta do par.
-- ----------------------------------------------------------------------------
CREATE TABLE public.health_professional_participant (
    "healthProfessionalId" TEXT NOT NULL,
    "participantId"        TEXT NOT NULL,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_professional_participant_pkey" PRIMARY KEY ("healthProfessionalId","participantId")
);

CREATE INDEX "health_professional_participant_participantId_idx"
  ON public.health_professional_participant("participantId");

ALTER TABLE public.health_professional_participant
  ADD CONSTRAINT "health_professional_participant_healthProfessionalId_fkey"
  FOREIGN KEY ("healthProfessionalId") REFERENCES public.health_professional("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.health_professional_participant
  ADD CONSTRAINT "health_professional_participant_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES public.participant("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO public.health_professional_participant
  ("healthProfessionalId", "participantId", "createdAt")
SELECT "healthProfessionalId", "participantId", MIN("date")
FROM public.questionnaire_response
GROUP BY "healthProfessionalId", "participantId"
ON CONFLICT ("healthProfessionalId", "participantId") DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Fixes de dados (réplica das migrations que o baseline não executará)
-- ----------------------------------------------------------------------------

-- 6a. 20260415120000_fix_ivcf_scores:
-- Corrige pontuações IVCF-20 das opções "Sim" de Cognição (Q7, Q8, Q9) e Humor (Q10)
UPDATE "question_option" qo
SET "score" = 1
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 7
  AND qo."label" = 'Sim';

UPDATE "question_option" qo
SET "score" = 1
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 8
  AND qo."label" = 'Sim';

UPDATE "question_option" qo
SET "score" = 2
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 9
  AND qo."label" = 'Sim';

UPDATE "question_option" qo
SET "score" = 2
FROM "question" q, "question_group" g, "questionnaire" qn
WHERE qo."questionId" = q."id"
  AND q."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 10
  AND qo."label" = 'Sim';

-- 6b. 20260504225205_update_ivcf_vision_hearing_questions:
-- Atualiza o texto das perguntas 18 e 19
UPDATE "question" q
SET "statement" = 'Você tem problemas de visão capazes de impedir a realização de alguma atividade do cotidiano? É permitido o uso de óculos ou lentes de contato.'
FROM "question_subgroup" sg,
     "question_group" g,
     "questionnaire" qn
WHERE q."subGroupId" = sg."id"
  AND sg."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 18;

UPDATE "question" q
SET "statement" = 'Você tem problemas de audição capazes de impedir a realização de alguma atividade do cotidiano? É permitido o uso de aparelhos de audição.'
FROM "question_subgroup" sg,
     "question_group" g,
     "questionnaire" qn
WHERE q."subGroupId" = sg."id"
  AND sg."groupId" = g."id"
  AND g."questionnaireId" = qn."id"
  AND qn."slug" = 'ivcf-20'
  AND q."order" = 19;

-- ----------------------------------------------------------------------------
-- 7. Sanity checks: qualquer falha aqui → rollback de tudo
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_count bigint;
BEGIN
  -- Nenhum user sem email válido
  SELECT count(*) INTO v_count FROM public."user" WHERE "email" IS NULL OR btrim("email") = '';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Sanity check falhou: % usuário(s) sem email.', v_count;
  END IF;

  -- Nenhum email duplicado (case-insensitive)
  SELECT count(*) INTO v_count FROM (
    SELECT lower("email") FROM public."user" GROUP BY lower("email") HAVING count(*) > 1
  ) d;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Sanity check falhou: % email(s) duplicado(s) em user.', v_count;
  END IF;

  -- Contagem de users preservada
  SELECT (SELECT count(*) FROM public."user") - (SELECT count(*) FROM legacy_backup.user_legacy) INTO v_count;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Sanity check falhou: contagem de users mudou (diff=%).', v_count;
  END IF;

  -- Contagem de participants preservada
  SELECT (SELECT count(*) FROM public.participant) - (SELECT count(*) FROM legacy_backup.participant_legacy) INTO v_count;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Sanity check falhou: contagem de participants mudou (diff=%).', v_count;
  END IF;

  -- Contagem de questionnaire_responses preservada
  SELECT (SELECT count(*) FROM public.questionnaire_response) - (SELECT count(*) FROM legacy_backup.questionnaire_response_legacy) INTO v_count;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Sanity check falhou: contagem de questionnaire_responses mudou (diff=%).', v_count;
  END IF;

  -- Nenhum participant sem gender
  SELECT count(*) INTO v_count FROM public.participant WHERE "gender" IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Sanity check falhou: % participant(s) sem gender.', v_count;
  END IF;

  -- Todo participant com resposta tem pelo menos um vínculo N:N
  SELECT count(*) INTO v_count
  FROM (SELECT DISTINCT "participantId" FROM public.questionnaire_response) qr
  WHERE NOT EXISTS (
    SELECT 1 FROM public.health_professional_participant l
    WHERE l."participantId" = qr."participantId"
  );
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Sanity check falhou: % participant(s) com resposta ficaram sem vínculo em health_professional_participant.', v_count;
  END IF;

  RAISE NOTICE 'Sanity checks OK.';
END $$;

COMMIT;

-- Pós-migração:
-- - Participantes/managers logam com <cpf>@ivcf.local até cadastrarem email real.
-- - Quando não precisar mais dos dados antigos: DROP SCHEMA legacy_backup CASCADE;
