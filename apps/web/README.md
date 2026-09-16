# apps/web

Next.js control plane for HR Automation.

## What’s wired

- Landing page (`/`) — your layout/theme, HR copy
- Google sign-in via **NextAuth** (modal + `/login`)
- After login → `/dashboard`
- Session provider + theme provider in root layout

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Google OAuth redirect

In Google Cloud Console, authorized redirect URI must be:

`http://localhost:3000/api/auth/callback/google`

Env lives in `apps/web/.env.local` (`NEXTAUTH_*`, `GOOGLE_*`).
