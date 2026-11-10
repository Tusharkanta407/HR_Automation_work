# packages/workflow-engine

Shared workflow execution library used by `apps/worker`.

## Supported path (V1)

`MANUAL_TRIGGER` → `READ_GOOGLE_SHEET` → `FOR_EACH` → `SEND_EMAIL` (Gmail draft/send + PDF attachments)

Also: `SUCCESS`, `LOG_RESULT`, `DELAY`, and other trigger types as no-ops.
