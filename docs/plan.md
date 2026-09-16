# Architecture plan

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
                 │                 │
                 │ workflow-engine │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   .NET API      │
                 │ localhost:5000  │
                 └─────────────────┘
```

## What each piece does

| Piece | Role |
|-------|------|
| **Neon** | PostgreSQL for workflows, executions, logs |
| **Redis (Docker)** | BullMQ job queue only — no local Postgres container |
| **Next.js** | Control plane: UI + enqueue Run Now; NextAuth Google login |
| **Node worker** | Consumes queue, claims via atomic SQL, runs engine, calls .NET |
| **.NET API** | Mock HR domain (attendance / employees / email) |

## Data (Neon)

- `workflows`
- `workflow_nodes`
- `workflow_edges`
- `executions`
- `execution_logs`

Claim concurrency: Postgres `UPDATE … WHERE status = 'QUEUED' RETURNING *` (or `claim_execution` function) so only one worker gets `QUEUED → RUNNING`.

## Repo layout

```text
hr-automation/
├── apps/
│   ├── web/                 ← Next.js
│   └── worker/              ← Node.js worker
├── packages/
│   └── workflow-engine/
├── hr-api/                  ← .NET API (Visual Studio)
├── docker-compose.yml       ← Redis only
├── .env.example
└── docs/
```

Two environments:

- **VS Code / Cursor** → `apps/web`, `apps/worker`, `packages/workflow-engine`
- **Visual Studio** → `hr-api/`

Worker and Next.js both talk to **Neon PostgreSQL**. Only the worker talks to the .NET HR API during execution.
