---
name: Backend Phases 1-8
overview: "Unified Account-Level Connection Architecture (Google Workspace: Gmail + Calendar + Drive via OAuth 2.0; Custom REST for HR/ATS; Webhooks; legacy SMTP fallback). Next.js control plane enqueues execution; Worker claims QUEUED -> RUNNING in Neon; Engine executes using provider adapters (Google REST APIs & Custom HR API) without hardcoded mock endpoints."
todos:
  - id: p1-prisma
    content: "PHASE 1: Prisma + Neon — DONE"
    status: completed
  - id: p2-schema-oauth
    content: "PHASE 2A: Schema update for Unified Account OAuth (Integration.accountIdentifier, Credential.scopes/expiresAt, CredentialType.OAUTH2)"
    status: pending
  - id: p2-google-oauth
    content: "PHASE 2A: Google Workspace OAuth flow (/api/integrations/google/auth & callback) + offline refresh token encryption"
    status: pending
  - id: p2-google-adapter
    content: "PHASE 2A: Google Workspace Adapter (Gmail send/draft, Calendar events, Drive fetch document)"
    status: pending
  - id: p2-connectors-ui
    content: "PHASE 2B: Connections UI — Google Workspace card (badges, test, disconnect) + Custom REST + Webhooks"
    status: completed
  - id: p2b-node-picker
    content: "PHASE 2C: Builder node settings — pick Connection (Google Workspace vs Custom REST) + action/path"
    status: completed
  - id: p3-workflow-crud
    content: "PHASE 3: Finish workflow CRUD / publish + save integrationId on nodes"
    status: completed
  - id: p4-run-queue
    content: "PHASE 4: POST run → Execution QUEUED + BullMQ"
    status: pending
  - id: p5-worker
    content: "PHASE 5: Worker claim + load graph + decrypt Integration secrets"
    status: pending
  - id: p6-engine
    content: "PHASE 6: Engine execution with provider adapters (Google Workspace API + Custom REST)"
    status: pending
  - id: p7-reliability
    content: "PHASE 7: Retry / stale recovery / idempotency"
    status: pending
  - id: p8-wire-ui
    content: "PHASE 8: Wire Run Now status + logs off simulation"
    status: pending
isProject: false
---

# Backend Roadmap: Unified Account Connection & Execution Engine

## 1. Core Architectural Decisions (Locked)

1. **Unified Account-Level Connections (No Fragmented Google Apps):**
   - We do **NOT** create separate OAuth credentials/connections for Gmail, Calendar, and Drive.
   - The user connects **one Google Workspace account** (e.g. `hr@company.com`).
   - The connection holds granted scopes (capabilities) for **Gmail**, **Calendar**, and **Drive**.

2. **No SMTP Needed for Google Workspace:**
   - Google connections use the direct **Gmail REST API** (`https://gmail.googleapis.com`) with OAuth 2.0 bearer tokens.
   - **Why No SMTP?** No passwords to store, 2FA never breaks, cloud firewalls/ports (25/465/587) are not blocked, and it allows **safe draft-first mode** and reading candidate replies.
   - SMTP remains strictly an optional fallback for non-Google/custom legacy servers or transactional bulk mail (SendGrid/Amazon SES).

3. **Decoupled Responsibilities:**
   - **Connections Page** (`/dashboard/connections`) = Authorize external systems once (stores account identifier, base URL, encrypted OAuth refresh token or API keys).
   - **Node Settings** in Builder = Pick which Connection to use (`integrationId`) + select Action and path/parameters. No secrets are ever stored on nodes.
   - **Control Plane Only in Next.js:** Next.js never runs nodes; it only inserts `Execution (QUEUED)` and enqueues `{ executionId }` to BullMQ/Redis.
   - **Worker + Engine:** Claims execution atomically in Neon, decrypts credentials, executes provider adapters, and logs results.

---

## 2. System Architecture Diagram

```text
                    YOUR PLATFORM
                         │
              ┌──────────┴──────────┐
              │                     │
        CONNECTIONS             WORKFLOWS
              │                     │
       ┌──────┼──────┐              │
       ↓      ↓      ↓              ↓
    Google  Microsoft  Custom     Nodes
       │      │       REST         │
       │      │        │           │
       ├──────┤        │      integrationId
       │      │        │           │
     Gmail  Calendar   HR API       │
     Drive    Teams    (ATS)        │
       │      │        │           │
       └──────┴────────┴───────────┘
                         │
                       Worker
                         │
                  Workflow Engine
                         │
                    Redis/BullMQ
```

---

## 3. Database Model Evolution (`packages/db/prisma/schema.prisma`)

