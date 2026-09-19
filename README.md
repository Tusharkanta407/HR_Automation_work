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
│   ├── db/                  # Prisma schema + shared client (@hr-automation/db)
│   └── workflow-engine/     # Shared workflow graph + node execution logic
├── hr-api/                  # Optional .NET mock (point Connector baseUrl here)
├── docs/
├── package.json             # npm workspaces + vercel-build
├── docker-compose.yml       # Local Redis only
├── .env.example
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

Paste your Neon connection string into `DATABASE_URL`. Also copy auth vars into `apps/web/.env.local` (Next.js loads env from the app folder).

### 2. Start Redis

```bash
docker compose up -d
```

Starts Redis on `localhost:6379`. PostgreSQL is remote (Neon).

### 3. Install (monorepo) + Prisma client

From the **repo root**:

```bash
npm install
```

This installs `apps/web` + `packages/db` workspaces and runs `prisma generate`.

Schema migrations (already applied in Neon for V1):

```bash
npm run migrate:deploy -w @hr-automation/db
```

### 4. Platform stack (Stack A)

```bash
npm run dev:web
# worker (separate terminal, after worker package is wired):
cd apps/worker && npm install && npm run dev
```

### 5. HR API stack (Stack B) — optional

Only if you point a Connector `baseUrl` at a local mock API:

```bash
cd hr-api
dotnet restore
dotnet run
```

### 6. Verify

| Service | URL / location |
|---------|----------------|
| Web dashboard | http://localhost:3000 |
| PostgreSQL | Neon project |
| Redis | `localhost:6379` |

---

## Deploy Next.js on Vercel

Import the GitHub repo, then set:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build / Install** | leave defaults — [`apps/web/vercel.json`](apps/web/vercel.json) runs root `npm install` + `npm run vercel-build` (generates Prisma client, then `next build`) |

**Environment variables** (Production + Preview):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon connection string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | long random string |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth client |
| `CREDENTIALS_SECRET` | min 16 chars (integration encryption) |

Google OAuth redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

Vercel hosts **only** the web app. The worker + Redis belong on Railway (or similar); Run Now will queue but not execute until a worker is running.

---

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Redis for BullMQ (worker) |
| `CREDENTIALS_SECRET` | Encrypt Integration credentials |
| `NEXTAUTH_*` / Google OAuth | Login |

Never commit real secrets. Keep `.env` local.

---

## Deployment map (target)

| Component | Host |
|-----------|------|
| Next.js (`apps/web`) | Vercel |
| Node worker (`apps/worker`) | Railway |
| Company HR API | User Connector `baseUrl` (any host) |
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
