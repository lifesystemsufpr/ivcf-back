/*
  Warnings:

  - You are about to drop the column `healthcareUnitId` on the `questionnaire_response` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "questionnaire_response" DROP CONSTRAINT "questionnaire_response_healthcareUnitId_fkey";

-- DropIndex
DROP INDEX "questionnaire_response_healthcareUnitId_idx";

-- AlterTable
ALTER TABLE "questionnaire_response" DROP COLUMN "healthcareUnitId";
