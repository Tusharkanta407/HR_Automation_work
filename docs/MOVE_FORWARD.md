# HR Automation Platform — Move Forward Plan

## POV (short)

This is the right architecture for the assignment.

You are not building “HR software.” You are building an **automation control plane**:

- **Next.js** = create workflows + trigger runs + show status
- **Redis/BullMQ** = job queue (local Docker)
- **Node worker** = execute workflows in the background
- **.NET API** = fake HR system (data + notifications)
- **Neon PostgreSQL** = source of truth for workflows + execution state
- **NextAuth + Google** = login

Ignore cron/scheduler until Manual Run works end-to-end. One happy-path workflow is enough to prove the system.

---



## Architecture (locked)

```text
                 ┌─────────────────┐
                 │    Next.js      │
                 │   localhost:3000│
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Neon DB       │
                 │  PostgreSQL     │
                 └─────────────────┘

                 ┌─────────────────┐
                 │     Redis       │
                 │ localhost:6379  │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Node.js Worker  │
                 │ workflow-engine │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   .NET API      │
                 │ localhost:5000  │
                 └─────────────────┘
```

**What changed vs earlier drafts**


| Before                           | After                                               |
| -------------------------------- | --------------------------------------------------- |
| Local Postgres in docker-compose | **Neon** hosted PostgreSQL                          |
| Supabase (DB + Auth client)      | **Neon** for DB only; **NextAuth** for Google login |
| docker-compose: postgres + redis | docker-compose: **redis only**                      |
| Blind client `UPDATE` for claim  | **Atomic SQL** `UPDATE … WHERE status = 'QUEUED'`   |


---



## Target demo (Phase 1)

**Story:** Low Attendance Alert

```text
[Manual Trigger]
      ↓
[Get Monthly Attendance]   → .NET
      ↓
[Filter < 75%]             → worker (local)
      ↓
[Get Employee Details]     → .NET
      ↓
[Send Email]               → .NET (mock ok)
      ↓
[Confirmation]
```

**Success looks like:**

1. HR logs in (Google via NextAuth)
2. Creates/saves this workflow
3. Clicks **Run Now**
4. UI shows Queued → Running → Success
5. Execution log shows each node + final counts

---



## Repo shape

```text
hr-automation/
├── apps/
│   ├── web/                 # Next.js (Vercel later)
│   └── worker/              # Node + BullMQ consumer (Railway later)
├── packages/
│   └── workflow-engine/     # shared node execution logic
├── hr-api/                  # .NET 8 Web API (Visual Studio / Railway)
├── docker-compose.yml       # Redis only
├── .env.example             # Neon DATABASE_URL + Redis + NextAuth
└── docs/
```

Open whole repo in VS Code/Cursor. Open `hr-api/` in Visual Studio for .NET.

---



## Neon data model

```text
workflows
  id, name, created_at, ...

workflow_nodes
  id, workflow_id, type, config, ...

workflow_edges
  id, workflow_id, source, target, ...

executions
  id, workflow_id, status, worker_id, created_at, started_at, finished_at, ...

execution_logs
  id, execution_id, node_id, status, input, output, error, created_at, ...
```

`executions.status`: `QUEUED` → `RUNNING` → `SUCCESS` | `FAILED`

### Atomic claim (required for multi-worker)

Assignment care: **two workers must not execute the same job simultaneously.**

Do **not** blindly do a read-then-update (or a soft update with no status guard). Use one atomic statement so only one worker wins:

```sql
UPDATE executions
SET status = 'RUNNING',
    started_at = now(),
    worker_id = $2
WHERE id = $1
  AND status = 'QUEUED'
RETURNING *;
```

Optional helper function in Neon SQL Editor:

```sql
CREATE OR REPLACE FUNCTION claim_execution(p_execution_id uuid, p_worker_id text)
RETURNS SETOF executions
LANGUAGE sql
AS $$
  UPDATE executions
  SET
    status = 'RUNNING',
    started_at = now(),
    worker_id = p_worker_id
  WHERE id = p_execution_id
    AND status = 'QUEUED'
  RETURNING *;
$$;
```

Worker (Node + `pg` example):

```ts
const result = await pool.query(
  `SELECT * FROM claim_execution($1, $2)`,
  [executionId, process.env.WORKER_ID]
);
// result.rowCount === 0 → another worker already claimed it; skip.
```

```text
Worker 1 ──────┐
               ↓
           Neon DB
               ↑
Worker 2 ──────┘

Only ONE transition wins: QUEUED → RUNNING
```

That concurrency demo is a strong assignment talking point.

---



## Clients

**Next.js + worker:** `pg`, Prisma, or Drizzle against `DATABASE_URL` (Neon).  
No Supabase client. Auth is **NextAuth + Google**, not Supabase Auth.

Tip: Neon’s **pooled** connection string is often better for Next.js; the long-running worker can use pooled or direct.

