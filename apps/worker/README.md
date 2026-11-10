# apps/worker

Background consumer for workflow runs. **Next.js never executes nodes** — it only inserts `Execution (QUEUED)` and pushes a job to Redis.

## Layout

```text
src/
  index.ts                         # boot + Redis + shutdown
  process-job.ts                   # claim QUEUED→RUNNING + heartbeat + call engine
  consumers/
    index.ts                       # startAllConsumers()
    workflow-executions.ts         # BullMQ listener for "workflow-executions"
```

Node / Gmail / Sheets logic is **not** in this app — it lives in `packages/workflow-engine` (+ `packages/google-workspace`).

## Flow

```text
POST /api/workflows/:id/run
        │
        ▼
 Neon: Execution status = QUEUED
        │
        ▼
 Redis / BullMQ "workflow-executions"
   job = { executionId, workflowId, versionId }
        │
        ▼
 consumers/workflow-executions.ts
        │
        ▼
 process-job.ts  (atomic claim + heartbeat)
        │
        ▼
 packages/workflow-engine  → NodeExecution + SUCCESS/FAILED
```

## Local setup

```bash
docker compose up -d redis
npm run dev:worker
```

Needs `REDIS_URL`, `DATABASE_URL`, and `CREDENTIALS_SECRET` (or `NEXTAUTH_SECRET`) in the repo root `.env`.
