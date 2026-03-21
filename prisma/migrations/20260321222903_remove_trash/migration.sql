/*
  Warnings:

  - You are about to drop the column `scholarship` on the `participant` table. All the data in the column will be lost.
  - You are about to drop the column `socio_economic_level` on the `participant` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `healthcare_unit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `institution` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gender` to the `participant` table without a default value. This is not possible if the table is not empty.
  - Made the column `healthProfessionalId` on table `participant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "researcher" DROP CONSTRAINT "researcher_institutionId_fkey";

-- AlterTable
ALTER TABLE "participant" DROP COLUMN "scholarship",
DROP COLUMN "socio_economic_level",
ADD COLUMN     "gender" "Gender" NOT NULL,
ALTER COLUMN "healthProfessionalId" SET NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "gender",
DROP COLUMN "phone";

-- DropTable
DROP TABLE "healthcare_unit";

-- DropTable
DROP TABLE "institution";

-- DropEnum
DROP TYPE "Scholarship";

-- DropEnum
DROP TYPE "SocialEconomicLevel";
