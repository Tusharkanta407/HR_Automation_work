-- AlterEnum IntegrationType: add OAUTH
ALTER TYPE "IntegrationType" ADD VALUE IF NOT EXISTS 'OAUTH';

-- AlterEnum CredentialType: add OAUTH2
ALTER TYPE "CredentialType" ADD VALUE IF NOT EXISTS 'OAUTH2';

-- AlterTable Integration
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "accountIdentifier" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

-- AlterTable IntegrationCredential
ALTER TABLE "IntegrationCredential" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "IntegrationCredential" ADD COLUMN IF NOT EXISTS "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Integration_userId_provider_idx" ON "Integration"("userId", "provider");
