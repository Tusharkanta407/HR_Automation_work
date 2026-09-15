# Apps — Platform stack (Node / TypeScript)

## `apps/web`
Next.js control plane: Google auth, dashboard, workflow builder, automation CRUD, and `Run Now` API routes that enqueue jobs.

## `apps/worker`
Long-running Node.js process: BullMQ consumer, claims executions in PostgreSQL, runs the workflow engine, calls the .NET HR API.

# Packages

## `packages/workflow-engine`
Shared TypeScript library for loading workflow graphs, walking nodes/edges, and executing node types.

# Stack B — HR API

## `hr-api`
.NET 8 Web API providing mock HR domain endpoints (employees, attendance, notifications). Develop in Visual Studio; call over HTTP from workers.

# Docs

Planning and architecture notes live in the repo root (`MOVE_FORWARD.md`, `plan.md`, `example.md`) and may be expanded here.
