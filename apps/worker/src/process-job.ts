import {
  prisma,
  claimExecution,
  touchExecutionHeartbeat,
} from "@hr-automation/db";
import { runExecution } from "@hr-automation/workflow-engine";
import type { WorkflowExecutionJob } from "@hr-automation/queue";

/**
 * Architecture step:
 * 1. Job arrives from Redis/BullMQ with { executionId, workflowId, versionId }
 * 2. Atomic claim QUEUED → RUNNING in Neon (multi-worker safe)
 * 3. Engine loads graph + decrypts integrations + executes nodes
 */
export async function processWorkflowJob(
  job: WorkflowExecutionJob,
  workerId: string,
): Promise<{ status: "SUCCESS" | "FAILED" | "SKIPPED"; summary?: Record<string, unknown> }> {
  const { executionId, workflowId, versionId } = job;
  if (!executionId) {
    throw new Error("Job missing executionId");
  }

  const existing = await prisma.execution.findUnique({
    where: { id: executionId },
    select: { id: true, status: true, workflowId: true, workflowVersionId: true },
  });
  if (!existing) {
    throw new Error(`Execution ${executionId} not found in Neon`);
  }
  if (existing.status !== "QUEUED" && existing.status !== "RUNNING") {
    console.log(
      `[worker] skip ${executionId} — already ${existing.status}`,
    );
    return { status: "SKIPPED" };
  }

  // Soft sanity check against payload (DB remains source of truth)
  if (workflowId && existing.workflowId !== workflowId) {
    console.warn(
      `[worker] job workflowId mismatch db=${existing.workflowId} job=${workflowId}`,
    );
  }
  if (versionId && existing.workflowVersionId !== versionId) {
    console.warn(
      `[worker] job versionId mismatch db=${existing.workflowVersionId} job=${versionId}`,
    );
  }

  const won = await claimExecution(prisma, executionId, workerId);
  if (!won) {
    console.log(`[worker] skip ${executionId} (claim lost — another worker)`);
    return { status: "SKIPPED" };
  }

  console.log(`[worker] claimed ${executionId} → RUNNING`);

  const heartbeat = setInterval(() => {
    touchExecutionHeartbeat(prisma, executionId, workerId).catch((err) => {
      console.warn(`[worker] heartbeat failed ${executionId}`, err?.message || err);
    });
  }, 10_000);

  try {
    const result = await runExecution(executionId, workerId, prisma);
    console.log(`[worker] finished ${executionId} → ${result.status}`, result.summary);
    return result;
  } finally {
    clearInterval(heartbeat);
  }
}
