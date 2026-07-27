ALTER TABLE "user"
  ADD COLUMN "passwordResetToken" TEXT,
  ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
  ADD COLUMN "passwordResetUsedAt" TIMESTAMP(3);