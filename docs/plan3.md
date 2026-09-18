What to do first
1. Wire Connectors (do this before Run works for real)

Build Connectors page (/dashboard/connectors) + /api/integrations
HR adds e.g. Company HR API (base URL + API key) and SMTP (host, user, password)
In the builder, on nodes that call APIs (GET_MONTHLY_ATTENDANCE, etc.): pick that connector + set path
On SEND_EMAIL: pick SMTP connector + to/subject/body
Save workflow (so integrationId + config are in Neon)
Until that exists, Run Now has nothing real to call.

Then build: POST …/run → Redis → Worker → engine.

When HR clicks Execute / Run Now
Browser                    Next.js                         Redis              Worker                 Company API
   │                          │                              │                  │                        │
   │  POST /workflows/id/run  │                              │                  │                        │
   │─────────────────────────►│                              │                  │                        │
   │                          │  INSERT Execution QUEUED     │                  │                        │
   │                          │  enqueue { executionId }     │                  │                        │
   │                          │─────────────────────────────►│                  │                        │
   │  { executionId, QUEUED } │                              │                  │                        │
   │◄─────────────────────────│                              │                  │                        │
   │                          │         (Next.js STOPPED)    │                  │                        │
   │                          │                              │  job             │                        │
   │                          │                              │─────────────────►│                        │
   │                          │                              │                  │ claim → RUNNING         │
   │                          │                              │                  │ load nodes + connector │
   │                          │                              │                  │ GET baseUrl+path ──────►│
   │                          │                              │                  │◄──── JSON ──────────────│
   │                          │                              │                  │ …next nodes…            │
   │  poll GET /executions/id │                              │                  │ SUCCESS + logs          │
   │─────────────────────────►│                              │                  │                        │
   │  QUEUED → RUNNING → OK   │                              │                  │                        │
In plain words
Step	Who	What
1
UI
Click Run Now
2
Next.js
Create Execution = QUEUED only — does not run nodes
3
Next.js
Put { executionId } in Redis
4
Next.js
Reply { executionId, status: "QUEUED" } → UI shows queued
5
Worker
Picks up job
6
Worker
Atomic claim: QUEUED → RUNNING
7
Worker
Loads graph + connector (baseUrl + decrypted key)
8
Engine
Runs each node: HTTP to your API, filter locally, email via SMTP
9
Worker
Writes NodeExecution rows; sets Execution SUCCESS / FAILED
10
UI
Polls status: yellow Queued → blue Running → Success + logs
Important: Next.js never talks to the company API on Run. Only the worker uses the connector.

Practical “do now” checklist
Phase 2 — Connectors UI + API (paste APIs)
Phase 2b — Node picker for connector + path
Phase 4 — Run endpoint (QUEUED + Redis)
Phase 5–6 — Worker claim + engine
Phase 8 — Wire Run button to real poll (drop localStorage simulation)
I’m in Ask mode, so I can’t implement this here. Switch to Agent mode and say execute Phase 2 Connectors if you want it built next.

so how the worker srve get the data of like the proepr ui connetore evrything data proeprly

The worker never talks to the UI. It only reads what was already saved in Neon (Postgres).

How connector data reaches the worker
┌─────────────────┐     POST /api/integrations      ┌──────────────────┐
│ Connectors page │ ───────────────────────────────►│ Next.js API      │
│ (paste baseUrl, │     encrypt secret              │ encryptCredential│
│  API key, SMTP) │                                 └────────┬─────────┘
└─────────────────┘                                          │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │ Neon PostgreSQL  │
                                                    │ Integration      │
                                                    │ IntegrationCred  │
                                                    │ WorkflowNode     │
                                                    │  .integrationId  │
                                                    │  .config (path)  │
                                                    └────────┬─────────┘
                                                             │
┌─────────────────┐     Save workflow PUT                    │
│ Builder node    │ ──── integrationId + path ───────────────┘
│ pick connector  │
└─────────────────┘
Later — Run Now:
┌──────────┐  job {executionId}  ┌────────┐  load by IDs   ┌──────────┐
│  Redis   │ ───────────────────►│ Worker │ ──────────────►│ Postgres │
└──────────┘                     └────────┘                └──────────┘
Step by step
1. UI saves connectors (not to the worker)
On Connectors page you submit:

name, type (REST_API / SMTP)
baseUrl / SMTP host
API key / password
Next.js:

Encrypts the secret
Writes Integration + IntegrationCredential in Postgres
Returns to the browser without the decrypted key
Worker is offline / waiting — it doesn’t get this yet.

2. UI links nodes to that connector
In the builder, for e.g. Get Monthly Attendance:

Dropdown: choose “Company HR API” → stores node.integrationId
Path field: /api/attendance/monthly → stores in node.config
Save → PUT /api/workflows/:id writes nodes/edges into WorkflowVersion in Postgres.

3. Run Now only sends an ID
Next.js creates Execution and puts in Redis:

{ "executionId": "5001" }
Not the connector, not the graph, not the API key. Just the id.

4. Worker loads everything from Postgres
When the worker gets job 5001:

Claim execution → RUNNING
Read Execution.workflowVersionId
Load all WorkflowNode + WorkflowEdge for that version
For each node with integrationId, load:
Integration (baseUrl, type, config)
IntegrationCredential (encryptedData)
Decrypt on the worker (server-side only)
Call: GET {baseUrl}{path} with the auth header
So the worker “gets connector data” by querying the same Neon DB the UI wrote to — shared package @hr-automation/db / Prisma.

What each place stores
Data	Where	Who writes	Who reads
baseUrl, SMTP host
Integration
Connectors UI → API
Worker
API key / password
IntegrationCredential.encryptedData
API (encrypted)
Worker (decrypt)
Which connector
WorkflowNode.integrationId
Builder Save
Worker
Path / email body
WorkflowNode.config
Builder Save
Worker
Run to execute
Redis { executionId }
Run API
Worker
Results
NodeExecution
Worker
UI poll
Why this is correct
UI and worker stay separate (Next.js vs Railway/local worker).
Secrets never go through Redis or the browser after save.
If HR edits the connector later, the next run automatically uses the new baseUrl/key — nodes still point at the same integrationId.
Short answer: Connectors + node settings are saved to Postgres via Next.js APIs; the worker only receives executionId from Redis, then loads connector + graph from Postgres and decrypts credentials itself.

ok told me all the plan what i need to after this