```prisma
enum IntegrationType {
  OAUTH          // Unified OAuth (Google Workspace, Microsoft 365)
  REST_API       // Custom HR System / Internal API
  SMTP           // Legacy SMTP fallback
  WEBHOOK        // Webhook destinations
}

enum CredentialType {
  OAUTH2         // Refresh token + client credentials
  API_KEY
  BEARER
  BASIC
  SMTP
  CUSTOM_JSON
}

model Integration {
  id                String            @id @default(cuid())
  userId            String
  name              String            // e.g. "HR Google Workspace"
  type              IntegrationType   @default(OAUTH)
  provider          String            // "GOOGLE" | "MICROSOFT" | "CUSTOM_REST"
  accountIdentifier String?           // e.g. "hr@company.com"
  baseUrl           String?           // For REST APIs or specific service host
  config            Json              @default("{}") // User configuration & default options
  metadata          Json              @default("{}") // Avatar, domain, user info
  status            IntegrationStatus @default(ACTIVE)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  user              User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  credentials       IntegrationCredential[]
  nodes             WorkflowNode[]

  @@index([userId])
  @@index([userId, provider])
}

model IntegrationCredential {
  id            String         @id @default(cuid())
  integrationId String
  type          CredentialType
  /// AES-256-GCM ciphertext (base64) of { refreshToken, clientId, clientSecret }
  encryptedData String         @db.Text
  expiresAt     DateTime?
  scopes        String[]       @default([]) // e.g. ["gmail.send", "calendar.events", "drive.readonly"]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  integration   Integration    @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@index([integrationId])
}
```

---

## 4. Google Workspace Scopes & Capabilities

When the user clicks **"Connect Google Workspace"**, Next.js initiates OAuth with `access_type=offline&prompt=consent`:

| Capability | Scopes Requested | What It Enables in Workflows |
| :--- | :--- | :--- |
| **Account Info** | `openid`, `email`, `profile` | Populates `accountIdentifier` (`hr@company.com`) and avatar |
| **Gmail** | `https://www.googleapis.com/auth/gmail.send`<br/>`https://www.googleapis.com/auth/gmail.compose`<br/>`https://www.googleapis.com/auth/gmail.readonly` | • Send email to candidate/employee<br/>• Create email draft (safe review mode)<br/>• Read/search candidate replies |
| **Calendar** | `https://www.googleapis.com/auth/calendar.events`<br/>`https://www.googleapis.com/auth/calendar.readonly` | • Schedule interview events<br/>• Check interviewer availability<br/>• Send calendar invites with Google Meet |
| **Drive** | `https://www.googleapis.com/auth/drive.readonly` | • Fetch candidate resumes<br/>• Download company onboarding policy PDFs<br/>• Read data sheets |

---

## 5. Connections Page Layout (`/dashboard/connections`)

The UI displays high-level platform tiles:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Connections                                                                │
│  Connect the tools your workflows use.                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [ Google Workspace Icon ]   Google Workspace                               │
│  hr@company.com  •  Active                                                  │
│                                                                             │
│  Capabilities:                                                              │
│  ✓ Gmail (Send & Draft)   ✓ Calendar (Interview Schedule)  ✓ Google Drive   │
│                                                                             │
│  [ Test Connection ]   [ Reconnect / Scopes ]   [ Disconnect ]              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [ Microsoft Icon ]          Microsoft 365                                  │
│  Not connected — Connect Outlook, Teams, and OneDrive.                      │
│                                                                             │
│  [ Connect Microsoft ]                                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [ Server Icon ]             Custom HR System (REST API)                    │
│  https://hr.company.internal  •  API Key Auth                               │
│                                                                             │
│  [ Edit Settings ]   [ Test Connection ]   [ Delete ]                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [ Webhook Icon ]            Webhooks & Events                              │
│  Inbound triggers and outbound webhooks                                     │
│                                                                             │
│  [ Configure Webhooks ]                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Node → Connection Matrix in Builder

Nodes simply point to an `integrationId` and pick an action:

