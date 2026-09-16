# HR Automation Platform

A workflow automation platform for HR operations. Users design workflows in a visual dashboard, trigger them on demand (or later on a schedule), and background workers execute each step against mock HR APIs.

This repository is a **two-stack monorepo**:

| Stack | Role | Tech |
|-------|------|------|
| **Platform** | Control plane + job execution | Next.js, Node.js worker, BullMQ, **Neon (PostgreSQL)**, Redis |
| **HR API** | Mock HR domain services | .NET 8 Web API |

---

## Architecture

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
                 └────────▲────────┘
                          │ claim / state
                 ┌────────┴────────┐
                 │     Redis       │
                 │ localhost:6379  │
                 └────────┬────────┘
                          │ BullMQ job
                          ▼
                 ┌─────────────────┐
                 │ Node.js Worker  │
                 │ workflow-engine │
                 └────────┬────────┘
                          │ HTTP
                          ▼
                 ┌─────────────────┐
                 │   .NET API      │
                 │ localhost:5000  │
                 └─────────────────┘
```

**Design principle:** Next.js never executes long-running workflows. It creates an execution record in **Neon**, enqueues a job in **Redis**, and returns. Workers claim jobs atomically in Postgres (`QUEUED` → `RUNNING`), run the workflow engine, and call the .NET HR API for domain data.

**Database:** Neon-hosted PostgreSQL (not local Docker Postgres).  
**Queue:** Redis via local Docker (BullMQ).  
**Auth:** NextAuth + Google OAuth.

---

## Where data lives (Neon)

| Table | Purpose |
|-------|---------|
| `workflows` | Saved automations |
| `workflow_nodes` | Node type + config |
| `workflow_edges` | Graph connections |
| `executions` | Run instances + status |
| `execution_logs` | Per-node input/output/errors |

Concurrency (assignment requirement): claim via an atomic Postgres `UPDATE … WHERE status = 'QUEUED'` (ideally a `claim_execution` SQL function) so only one worker wins. See [docs/MOVE_FORWARD.md](./docs/MOVE_FORWARD.md).

---

## Repository structure

```text
hr-automation/
├── apps/
│   ├── web/                 # Next.js — dashboard, auth, workflow APIs
│   └── worker/              # Node.js — BullMQ consumer + workflow runner
├── packages/
│   └── workflow-engine/     # Shared workflow graph + node execution logic
├── hr-api/                  # .NET 8 — mock Employee / Attendance / Notification APIs
├── docs/                    # Design notes and planning docs
├── docker-compose.yml       # Local Redis only
├── .env.example             # Neon DATABASE_URL + Redis + auth
└── README.md
```

### Stack A — Platform (VS Code / Cursor)

- `apps/web` — UI and control-plane API routes (`pg` / Prisma / Drizzle → Neon)
- `apps/worker` — long-running queue consumer (Neon + Redis)
- `packages/workflow-engine` — shared execution logic used by the worker

### Stack B — HR API (Visual Studio)

- `hr-api` — standalone .NET 8 Web API
- Called over HTTP by workers; not embedded in the Next.js app

---

## Core flow (Phase 1)

Demo workflow: **Low Attendance Alert**

```text
[Manual Trigger]
      ↓
[Get Monthly Attendance]   → .NET
      ↓
[Filter < 75%]             → worker (in-process)
      ↓
[Get Employee Details]     → .NET
      ↓
[Send Email]               → .NET (mock)
      ↓
[Confirmation]
```

1. HR creates or opens the workflow in the dashboard  
2. Clicks **Run Now** → `POST /api/workflows/:id/run`  
3. Next.js inserts execution (`QUEUED`) in Neon and enqueues `{ executionId }` in Redis  
4. Worker claims via atomic SQL (`QUEUED` → `RUNNING`), loads the graph, executes nodes  
5. Dashboard shows Queued → Running → Success with per-node logs  

Scheduler support comes later; the worker path stays the same.

---

## Prerequisites

- Node.js 20+
- .NET 8 SDK
- Docker Desktop (**Redis only**)
- A [Neon](https://neon.tech) project (free tier is fine)
- pnpm or npm (platform apps)
- Visual Studio 2022 (optional, for `hr-api`)

---

## Quick start (local)

### 1. Clone and configure

```bash
git clone <repo-url> hr-automation
cd hr-automation
cp .env.example .env
```

Paste your Neon connection string into `DATABASE_URL`.

### 2. Start Redis

```bash
docker compose up -d
```

Starts Redis on `localhost:6379`. PostgreSQL is remote (Neon).

### 3. Apply Neon schema

Run the tables + `claim_execution` SQL against Neon (SQL Editor or `psql`) — see `docs/MOVE_FORWARD.md`.

### 4. Platform stack (Stack A)

```bash
cd apps/web && npm install && npm run dev
cd apps/worker && npm install && npm run dev
```

### 5. HR API stack (Stack B)

```bash
cd hr-api
dotnet restore
dotnet run
```

Or open `hr-api/` in Visual Studio.

### 6. Verify

| Service | URL / location |
|---------|----------------|
| Web dashboard | http://localhost:3000 |
| HR API | http://localhost:5000 (or launchSettings port) |
| PostgreSQL | Neon project |
| Redis | `localhost:6379` |

---

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Redis for BullMQ |
| `HR_API_BASE_URL` | .NET mock API base URL |
| `NEXTAUTH_*` / Google OAuth | Login when auth is wired |

Never commit real secrets. Keep `.env` local.

---

## Deployment map (target)

| Component | Host |
|-----------|------|
| Next.js (`apps/web`) | Vercel |
| Node worker (`apps/worker`) | Railway |
| .NET HR API (`hr-api`) | Railway |
| PostgreSQL | **Neon** |
| Redis | Railway / managed |

The worker is a **long-running process** and should not run as a Vercel serverless function.

---

## Development phases

| Phase | Focus |
|-------|--------|
| **1** | Manual Run end-to-end (queue → worker → .NET → dashboard) |
| **2** | Failures, retries, idempotent execution claims |
| **3** | Multiple workers + atomic claim proof on Neon |
| **4** | Scheduler (cron creates executions; worker unchanged) |

See [docs/MOVE_FORWARD.md](./docs/MOVE_FORWARD.md) for the detailed build plan.

---

## Documentation

| File | Contents |
|------|----------|
| [docs/MOVE_FORWARD.md](./docs/MOVE_FORWARD.md) | Build order, Neon schema, claim SQL |
| [docs/plan.md](./docs/plan.md) | Architecture diagram |
| [docs/example.md](./docs/example.md) | Full Manual Run walkthrough |
| [docs/](./docs/) | Additional design notes |

---

## Project status

Monorepo scaffolded; Next.js and worker packages started. Database target is **Neon**. Application features land phase by phase starting with Manual Run.

---

## License

Private / assignment use unless otherwise specified.
