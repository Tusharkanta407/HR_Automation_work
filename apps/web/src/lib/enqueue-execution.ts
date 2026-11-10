import {
  enqueueWorkflowExecution,
  getRedisUrl,
  type WorkflowExecutionJob,
} from "@hr-automation/queue";

export type { WorkflowExecutionJob };

/**
 * Control-plane helper: push { executionId, workflowId, versionId } to Redis/BullMQ.
 * Neon already has Execution status = QUEUED before this is called.
 */
export async function enqueueExecution(
  job: WorkflowExecutionJob,
): Promise<{ enqueued: boolean; jobId?: string; reason?: string }> {
  if (!getRedisUrl()) {
    return {
      enqueued: false,
      reason:
        "REDIS_URL not configured — start Redis (`docker compose up -d redis`) so the worker can receive jobs",
    };
  }

  try {
    const result = await enqueueWorkflowExecution(job);
    return { enqueued: true, jobId: result.jobId };
  } catch (err: any) {
    console.warn("[enqueueExecution]", err?.message || err);
    return {
      enqueued: false,
      reason: err?.message || "Failed to enqueue to Redis",
    };
  }
}
