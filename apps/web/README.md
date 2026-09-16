# apps/web

Next.js control plane for HR Automation.

## Features

- Landing + Google sign-in (NextAuth)
- Dashboard with local workflow list
- Workflow builder with **Excalidraw** canvas + HR node palette
- Save / Run Now (Save → localStorage; Run is UI stub only)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 → sign in → Dashboard → Create workflow.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/login` | Google sign-in |
| `/dashboard` | Workflow list |
| `/workflows/new` | Create local draft |
| `/workflows/[id]` | Excalidraw builder |

## Notes

- Excalidraw loads client-only (`ssr: false`)
- Workflow JSON + scene stored in `localStorage` key `hr-automation-workflows`
- No Neon / Redis / worker in this slice
