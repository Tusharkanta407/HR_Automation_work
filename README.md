# HR Automation Platform

A workflow automation platform for HR operations. Users design automations in a visual dashboard, trigger them on demand (or later on a schedule), and background workers execute each step against mock HR APIs.

This repository is a **two-stack monorepo**:

| Stack | Role | Tech |
|-------|------|------|
| **Platform** | Control plane + job execution | Next.js, Node.js worker, BullMQ, PostgreSQL, Redis |
| **HR API** | Mock HR domain services | .NET 8 Web API |

---

## Architecture

```text
                         ┌──────────────────────┐
                         │      HR USER         │
                         │    Google Login      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Next.js        │
                         │  Dashboard / Auth /  │
                         │  Workflow Builder /  │
                         │  Automation API      │
                         └───────┬───────┬──────┘
                                 │       │
                       State     │       │ Queue job
                                 ▼       ▼
                         ┌──────────┐  ┌──────────┐
                         │PostgreSQL│  │  Redis   │
                         │          │  │ BullMQ   │
                         └────▲─────┘  └────┬─────┘
                              │             │
                              │             ▼
                              │      ┌──────────────┐
                              │      │ Node.js      │
                              │      │ Worker Pool  │
                              │      │ Workflow     │
                              │      │ Engine       │
                              │             │
                              │             │ HTTP
                              │             ▼
                              │      ┌──────────────┐
                              │      │ .NET 8       │
                              │      │ HR Mock API  │
                              │      └──────────────┘
                              └── execution state
```

**Design principle:** Next.js never executes long-running workflows. It creates an execution record, enqueues a job, and returns. Workers claim jobs, run the workflow engine, and call the .NET HR API for domain data.

---

## Repository structure

```text
hr-automation/
├── apps/
│   ├── web/                 # Next.js — dashboard, auth, automation APIs
│   └── worker/              # Node.js — BullMQ consumer + workflow runner
├── packages/
│   └── workflow-engine/     # Shared workflow graph + node execution logic
├── hr-api/                  # .NET 8 — mock Employee / Attendance / Notification APIs
├── docs/                    # Design notes and planning docs
├── docker-compose.yml       # Local PostgreSQL + Redis
├── .env.example             # Environment variable template
└── README.md
```

### Stack A — Platform (VS Code)

- `apps/web` — UI and control-plane API routes
- `apps/worker` — long-running queue consumer
- `packages/workflow-engine` — shared execution logic used by the worker

### Stack B — HR API (Visual Studio)

- `hr-api` — standalone .NET 8 Web API
- Open this folder in Visual Studio when working on C# / EF Core
- Called over HTTP by workers; not embedded in the Next.js app

---

## Core flow (Phase 1)

Demo automation: **Low Attendance Alert**

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

1. HR creates or opens the automation in the dashboard  
2. Clicks **Run Now** → `POST /api/automations/:id/run`  
3. Next.js creates an execution (`QUEUED`) and enqueues `{ executionId }` in Redis  
4. Worker claims the job (`QUEUED` → `RUNNING`), loads the graph, executes nodes  
5. Dashboard shows Queued → Running → Success with per-node logs  

Scheduler support comes later; the worker path stays the same.

---

## Prerequisites

- Node.js 20+
- .NET 8 SDK
- Docker Desktop (PostgreSQL + Redis)
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

### 2. Start infrastructure

```bash
docker compose up -d
```

Starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 3. Platform stack (Stack A)

```bash
# from repo root (once package manifests exist)
cd apps/web && npm install && npm run dev
cd apps/worker && npm install && npm run dev
```

### 4. HR API stack (Stack B)

```bash
cd hr-api
dotnet restore
dotnet run
```

Or open `hr-api/` in Visual Studio and run the Web API project.

### 5. Verify

| Service | URL (local) |
|---------|-------------|
| Web dashboard | http://localhost:3000 |
| HR API | http://localhost:5080 (or launchSettings port) |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

---

## Environment

Copy `.env.example` to `.env` and adjust as needed. Typical variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection for BullMQ |
| `HR_API_BASE_URL` | Base URL of the .NET mock API |
| `NEXTAUTH_URL` / OAuth secrets | Google login (when auth is wired) |

Never commit real secrets. Keep `.env` local.

---

## Deployment map (target)

| Component | Host |
|-----------|------|
| Next.js (`apps/web`) | Vercel |
| Node worker (`apps/worker`) | Railway |
| .NET HR API (`hr-api`) | Railway |
| PostgreSQL | Railway / managed |
| Redis | Railway / managed |

The worker is a **long-running process** and should not run as a Vercel serverless function.

---

## Development phases

| Phase | Focus |
|-------|--------|
| **1** | Manual Run end-to-end (queue → worker → .NET → dashboard) |
| **2** | Failures, retries, idempotent execution claims |
| **3** | Multiple workers + duplicate-run protection |
| **4** | Scheduler (cron creates executions; worker unchanged) |

See `MOVE_FORWARD.md` and `docs/` for the detailed build plan.

---

## Documentation

| File | Contents |
|------|----------|
| [MOVE_FORWARD.md](./MOVE_FORWARD.md) | Build order and milestone checklist |
| [plan.md](./plan.md) | High-level architecture diagram |
| [example.md](./example.md) | Full Manual Run walkthrough |
| [docs/](./docs/) | Additional design notes |

---

## Project status

Scaffolded monorepo. Application code for web, worker, workflow-engine, and hr-api will be added phase by phase starting with Manual Run.

---

## License

Private / assignment use unless otherwise specified.
