# hr-api

.NET 8 Web API — mock HR system for the automation platform.

Open this folder in **Visual Studio** for day-to-day C# work. The platform worker calls these endpoints over HTTP; this project is not embedded in Next.js.

## Planned endpoints (Phase 1)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/attendance/monthly` | Monthly attendance list |
| GET | `/api/employees/{id}` | Employee details |
| POST | `/api/notifications/email` | Mock email send |

## Status

Scaffold only. Project file and controllers come next.
