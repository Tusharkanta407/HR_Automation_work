# `@hr-automation/db`

Shared Prisma schema + client for `apps/web` and `apps/worker`.

PostgreSQL (Neon) is the **source of truth**. Redis/BullMQ is queue-only — job payload is `{ "executionId": "…" }` and is **not** modeled in Prisma.

## Setup

```bash
# From repo root: ensure .env has DATABASE_URL (Neon)
cd packages/db
npm install
npm run generate
npm run migrate:dev   # creates migration + applies to Neon
```

Env vars (repo root `.env`):

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Neon Postgres (pooled OK for Next; migrations use same URL in V1) |
| `CREDENTIALS_SECRET` | Min 16 chars; AES key material for `IntegrationCredential.encryptedData` |

## Package API

```ts
import {
  prisma,
  claimExecution,
  touchExecutionHeartbeat,
  encryptCredential,
  decryptCredential,
  CREDENTIAL_SELECT_SAFE,
  buildSideEffectKey,
} from "@hr-automation/db";
```

Prisma Client requires a driver adapter at runtime (`@prisma/adapter-pg` + `pg`). Use the exported `prisma` singleton or `createPrismaClient()`.

---

## Credential encryption (never decrypt to browser)

1. UI posts credential plaintext → **API route only**
2. Server calls `encryptCredential(plaintext)` → store in `encryptedData`
3. Client-facing reads use `CREDENTIAL_SELECT_SAFE` (no `encryptedData` field)
4. Worker loads credential → `decryptCredential` → call company API / SMTP
5. **Never** put decrypted secrets in JSON responses, logs, or React state

---

## State transitions (enforce in services)

| Entity | Allowed |
|--------|---------|
| Workflow | `DRAFT` → `ACTIVE` → `ARCHIVED` (prefer archive over hard-delete) |
| Version | `DRAFT` → `PUBLISHED` → `ARCHIVED`; do not mutate published nodes in place |
| Execution | `QUEUED` → `RUNNING` → `SUCCESS` \| `FAILED`; `CANCELLED` from `QUEUED` \| `RUNNING` |
| NodeExecution | `PENDING` → `RUNNING` → `SUCCESS` \| `FAILED` \| `SKIPPED` |

Prefer setting `Workflow.status = ARCHIVED` over deleting workflows that have executions (`Execution` FKs use `Restrict` on workflow/version).

---

## Multi-worker claim

`Execution.workerId` is a plain string (e.g. `worker-02`), **not** an FK to `Worker`, so claim works even if the optional heartbeat row does not exist yet.

```ts
const won = await claimExecution(prisma, executionId, process.env.WORKER_ID!);
if (!won) return; // another worker owns it
```

SQL conceptually:

```sql
UPDATE "Execution"
SET status = 'RUNNING', "workerId" = $worker, "lockedAt" = NOW(), "heartbeatAt" = NOW(), "startedAt" = NOW()
WHERE id = $id AND status = 'QUEUED'
```

1 row → claim succeeded. 0 rows → skip.

While running, call `touchExecutionHeartbeat` periodically. **Stale recovery (Phase 7):** find `RUNNING` rows whose `heartbeatAt` is older than a threshold → re-queue (`QUEUED`, clear worker fields, bump `attempt`) or mark `FAILED`.

---

## Retry

- `Execution.attempt` / `NodeExecution.attempt`
- Optional `maxAttempts` / `backoff` inside node or workflow `config` JSON
- Transient failures → new attempt (new `NodeExecution` row with bumped `attempt`, unique on `(executionId, nodeId, attempt)`) or re-queue the Execution

---

## Idempotency (lean V1)

1. **NodeExecution** `@@unique([executionId, nodeId, attempt])` — no duplicate step rows per attempt
2. **Side effects:** `buildSideEffectKey({ executionId, nodeId, logicalItemId })` — engine skips if that action already succeeded (full `IdempotencyKey` table deferred)
3. **Duplicate Run Now:** client sends `Idempotency-Key` header → store on `Execution.idempotencyKey` (`@unique`); same key returns the same execution. Multiple legitimate runs = different/missing keys

---

## Queue

Do not store BullMQ state in Postgres. After inserting `Execution` with `status = QUEUED`, enqueue:

```json
{ "executionId": "<id>" }
```

---

## Models (V1 freeze)

Auth: `User`, `Account`, `Session`, `VerificationToken`  
Product: `Workflow` (+ `currentVersionId`), `WorkflowVersion`, `WorkflowNode`, `WorkflowEdge`, `WorkflowTrigger`  
Integrations: `Integration`, `IntegrationCredential`  
Execution: `Execution` (`input`, `output`, claim fields, `idempotencyKey`), `NodeExecution`  
Infra: `Worker` (heartbeat only)

Not in V1: Organization, BullMQ tables, mock HR tables, `WebhookEndpoint`, full `IdempotencyKey` table.
