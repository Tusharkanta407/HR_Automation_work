# apps/web

Next.js control plane for the HR Automation Platform.

## Responsibilities

- Dashboard, workflow list/builder, execution status UI
- Auth via NextAuth + Google
- Control-plane API routes: save workflows, **Run Now** (insert `QUEUED` execution in Neon + enqueue BullMQ job)
- Read execution status/logs from Neon for the UI

## Does not

- Run long-lived workflows (that is `apps/worker`)
- Call .NET HR domain APIs during execution (worker does)

## Env

Uses `DATABASE_URL` (Neon) and `REDIS_URL` (server-side enqueue). See repo root `.env.example`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
