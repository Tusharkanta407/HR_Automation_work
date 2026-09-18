import type { PrismaClient } from "../generated/prisma/client";

/**
 * Atomic multi-worker claim.
 * Returns true if this worker won the row (status was QUEUED).
 * Returns false if another worker already claimed it (0 rows updated).
 */
export async function claimExecution(
  prisma: PrismaClient,
  executionId: string,
  workerId: string,
): Promise<boolean> {
  const result = await prisma.$executeRaw`
    UPDATE "Execution"
    SET
      status = 'RUNNING',
      "workerId" = ${workerId},
      "lockedAt" = NOW(),
      "heartbeatAt" = NOW(),
      "startedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE id = ${executionId}
      AND status = 'QUEUED'
  `;
  return result === 1;
}

/** Refresh heartbeat while RUNNING so stale-job recovery can detect dead workers. */
export async function touchExecutionHeartbeat(
  prisma: PrismaClient,
  executionId: string,
  workerId: string,
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Execution"
    SET "heartbeatAt" = NOW(), "updatedAt" = NOW()
    WHERE id = ${executionId}
      AND status = 'RUNNING'
      AND "workerId" = ${workerId}
  `;
}
