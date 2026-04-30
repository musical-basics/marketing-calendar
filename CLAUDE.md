# marketing-calendar — agent notes

Quick facts for any future Claude session working in this repo.

## ⚠️ Hard rules

- **NEVER run `prisma migrate dev`** (or any other command that would
  drop/reset the database). All schema changes go through hand-written
  SQL applied to Supabase — see "Migrations" below.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind 3 + shadcn/ui (subset, hand-rolled in `components/ui/`)
- Supabase (Postgres) for persistence — see below
- Deployed on Vercel: pushes to `main` auto-deploy production

## Supabase

**All tables live in the `marketing_calendar` schema, NOT `public`.**

Reason: this Supabase project is shared with other apps. Keeping each app
in its own schema prevents naming collisions and makes per-app cleanup
trivial (`drop schema marketing_calendar cascade`).

The Supabase JS client is configured to default to this schema in
`lib/supabaseServer.ts` (`db: { schema: SCHEMA }`), so app code does
`supabaseAdmin.from("campaigns")` — no need to qualify.

**One-time Supabase dashboard step** (already done — re-do if you create
a new project):
- Project Settings → API → "Exposed schemas" → add `marketing_calendar`.
  Without this, PostgREST returns 404 for every request.

Schema source of truth: `db/schema.sql`. The file is idempotent
(`create … if not exists`, `on conflict do nothing`).

## Migrations

There is no migration framework. Edit `db/schema.sql` and re-apply.

Applying via psql (preferred — works from any IPv4 network):

```bash
# Loads SUPABASE_DB_URL (and never echoes it).
set -a; source .env.local; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
```

`SUPABASE_DB_URL` lives only in `.env.local` (gitignored). It points at
the **Session Pooler** (port 5432), not the Transaction Pooler (6543) —
DDL needs session mode. Never paste the URL into a committed file.

After any change that adds/removes tables or columns, reload PostgREST's
schema cache so the REST API picks them up:

```sql
notify pgrst, 'reload schema';
```

Direct DB connection (`db.<ref>.supabase.co`) is IPv6-only and won't
work on most home networks. Always use the pooler.

## Environment

All env vars are server-only (no `NEXT_PUBLIC_*` for Supabase — see
"Architecture" below). Set in `.env.local` for dev and in the Vercel
project env for production:

- `SUPABASE_URL`                 (Supabase project URL)
- `SUPABASE_SERVICE_ROLE_KEY`    (secret key — bypasses RLS, used by API routes)
- `SUPABASE_DB_URL`              (Session Pooler DSN — used only for migrations)

## Architecture: server-only data access

**The browser never talks to Supabase.** There is no `NEXT_PUBLIC_SUPABASE_*`
env var, no anon key in the JS bundle, no Supabase client in any Client
Component. The deployed bundle contains zero database credentials.

Data flow:
1. Browser hits `/api/{businesses,campaigns,tasks}` (our Next.js Route Handlers)
2. Route handlers use `lib/supabaseServer.ts` (service-role key) to read/write
3. JSON comes back; the store updates React state

Why this matters: the repo is public and the Vercel URL has no auth gate
right now. If we shipped the anon key in the bundle, anyone could read or
overwrite the DB even without visiting the site. With server-only access,
attackers have to hit our API endpoints — and we can later add auth, rate
limits, or Vercel Password Protection at that single chokepoint.

`lib/supabaseServer.ts` starts with `import "server-only"` so any
accidental import from a Client Component fails the build immediately.

## Store layer

`lib/store.tsx` (Client Component) exposes `useStore()` and is the *only*
place pages and components get data from. It calls `/api/*` via `fetch`,
not Supabase. Mutations are optimistic with rollback on error.

If you need to add a new resource: add the table in `db/schema.sql`, add
a `app/api/<resource>/route.ts` (+ `[id]/route.ts` for item ops), then
extend the store. Don't add a second Supabase client.

## Privacy model

There is no app-level auth yet. The repo and the Vercel URL are both
public. The app is "secure by obscurity" — anyone who finds the URL can
read and write everything via `/api/*`.

To tighten when needed:
1. Quick: turn on Vercel Password Protection (gates the API too).
2. Proper: add Supabase Auth (magic link), introduce a `user_id` column,
   tighten RLS, and have the API routes proxy the user's session.
