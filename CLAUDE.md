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
`lib/supabaseClient.ts` (`db: { schema: SCHEMA }`), so app code does
`supabase.from("campaigns")` — no need to qualify. If you ever need
the `auth` schema or `public`, use `supabase.schema("public").from(...)`.

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

Required env vars (set in `.env.local` for dev, Vercel project env for prod):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  (publishable key, browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY`      (secret key, server-only — currently unused but kept for migrations)

## Privacy model

There is no app-level auth. Privacy is enforced at the URL with Vercel
Password Protection. RLS is enabled on every table but policies are
permissive (`using (true)`) — anyone past the URL password can read+write.

If multi-user becomes a real need, swap to Supabase Auth + per-row
`user_id` and tighten the RLS policies.

## Store layer

`lib/store.tsx` exposes `useStore()` and is the *only* file that talks
to Supabase. Keep it that way — pages and components never import the
Supabase client directly. Mutations update local state optimistically
and write to Supabase in the background.
