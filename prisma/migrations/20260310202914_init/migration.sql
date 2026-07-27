-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'MULTIPLE_CHOICE', 'SCALE');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('MANAGER', 'PARTICIPANT', 'RESEARCHER', 'HEALTH_PROFESSIONAL');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Scholarship" AS ENUM ('NONE', 'FUNDAMENTAL_INCOMPLETE', 'FUNDAMENTAL_COMPLETE', 'HIGH_SCHOOL_INCOMPLETE', 'HIGH_SCHOOL_COMPLETE', 'HIGHER_EDUCATION_INCOMPLETE', 'HIGHER_EDUCATION_COMPLETE', 'POSTGRADUATE', 'MASTERS', 'DOCTORATE');

-- CreateEnum
CREATE TYPE "SocialEconomicLevel" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fullName_normalized" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gender" "Gender" NOT NULL,
    "role" "SystemRole" NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "researcher" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "researcher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_normalized" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_professional" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "speciality" TEXT NOT NULL,
    "speciality_normalized" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT NOT NULL DEFAULT '',
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "healthcare_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant" (
    "id" TEXT NOT NULL,
    "birthday" DATE NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "socio_economic_level" "SocialEconomicLevel" NOT NULL,
    "scholarship" "Scholarship" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_group" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "questionnaireId" TEXT NOT NULL,

    CONSTRAINT "question_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_subgroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "question_subgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "groupId" TEXT,
    "subGroupId" TEXT,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_option" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "question_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_response" (
    "id" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "classification" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participantId" TEXT NOT NULL,
    "healthProfessionalId" TEXT NOT NULL,
    "healthcareUnitId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer" (
    "id" TEXT NOT NULL,
    "questionnaireResponseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "valueText" TEXT,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_fullName_normalized_idx" ON "user"("fullName_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "researcher_id_key" ON "researcher"("id");

-- CreateIndex
CREATE INDEX "researcher_institutionId_idx" ON "researcher"("institutionId");

-- CreateIndex
CREATE INDEX "institution_title_normalized_idx" ON "institution"("title_normalized");

-- CreateIndex
CREATE INDEX "institution_active_idx" ON "institution"("active");

-- CreateIndex
CREATE UNIQUE INDEX "health_professional_id_key" ON "health_professional"("id");

-- CreateIndex
CREATE INDEX "health_professional_speciality_idx" ON "health_professional"("speciality");

-- CreateIndex
CREATE INDEX "health_professional_speciality_normalized_idx" ON "health_professional"("speciality_normalized");

-- CreateIndex
CREATE INDEX "health_professional_active_idx" ON "health_professional"("active");

-- CreateIndex
CREATE INDEX "healthcare_unit_name_normalized_idx" ON "healthcare_unit"("name_normalized");

-- CreateIndex
CREATE INDEX "healthcare_unit_active_idx" ON "healthcare_unit"("active");

-- CreateIndex
CREATE UNIQUE INDEX "participant_id_key" ON "participant"("id");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_slug_key" ON "questionnaire"("slug");

-- CreateIndex
CREATE INDEX "question_group_questionnaireId_idx" ON "question_group"("questionnaireId");

-- CreateIndex
CREATE INDEX "question_subgroup_groupId_idx" ON "question_subgroup"("groupId");

-- CreateIndex
CREATE INDEX "question_option_questionId_idx" ON "question_option"("questionId");

-- CreateIndex
CREATE INDEX "questionnaire_response_participantId_idx" ON "questionnaire_response"("participantId");

-- CreateIndex
CREATE INDEX "questionnaire_response_healthProfessionalId_idx" ON "questionnaire_response"("healthProfessionalId");

-- CreateIndex
CREATE INDEX "questionnaire_response_healthcareUnitId_idx" ON "questionnaire_response"("healthcareUnitId");

-- CreateIndex
CREATE INDEX "answer_questionnaireResponseId_idx" ON "answer"("questionnaireResponseId");

-- AddForeignKey
ALTER TABLE "researcher" ADD CONSTRAINT "researcher_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "researcher" ADD CONSTRAINT "researcher_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_professional" ADD CONSTRAINT "health_professional_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_group" ADD CONSTRAINT "question_group_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_subgroup" ADD CONSTRAINT "question_subgroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "question_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "question_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_subGroupId_fkey" FOREIGN KEY ("subGroupId") REFERENCES "question_subgroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_option" ADD CONSTRAINT "question_option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_response" ADD CONSTRAINT "questionnaire_response_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_response" ADD CONSTRAINT "questionnaire_response_healthProfessionalId_fkey" FOREIGN KEY ("healthProfessionalId") REFERENCES "health_professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_response" ADD CONSTRAINT "questionnaire_response_healthcareUnitId_fkey" FOREIGN KEY ("healthcareUnitId") REFERENCES "healthcare_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_response" ADD CONSTRAINT "questionnaire_response_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionnaireResponseId_fkey" FOREIGN KEY ("questionnaireResponseId") REFERENCES "questionnaire_response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "question_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;