---



## Build order



### Week 0 — Foundation

- [x] Monorepo folders (`apps/web`, `apps/worker`, `packages/workflow-engine`, `hr-api`)
- [x] Create Neon project; copy `DATABASE_URL` into `.env`
- [x] `docker-compose.yml` with **Redis only**
- [x] Shared env template filled (`.env.example` → `.env`)
- [ ] Health checks: web, worker, hr-api, Neon, redis

**Exit criteria:** Redis up locally; web/worker can reach Neon; .NET API responds.

---



### Phase 1A — Schema + Manual Run skeleton

**Neon SQL:** tables above + `claim_execution` function.

**API (Next.js):**

- create/list workflows
- save nodes/edges
- `POST /api/workflows/:id/run`
  - insert execution (`QUEUED`) in Neon
  - enqueue BullMQ job `{ executionId }`
  - return `{ executionId, status: "QUEUED" }`

**Worker:**

- consume job
- call atomic `claim_execution` (SQL function or `UPDATE … RETURNING`)
- load workflow graph from Neon
- write simple logs
- mark `SUCCESS` / `FAILED`

**Exit criteria:** Run Now creates an execution; worker marks SUCCESS with noop nodes.

---



### Phase 1B — .NET mock HR API

- `GET /api/attendance/monthly`
- `GET /api/employees/{id}`
- `POST /api/notifications/email` (store/log, no real SMTP)

Seed mock employees + attendance.

**Exit criteria:** worker calls .NET over HTTP and stores responses in execution context.

---



### Phase 1C — Real workflow engine (one story)


| Node                     | Where it runs | Notes                |
| ------------------------ | ------------- | -------------------- |
| `MANUAL_TRIGGER`         | worker        | no-op / pass context |
| `GET_MONTHLY_ATTENDANCE` | worker → .NET | fetch list           |
| `FILTER`                 | worker only   | e.g. attendance < 75 |
| `GET_EMPLOYEE_DETAILS`   | worker → .NET | enrich filtered ids  |
| `SEND_EMAIL`             | worker → .NET | mock send            |
| `CONFIRMATION`           | worker        | write summary        |


**Exit criteria:** full Low Attendance flow with live status + logs in UI.

---



### Phase 1D — Dashboard UX

- Google login (NextAuth)
- Workflow list
- Seeded workflow first; builder second
- Execution detail page (status + per-node logs)

---



### Phase 2 — Failure + retry

- [ ] .NET timeout / 500 simulation
- [ ] Mark node/execution FAILED
- [ ] Retry policy + safe re-queue
- [ ] Idempotency: same `executionId` never double-completes

---



### Phase 3 — Multiple workers

- [ ] Run 2+ workers against same Redis + Neon
- [ ] Prove only one claim via atomic `UPDATE … WHERE status = 'QUEUED'`
- [ ] Show concurrent executions across workers

---



### Phase 4 — Scheduler (last)

- [ ] Cron / schedule on workflow
- [ ] Scheduler creates executions when due
- [ ] Same queue → same worker path

Worker does not change. Only execution creation changes.

---



## Deployment map (later)


| Piece       | Host              |
| ----------- | ----------------- |
| Next.js     | Vercel            |
| Node worker | Railway           |
| .NET HR API | Railway           |
| PostgreSQL  | **Neon**          |
| Redis       | Railway / managed |


---



## What to build now

1. Neon project + schema + `claim_execution` SQL
2. Wire `pg` / Prisma / Drizzle in web + worker
3. Implement `Run Now` enqueue path
4. Worker claim + SUCCESS with noop nodes
5. .NET attendance/employee/email mocks
6. Wire Low Attendance nodes
7. Execution status UI
8. Then: retries, multi-worker demo, scheduler, fancy builder

---



## Scope guardrails

**Do now**

- One workflow story
- Manual trigger
- Neon as state of truth
- Atomic claim SQL
- Worker/queue separation
- .NET as external HR system

**Do later**

- Cron/scheduler
- Complex visual builder
- Real email provider
- Many HR workflows

**Avoid**

- Long-running worker on Vercel
- Mixing .NET into Next.js
- Local Docker Postgres (use Neon)
- Blind update claim without `AND status = 'QUEUED'`
- Starting with scheduler instead of Run Now
- Supabase (not in this plan)

---



## Definition of done (first milestone)

> Login → open Low Attendance workflow → Run Now → Queued/Running/Success → logs show N below 75% / email mock sent.

---



## Decision log (locked)

- Manual Run before scheduler
- Worker = Node/TS, not .NET
- .NET = mock HR APIs only
- **Neon PostgreSQL** = state of truth
- Redis/BullMQ = work distribution
- Atomic `claim_execution` SQL for concurrency
- NextAuth + Google for login
- Vercel = control plane, Railway = worker + .NET (when deploying)

