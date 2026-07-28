-- Históricos independentes por profissional + fluxo de compartilhamento e notificações.
-- Inclui backfill: cada vínculo antigo vira uma HistoricoBase e as respostas são religadas.
-- Ordem importa: tabelas novas → rename → backfill → NOT NULL → drop do vínculo antigo.

-- CreateEnum
CREATE TYPE "HistoricoOrigin" AS ENUM ('FROM_SCRATCH', 'COPIED');

-- CreateEnum
CREATE TYPE "ShareRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SHARE_REQUEST_RECEIVED', 'SHARE_REQUEST_APPROVED', 'SHARE_REQUEST_REJECTED', 'SYSTEM');

-- CreateTable
CREATE TABLE "historico_base" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "ownerProfessionalId" TEXT NOT NULL,
    "origin" "HistoricoOrigin" NOT NULL DEFAULT 'FROM_SCRATCH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_request" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "requesterProfessionalId" TEXT NOT NULL,
    "ownerProfessionalId" TEXT NOT NULL,
    "sourceHistoricoBaseId" TEXT NOT NULL,
    "targetHistoricoBaseId" TEXT,
    "status" "ShareRequestStatus" NOT NULL DEFAULT 'PENDING',
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "share_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "shareRequestId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "historico_base_participantId_ownerProfessionalId_key" ON "historico_base"("participantId", "ownerProfessionalId");

-- CreateIndex
CREATE INDEX "historico_base_ownerProfessionalId_idx" ON "historico_base"("ownerProfessionalId");

-- CreateIndex
CREATE INDEX "share_request_ownerProfessionalId_status_idx" ON "share_request"("ownerProfessionalId", "status");

-- CreateIndex
CREATE INDEX "share_request_requesterProfessionalId_status_idx" ON "share_request"("requesterProfessionalId", "status");

-- CreateIndex
CREATE INDEX "share_request_participantId_idx" ON "share_request"("participantId");

-- CreateIndex
CREATE INDEX "notification_recipientUserId_readAt_idx" ON "notification"("recipientUserId", "readAt");

-- CreateIndex
CREATE INDEX "notification_recipientUserId_createdAt_idx" ON "notification"("recipientUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "historico_base" ADD CONSTRAINT "historico_base_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_base" ADD CONSTRAINT "historico_base_ownerProfessionalId_fkey" FOREIGN KEY ("ownerProfessionalId") REFERENCES "health_professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_request" ADD CONSTRAINT "share_request_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_request" ADD CONSTRAINT "share_request_requesterProfessionalId_fkey" FOREIGN KEY ("requesterProfessionalId") REFERENCES "health_professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_request" ADD CONSTRAINT "share_request_ownerProfessionalId_fkey" FOREIGN KEY ("ownerProfessionalId") REFERENCES "health_professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_request" ADD CONSTRAINT "share_request_sourceHistoricoBaseId_fkey" FOREIGN KEY ("sourceHistoricoBaseId") REFERENCES "historico_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_request" ADD CONSTRAINT "share_request_targetHistoricoBaseId_fkey" FOREIGN KEY ("targetHistoricoBaseId") REFERENCES "historico_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_shareRequestId_fkey" FOREIGN KEY ("shareRequestId") REFERENCES "share_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: preserva os dados — RENAME em vez do DROP+ADD que o Prisma geraria.
ALTER TABLE "questionnaire_response" RENAME COLUMN "healthProfessionalId" TO "appliedByProfessionalId";
ALTER TABLE "questionnaire_response" RENAME CONSTRAINT "questionnaire_response_healthProfessionalId_fkey" TO "questionnaire_response_appliedByProfessionalId_fkey";
ALTER INDEX "questionnaire_response_healthProfessionalId_idx" RENAME TO "questionnaire_response_appliedByProfessionalId_idx";

-- AlterTable: novas colunas entram anuláveis; NOT NULL só após o backfill.
ALTER TABLE "questionnaire_response" ADD COLUMN "historicoBaseId" TEXT;
ALTER TABLE "questionnaire_response" ADD COLUMN "sourceResponseId" TEXT;

-- Backfill 1: cada vínculo existente vira uma base FROM_SCRATCH.
INSERT INTO "historico_base" ("id", "participantId", "ownerProfessionalId", "origin")
SELECT gen_random_uuid(), hpp."participantId", hpp."healthProfessionalId", 'FROM_SCRATCH'
FROM "health_professional_participant" AS hpp
ON CONFLICT ("participantId", "ownerProfessionalId") DO NOTHING;

-- Backfill 2: respostas cujo par (participante, profissional aplicador) não tem vínculo
-- ganham base mesmo assim — senão o NOT NULL abaixo falharia.
INSERT INTO "historico_base" ("id", "participantId", "ownerProfessionalId", "origin")
SELECT gen_random_uuid(), pares."participantId", pares."appliedByProfessionalId", 'FROM_SCRATCH'
FROM (
    SELECT DISTINCT "participantId", "appliedByProfessionalId"
    FROM "questionnaire_response"
) AS pares
ON CONFLICT ("participantId", "ownerProfessionalId") DO NOTHING;

-- Backfill 3: religa cada resposta à base do seu par.
UPDATE "questionnaire_response" AS qr
SET "historicoBaseId" = hb."id"
FROM "historico_base" AS hb
WHERE hb."participantId" = qr."participantId"
  AND hb."ownerProfessionalId" = qr."appliedByProfessionalId";

-- Agora sim: obrigatória.
ALTER TABLE "questionnaire_response" ALTER COLUMN "historicoBaseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "questionnaire_response" ADD CONSTRAINT "questionnaire_response_historicoBaseId_fkey" FOREIGN KEY ("historicoBaseId") REFERENCES "historico_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_response" ADD CONSTRAINT "questionnaire_response_sourceResponseId_fkey" FOREIGN KEY ("sourceResponseId") REFERENCES "questionnaire_response"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "questionnaire_response_historicoBaseId_idx" ON "questionnaire_response"("historicoBaseId");

-- CreateIndex
CREATE INDEX "questionnaire_response_sourceResponseId_idx" ON "questionnaire_response"("sourceResponseId");

-- CreateIndex: o índice de classification entrou no schema na sprint-1 sem migration (drift) — regulariza aqui.
CREATE INDEX IF NOT EXISTS "questionnaire_response_classification_idx" ON "questionnaire_response"("classification");

-- DropTable: a HistoricoBase é a nova fonte de verdade do vínculo.
DROP TABLE "health_professional_participant";
