-- AlterTable
ALTER TABLE "participant" ADD COLUMN "healthProfessionalId" TEXT;

UPDATE "participant" AS p
SET "healthProfessionalId" = qr."healthProfessionalId"
FROM (
	SELECT DISTINCT ON ("participantId")
		"participantId",
		"healthProfessionalId"
	FROM "questionnaire_response"
	ORDER BY "participantId", "date" ASC, "createdAt" ASC
) AS qr
WHERE p."id" = qr."participantId";

-- CreateIndex
CREATE INDEX "participant_healthProfessionalId_idx" ON "participant"("healthProfessionalId");

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_healthProfessionalId_fkey" FOREIGN KEY ("healthProfessionalId") REFERENCES "health_professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
