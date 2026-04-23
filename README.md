# Mindful App

A monorepo for the Mindful guided meditation platform, built with React, Express, TypeScript, and managed by pnpm workspaces.

Run it in this order.

**Prereqs**

You need:

- `Node.js` 20+
- `pnpm` 10+
- `Docker Desktop`
- `Supabase CLI`

**1. Install dependencies**

From the repo root:

```bash
pnpm install
pnpm approve-builds
```

**2. Start local Supabase**

From the repo root:

```bash
supabase start
supabase db reset
supabase status
```

What this does:

- `supabase start` boots the local DB/API/auth/storage stack
- `supabase db reset` applies the migrations in `supabase/migrations/*` and runs `supabase/seed.sql`
- `supabase/seed.sql` creates a local dev auth user:
  - email: `dev@mindful.test`
  - password: `devpassword123`

**3. Create backend env**

Create `apps/backend/.env` with values from `supabase status`:

```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=YOUR_LOCAL_ANON_KEY
```

Use the local Supabase API URL and the `anon key` from `supabase status`.

**4. Seed meditation content**

The DB schema and dev user are not enough by themselves. The track/catalog data is loaded by the script in `supabase/scripts/seed-meditations.ts`.

Create `supabase/scripts/.env`:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=YOUR_LOCAL_SERVICE_ROLE_KEY
```

Then run:

```bash
pnpm --filter backend seed:meditations
```

This uploads the two school logos to the local `schools` storage bucket and inserts schools, categories, tracks, and track-category links.

**5. Optional frontend env**

You can run without frontend env because Vite proxies `/api` to `http://localhost:3001`.

If you want the login screen’s dev autofill button to work, create `apps/frontend/.env.local`:

```env
VITE_DEV_EMAIL=dev@mindful.test
VITE_DEV_PASSWORD=devpassword123
```

`VITE_API_URL` is optional for local dev here.

**6. Start the app**

From repo root:

```bash
pnpm dev
```

That starts:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

**7. Use it**

Open `http://localhost:5173` and log in with:

```text
dev@mindful.test
devpassword123
```

Useful local Supabase URLs:

- API: `http://127.0.0.1:54321`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio: `http://127.0.0.1:54323`

## Project Structure

```
mindful-app/
├── apps/
│   ├── frontend/        # React + Vite + TypeScript
│   └── backend/         # Express + TypeScript
├── packages/
│   └── shared/          # Shared utilities and types
├── .gitignore
├── package.json         # Root workspace scripts
├── pnpm-workspace.yaml  # Workspace definition
└── vercel.json          # Deployment configuration
```

## Available Scripts

- `pnpm dev` - Start both frontend and backend in parallel
- `pnpm dev:frontend` - Start frontend dev server
- `pnpm dev:backend` - Start backend dev server
- `pnpm build` - Build all packages
- `pnpm clean` - Clean all dependencies and build outputs

## Deployment

This project is configured for Vercel deployment:

- Frontend deploys to the root
- Backend API routes are proxied under `/api/*`
