# packages/workflow-engine

Shared workflow execution library used by `apps/worker`.

## Responsibilities

- Represent nodes and edges
- Walk the graph in order
- Dispatch node executors (trigger, HTTP/HR calls, filter, email, confirmation)
- Maintain per-execution context/payload between nodes

## Status

Scaffold only. First real path: Low Attendance Alert nodes.