| Node Type | Connection | Action / Config | Notes |
| :--- | :--- | :--- | :--- |
| `SEND_EMAIL` | **Google Workspace** | `Action: Send Email` or `Create Draft`<br/>`To: {{candidate.email}}`, `Subject`, `Body` | Calls Gmail REST API directly; no SMTP credentials required. |
| `SCHEDULE_INTERVIEW` | **Google Workspace** | `Action: Create Event`<br/>`Title`, `Start`, `End`, `Attendees` | Calls Google Calendar API; creates calendar invite + Meet link. |
| `FETCH_DOCUMENT` / `GET_RESUME` | **Google Workspace** | `Action: Fetch File`<br/>`File ID: {{candidate.resume_id}}` | Calls Google Drive API; downloads resume or policy doc. |
| `GET_MONTHLY_ATTENDANCE` | **Custom HR API** | `Method: GET`, `Path: /api/attendance/monthly` | Calls company HR/ATS endpoint with decrypted Bearer/API Key. |
| `GET_EMPLOYEES` / `GET_EMPLOYEE` | **Custom HR API** | `Method: GET`, `Path: /api/employees` | Calls company HR/ATS endpoint. |
| `UPDATE_CANDIDATE_STATUS` | **Custom HR API** | `Method: PATCH`, `Path: /api/candidates/{id}/status` | Updates ATS candidate status. |
| `CONDITION`, `FILTER`, `FOR_EACH` | *None* (`null`) | Logic evaluated in worker memory | No connection needed. |

---

## 7. Phased Implementation Roadmap

### Phase 2A — Google Workspace Unified Connection
1. Update Prisma schema:
   - Add `OAUTH` to `IntegrationType`, `OAUTH2` to `CredentialType`.
   - Add `accountIdentifier` and `metadata` to `Integration`.
   - Add `scopes` and `expiresAt` to `IntegrationCredential`.
   - Run `prisma generate` and `prisma db push`.
2. Implement Google OAuth endpoints:
   - `GET /api/integrations/google/auth`: Redirects to Google consent with offline access (`access_type=offline&prompt=consent`) and Gmail + Calendar + Drive scopes.
   - `GET /api/integrations/google/callback`: Exchanges code for tokens, retrieves user profile, encrypts refresh token with AES-256-GCM, and upserts `Integration` record.
3. Build Google Workspace API Adapter (`apps/web/src/lib/google-workspace.ts` / `packages/workflow-engine`):
   - Ephemeral access token refresh from stored refresh token.
   - `sendEmail({ to, subject, body, draftOnly? })`
   - `createCalendarEvent({ title, start, end, attendees })`
   - `fetchDriveFile({ fileId })`
4. Update Connections Page UI:
   - Google Workspace card with connected email, capability badges, and Disconnect/Test buttons.

### Phase 2B — Custom HR API & Webhook (Completed)
- Custom REST connection with Base URL, Auth (API Key, Bearer, Basic), default headers, and test connection.
- Webhooks destination setup.

### Phase 3 — Workflow CRUD & Published Versions (Completed)
- Workflows, versions, nodes, and edges persisted in Neon PostgreSQL.
- `WorkflowNode.integrationId` saved and loaded seamlessly.

### Phase 4 — POST Run Endpoint + Redis/BullMQ
- Create `POST /api/workflows/:id/run`:
  - Verify user authorization and workflow readiness.
  - Insert `Execution` record with status `QUEUED`.
  - Enqueue `{ executionId, workflowId, versionId }` to BullMQ `workflow-executions` queue.
  - Return `{ executionId, status: "QUEUED" }`.
- Add `GET /api/executions/:id` for status and log inspection.

### Phase 5 — Worker Consumer & Atomic Claim
- In `apps/worker`:
  - Consume jobs from BullMQ queue.
  - Atomic claim: `UPDATE "Execution" SET status = 'RUNNING', "startedAt" = NOW(), "workerId" = $1 WHERE id = $2 AND status = 'QUEUED' RETURNING *;`
  - Load workflow graph (nodes and edges) for the version.
  - Load and decrypt required Integration credentials (`decryptCredential`).

### Phase 6 — Execution Engine with Provider Adapters
- In `packages/workflow-engine`:
  - Execute nodes topologically / sequentially.
  - Route execution based on node type and connection:
    - If `Google Workspace`: call Google Workspace API Adapter (Gmail / Calendar / Drive).
    - If `Custom HR API`: perform HTTP fetch to `baseUrl + path` with decrypted auth headers.
    - If logic node (`FILTER`, `CONDITION`, `FOR_EACH`): evaluate locally.
  - Record `NodeExecution` rows (`RUNNING` -> `SUCCESS` / `FAILED`) with inputs, outputs, and errors.
  - Update `Execution` status to `SUCCESS` or `FAILED`.

### Phase 7 — Reliability & Idempotency
- Idempotency key handling (`IdempotencyKey` table).
- Safe re-queues, worker crash detection, and execution timeout recovery.

### Phase 8 — Wire Canvas Run to Real API
- Replace simulated client timer in `flow-canvas.tsx` (`handleRunSimulation`) with live `POST /api/workflows/:id/run`.
- Update `execution-log-drawer.tsx` to poll `GET /api/executions/:id` to display live step-by-step logs.
