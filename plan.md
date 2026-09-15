                         ┌──────────────────────┐
                         │      HR USER         │
                         │    Google Login      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Next.js        │
                         │                      │
                         │ Dashboard            │
                         │ Workflow Builder     │
                         │ Auth                 │
                         │ Automation API       │
                         └───────┬───────┬──────┘
                                 │       │
                       State     │       │ Queue Job
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
                              │      │              │
                              │      │ Workflow     │
                              │      │ Engine       │
                              │      └──────┬───────┘
                              │             │
                              │             │ HTTP
                              │             ▼
                              │      ┌──────────────┐
                              │      │ .NET 8       │
                              │      │ HR API       │
                              │      └──────┬───────┘
                              │             │
                              │             ▼
                              │      HR Data / APIs
                              │
                              └── execution state


HR-AUTOMATION-PLATFORM/
│
├── frontend/
│   └── Next.js application
│       ├── Dashboard
│       ├── Login / Google OAuth
│       ├── Workflow Builder
│       ├── Execution History
│       └── Next.js API Routes
│
├── worker/
│   └── Node.js + TypeScript
│       ├── Queue Consumer
│       ├── Workflow Engine
│       ├── Node Executors
│       └── Retry / Failure Handling
│
├── hr-api/
│   └── .NET 8 / C#
│       ├── Controllers
│       ├── Services
│       ├── EF Core
│       └── HR Mock APIs
│
├── docker-compose.yml
├── README.md
└── ENGINEERING.md
The important part

You do not need to put .NET inside the same Visual Studio/Next.js project.

Think of it as two development environments / services:

                HR AUTOMATION PLATFORM
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   Main Project                       HR API Project
        │                                 │
   VS Code / etc.                    Visual Studio
        │                                 │
   ┌────┴─────┐                    .NET 8 Web API
   │          │                         │
Next.js    Node Worker                  │
   │          │                         │
   └────┬─────┘                         │
        │                                │
        ├──── PostgreSQL ────────────────┤
        │                                │
        └──── Redis/BullMQ               │
                                         │
                              Employee / Attendance /
                              Candidate / Interview APIs
So when you're coding

Your main repo can be:

job-automation-platform/

Inside it:

job-automation-platform/
│
├── apps/
│   ├── web/          ← Next.js
│   └── worker/       ← Node.js worker
│
├── packages/
│   └── workflow-engine/
│
├── hr-api/           ← .NET API
│
├── docker-compose.yml
├── README.md
└── ENGINEERING.md

You can open the whole repository in VS Code.

For the .NET part, you can either:

Option A — recommended for you:

Open hr-api/ separately in Visual Studio.

Visual Studio
     ↓
hr-api/
     ↓
.NET 8 Web API

While your main development is:

VS Code
   ↓
job-automation-platform/
   ├── apps/web
   ├── apps/worker
   └── packages/workflow-engine