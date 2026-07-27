-- CreateTable
CREATE TABLE "health_professional_participant" (
    "healthProfessionalId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_professional_participant_pkey" PRIMARY KEY ("healthProfessionalId","participantId")
);

-- CreateIndex
CREATE INDEX "health_professional_participant_participantId_idx" ON "health_professional_participant"("participantId");

-- AddForeignKey
ALTER TABLE "health_professional_participant" ADD CONSTRAINT "health_professional_participant_healthProfessionalId_fkey" FOREIGN KEY ("healthProfessionalId") REFERENCES "health_professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_professional_participant" ADD CONSTRAINT "health_professional_participant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing participant-professional links before removing the old column.
INSERT INTO "health_professional_participant" (
  "healthProfessionalId",
  "participantId"
)
SELECT
  "healthProfessionalId",
  "id"
FROM "participant"
WHERE "healthProfessionalId" IS NOT NULL
ON CONFLICT ("healthProfessionalId", "participantId") DO NOTHING;

/*
  Warnings:

  - You are about to drop the column `healthProfessionalId` on the `participant` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "participant" DROP CONSTRAINT "participant_healthProfessionalId_fkey";

-- DropIndex
DROP INDEX "participant_healthProfessionalId_idx";

-- AlterTable
ALTER TABLE "participant" DROP COLUMN "healthProfessionalId";
