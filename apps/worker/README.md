# apps/worker

Node.js + TypeScript background worker.

## Responsibilities

- Consume BullMQ jobs from Redis (`localhost:6379`)
- Claim executions in **Neon PostgreSQL** with an atomic `UPDATE … WHERE status = 'QUEUED'` (or `claim_execution` SQL function)
- Load workflow graph from Neon and run `workflow-engine`
- Call .NET HR API for domain steps
- Write `execution_logs`; mark `SUCCESS` / `FAILED`
- Support retries and multi-worker safe claims

## Data access

Use `pg` (already in dependencies) or Prisma/Drizzle against `DATABASE_URL`:

```ts
const result = await pool.query(
  `SELECT * FROM claim_execution($1, $2)`,
  [executionId, process.env.WORKER_ID]
);
// no rows returned → another worker already claimed; skip
```

Do not use a naive read-then-update for claims — two workers must not execute the same job.

## Status

Package scaffold started (`bullmq`, `ioredis`, `pg`, etc.). Wire Neon claim SQL in Phase 1A.
