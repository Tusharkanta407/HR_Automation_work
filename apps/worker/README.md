# apps/worker

Node.js + TypeScript background worker.

## Responsibilities

- Consume BullMQ jobs from Redis
- Claim executions in PostgreSQL (`QUEUED` → `RUNNING`)
- Load workflow graph and run `workflow-engine`
- Call .NET HR API for domain steps
- Write execution logs; mark `SUCCESS` / `FAILED`
- Support retries and multi-worker safe claims

## Status

Scaffold only. Consumer + claim path comes in Phase 1A.
