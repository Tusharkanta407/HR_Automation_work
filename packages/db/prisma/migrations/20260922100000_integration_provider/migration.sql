-- AlterTable
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'CUSTOM_REST';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Integration_userId_type_idx" ON "Integration"("userId", "type");
