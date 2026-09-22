import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(rootDir, ".env") });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return new pg.Pool({ connectionString: url });
}

export function getPool(): pg.Pool {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = createPool();
  }
  return globalForPrisma.pgPool;
}

export function createPrismaClient(pool = getPool()): PrismaClient {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function disconnectDb() {
  await prisma.$disconnect();
  if (globalForPrisma.pgPool) {
    await globalForPrisma.pgPool.end();
    globalForPrisma.pgPool = undefined;
  }
}

export * from "../generated/prisma/client";
export { claimExecution, touchExecutionHeartbeat } from "./claim";
export {
  encryptCredential,
  decryptCredential,
  CREDENTIAL_SELECT_SAFE,
  INTEGRATION_INCLUDE_SAFE,
  toSafeIntegration,
  defaultProviderForType,
} from "./credentials";
export type { SafeCredentialDto, SafeIntegrationDto } from "./credentials";
export type { SideEffectKeyParts } from "./idempotency";
export { buildSideEffectKey } from "./idempotency";
