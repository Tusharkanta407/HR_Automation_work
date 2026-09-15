# HR Automation Platform — Move Forward Plan

## POV (short)

This is the right architecture for the assignment.

You are not building “HR software.” You are building an **automation control plane**:

- **Next.js** = create workflows + trigger runs + show status
- **Redis/BullMQ** = job queue
- **Node worker** = execute workflows in the background
- **.NET API** = fake HR system (data + notifications)
- **PostgreSQL** = source of truth for workflows + execution state

The strongest part of your docs is the decision to **ignore cron/scheduler until Manual Run works end-to-end**. That is the correct build order.

Do not overbuild early. One happy-path workflow is enough to prove the whole system.

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

1. HR logs in (Google)
2. Creates/saves this workflow
3. Clicks **Run Now**
4. UI shows Queued → Running → Success
5. Execution log shows each node + final counts

If that works, the hard architecture is done.

---

## Repo shape (start here)

```text
hr-automation/
├── apps/
│   ├── web/                 # Next.js (Vercel later)
│   └── worker/              # Node + BullMQ consumer (Railway later)
├── packages/
│   └── workflow-engine/     # shared node execution logic
├── hr-api/                  # .NET 8 Web API (Visual Studio / Railway)
├── docker-compose.yml       # Postgres + Redis locally
├── README.md
└── ENGINEERING.md
```

Open whole repo in VS Code. Open `hr-api/` in Visual Studio when working on .NET.

---

## Build order (do this sequence)

### Week 0 — Local foundation (1–2 days)

- [ ] Monorepo scaffold (`apps/web`, `apps/worker`, `packages/workflow-engine`, `hr-api`)
- [ ] `docker-compose.yml` with PostgreSQL + Redis
- [ ] Shared env template (`.env.example`)
- [ ] Health checks: web, worker, hr-api, db, redis

**Exit criteria:** all services start locally with one command set.

---

### Phase 1A — Data model + Manual Run skeleton (core)

**DB tables (minimum):**

- `users`
- `automations`
- `automation_nodes`
- `automation_edges`
- `executions`
- `execution_logs`

**API (Next.js):**

- create/list automation
- save nodes/edges
- `POST /api/automations/:id/run`
  - insert execution (`QUEUED`)
  - enqueue BullMQ job `{ executionId }`
  - return `{ executionId, status: "QUEUED" }`

**Worker:**

- consume job
- claim execution (`QUEUED → RUNNING`) with DB guard against duplicates
- load workflow graph
- write simple logs
- mark `SUCCESS` / `FAILED`

**Exit criteria:** Run Now creates an execution and worker marks it SUCCESS with fake “noop” nodes.

---

### Phase 1B — .NET mock HR API

Implement only what Phase 1 needs:

- `GET /api/attendance/monthly`
- `GET /api/employees/{id}`
- `POST /api/notifications/email` (store/log, no real SMTP required)

Seed mock employees + attendance.

**Exit criteria:** worker can call .NET over HTTP and store responses in execution context.

---

### Phase 1C — Real workflow engine (one story)

Implement node executors:

| Node | Where it runs | Notes |
|------|---------------|-------|
| `MANUAL_TRIGGER` | worker | no-op / pass context |
| `GET_MONTHLY_ATTENDANCE` | worker → .NET | fetch list |
| `FILTER` | worker only | e.g. attendance < 75 |
| `GET_EMPLOYEE_DETAILS` | worker → .NET | enrich filtered ids |
| `SEND_EMAIL` | worker → .NET | mock send |
| `CONFIRMATION` | worker | write summary |

**Exit criteria:** full Low Attendance flow works with live status + logs in UI.

---

### Phase 1D — Dashboard UX (thin but demoable)

- Google login
- Automation list
- Simple workflow builder (or even a seeded workflow first, builder second)
- Execution detail page (status + per-node logs)

**Practical tip:** ship a **seeded automation** before a fancy drag-drop builder. Builder can be Phase 1.5.

---

### Phase 2 — Failure + retry

- [ ] .NET timeout / 500 simulation endpoint or toggle
- [ ] Mark node/execution FAILED
- [ ] Retry policy (e.g. 3 attempts, backoff)
- [ ] Re-queue failed jobs safely
- [ ] Idempotency: same `executionId` never double-completes

**Exit criteria:** forced failure recovers or fails cleanly with visible logs.

---

### Phase 3 — Multiple workers

- [ ] Run 2+ worker processes against same Redis + DB
- [ ] Prove duplicate claim is blocked by DB state transition
- [ ] Show concurrent executions across workers

**Exit criteria:** no double execution under concurrent workers.

---

### Phase 4 — Scheduler (last)

- [ ] Schedule definition on automation (cron / daily 9:30)
- [ ] Scheduler process creates executions when due
- [ ] Same queue → same worker path as Manual Run

**Important:** worker does not change. Only execution creation changes.

---

## Deployment map (later, not day 1)

| Piece | Host |
|-------|------|
| Next.js web + API routes | Vercel |
| Node worker | Railway |
| .NET HR API | Railway |
| PostgreSQL | Railway (or managed) |
| Redis | Railway |

Local first. Deploy after Phase 1C works.

---

## What to build now (next concrete steps)

1. Scaffold monorepo + docker-compose
2. Create DB schema for automations + executions
3. Implement `Run Now` enqueue path
4. Implement worker claim + SUCCESS path with noop nodes
5. Add .NET attendance/employee/email mocks
6. Wire Low Attendance nodes
7. Show execution status in UI
8. Only then: retries, multi-worker, scheduler, fancy builder

---

## Scope guardrails

**Do now**

- One workflow story
- Manual trigger
- Clear execution states
- Worker/queue separation
- .NET as external HR system

**Do later**

- Cron/scheduler
- Complex visual builder polish
- Real email provider
- Many HR domain workflows
- Perfect auth roles

**Avoid**

- Putting long-running worker inside Vercel
- Mixing .NET into the Next.js app
- Building 10 node types before one full path works
- Starting with scheduler instead of Run Now

---

## Definition of done for first milestone

You can demo:

> Login → open Low Attendance automation → Run Now → watch Queued/Running/Success → open logs showing 100 checked / N below 75% / email mock sent.

That single demo proves architecture, queueing, workers, and HR API integration.

---

## Decision log (locked for now)

- Manual Run before scheduler
- Worker = Node/TS, not .NET
- .NET = mock HR APIs only
- PostgreSQL = state of truth
- Redis/BullMQ = work distribution
- Vercel = control plane, Railway = execution plane (when deploying)
