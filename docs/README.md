# Docs

Planning and architecture for the HR Automation Platform.

| File | Contents |
|------|----------|
| [MOVE_FORWARD.md](./MOVE_FORWARD.md) | Build order, Neon schema, atomic claim SQL, phases |
| [plan.md](./plan.md) | Architecture diagram (Neon + Redis + worker + .NET) |
| [example.md](./example.md) | Manual Run walkthrough (Low Attendance Alert) |

## Stack summary

- **Next.js** (`apps/web`) — control plane; Neon via `pg` / Prisma / Drizzle; NextAuth
- **Worker** (`apps/worker`) — BullMQ + Neon + workflow-engine; atomic claim SQL
- **Neon** — PostgreSQL; not local Docker Postgres
- **Redis** — local Docker for BullMQ
- **hr-api** — .NET mock HR APIs (Visual Studio)
