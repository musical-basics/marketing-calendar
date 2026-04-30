-- Marketing calendar schema
--
-- All tables live in the `marketing_calendar` schema (NOT `public`) so
-- this app cleanly coexists with other apps in the same Supabase project.
--
-- Privacy is enforced at the URL level (Vercel Password Protection).
-- RLS is enabled and permissive so the anon key from the browser works.
--
-- IMPORTANT one-time step after running this file:
--   Supabase Dashboard → Project Settings → API → "Exposed schemas"
--   Add `marketing_calendar` to the list and Save.
--   (Otherwise PostgREST won't see these tables.)

create schema if not exists marketing_calendar;

create table if not exists marketing_calendar.businesses (
  id text primary key,
  name text not null,
  color text not null default '#6b7280',
  created_at timestamptz not null default now()
);

create table if not exists marketing_calendar.campaigns (
  id text primary key,
  name text not null,
  business_ids text[] not null default '{}',
  start_date date not null,
  end_date date not null,
  goal text not null default '',
  status text not null default 'planned',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists marketing_calendar.tasks (
  id text primary key,
  campaign_id text not null references marketing_calendar.campaigns(id) on delete cascade,
  title text not null,
  due_date date not null,
  channel text not null default 'email',
  status text not null default 'todo',
  assignee text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists tasks_campaign_id_idx  on marketing_calendar.tasks(campaign_id);
create index if not exists tasks_due_date_idx     on marketing_calendar.tasks(due_date);
create index if not exists campaigns_start_idx    on marketing_calendar.campaigns(start_date);

-- ---- Extended fields (added 2026-04-30) -----------------------------------
-- All idempotent so the file stays safe to re-apply.

-- Campaign metadata for how Lionel actually runs campaigns.
-- priority: 'urgent' | 'high' | 'normal' | 'low' (sorted client-side)
alter table marketing_calendar.campaigns add column if not exists priority         text     not null default 'normal';
alter table marketing_calendar.campaigns add column if not exists audience         text     not null default '';
alter table marketing_calendar.campaigns add column if not exists offer            text     not null default '';
alter table marketing_calendar.campaigns add column if not exists primary_cta_url  text     not null default '';
alter table marketing_calendar.campaigns add column if not exists success_metric   text     not null default '';
alter table marketing_calendar.campaigns add column if not exists metric_target    numeric;
alter table marketing_calendar.campaigns add column if not exists metric_current   numeric;
alter table marketing_calendar.campaigns add column if not exists next_action      text     not null default '';
alter table marketing_calendar.campaigns add column if not exists blocked_reason   text     not null default '';

-- Task fields.
-- asset_status / copy_status: 'na' | 'not_started' | 'in_progress' | 'done'
alter table marketing_calendar.tasks add column if not exists priority         text     not null default 'normal';
alter table marketing_calendar.tasks add column if not exists asset_status     text     not null default 'na';
alter table marketing_calendar.tasks add column if not exists copy_status      text     not null default 'na';
alter table marketing_calendar.tasks add column if not exists link_url         text     not null default '';
alter table marketing_calendar.tasks add column if not exists publish_url      text     not null default '';
alter table marketing_calendar.tasks add column if not exists needs_approval   boolean  not null default false;

-- Grants. The app's API routes use the service_role key (server-side),
-- so service_role must have full access. anon + authenticated grants are
-- kept in case we ever need them (currently not used since the browser
-- never talks to Supabase directly — see CLAUDE.md).
grant usage on schema marketing_calendar to anon, authenticated, service_role;
grant all on all tables in schema marketing_calendar to anon, authenticated, service_role;
grant all on all sequences in schema marketing_calendar to anon, authenticated, service_role;
alter default privileges in schema marketing_calendar
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema marketing_calendar
  grant all on sequences to anon, authenticated, service_role;

alter table marketing_calendar.businesses enable row level security;
alter table marketing_calendar.campaigns  enable row level security;
alter table marketing_calendar.tasks      enable row level security;

drop policy if exists "businesses_all" on marketing_calendar.businesses;
create policy "businesses_all" on marketing_calendar.businesses
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "campaigns_all" on marketing_calendar.campaigns;
create policy "campaigns_all" on marketing_calendar.campaigns
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "tasks_all" on marketing_calendar.tasks;
create policy "tasks_all" on marketing_calendar.tasks
  for all to anon, authenticated using (true) with check (true);

-- Seed default businesses (idempotent)
insert into marketing_calendar.businesses (id, name, color) values
  ('musical-basics',   'Musical Basics',            '#3b82f6'),
  ('dreamplay-pianos', 'DreamPlay Pianos',          '#8b5cf6'),
  ('ultimate-pianist', 'Ultimate Pianist',          '#ec4899'),
  ('belgium-concert',  'Belgium concert',           '#f97316'),
  ('ds-standard',      'DS Standard / Steinbuhler', '#10b981'),
  ('other',            'Other',                     '#6b7280')
on conflict (id) do nothing;
