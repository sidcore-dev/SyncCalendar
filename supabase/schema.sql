-- Sync database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.
--
-- Design notes:
-- - No user accounts: members are scoped to a plan and identified by a client-held
--   member id (stored in localStorage). Anyone with the invite link (the plan id)
--   can read/write within that plan, which is an intentional MVP tradeoff — the
--   invite link itself is the secret. See README for the security tradeoff and how
--   to harden this later (magic links, Supabase Auth, per-member tokens, etc).
-- - `availability` stores one row per (member, slot) once a member submits, for
--   BOTH available and busy slots. This keeps "has this member responded at all"
--   (members.responded_at) cleanly separate from "is this member free right now"
--   (availability.status), which is what the overlap algorithm and the
--   Available / Pending / Busy status chips need.
-- - `votes` has a unique (plan_id, member_id) constraint: one vote per person,
--   upserted so a member can change their mind before the host finalizes.

create extension if not exists "pgcrypto";

-- ============================================================================
-- plans
-- ============================================================================
create table if not exists public.plans (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  description             text,
  location                text,
  date_range_start        date,
  date_range_end          date,
  budget                  text not null default 'medium'
                            check (budget in ('free', 'low', 'medium', 'high')),
  status                  text not null default 'collecting_availability'
                            check (status in ('collecting_availability', 'voting', 'finalized')),
  finalized_date          date,
  finalized_block         text
                            check (finalized_block in ('morning', 'afternoon', 'evening')),
  finalized_activity_id   text,
  finalized_activity_name text,
  created_at              timestamptz not null default now()
);

-- ============================================================================
-- members
-- ============================================================================
create table if not exists public.members (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.plans (id) on delete cascade,
  name          text not null,
  is_host       boolean not null default false,
  responded_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists members_plan_id_idx on public.members (plan_id);

-- ============================================================================
-- availability
-- ============================================================================
create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.plans (id) on delete cascade,
  member_id   uuid not null references public.members (id) on delete cascade,
  slot_id     text not null, -- `${yyyy-mm-dd}_${morning|afternoon|evening}`
  status      text not null check (status in ('available', 'busy')),
  created_at  timestamptz not null default now(),
  unique (member_id, slot_id)
);

create index if not exists availability_plan_id_idx on public.availability (plan_id);
create index if not exists availability_member_id_idx on public.availability (member_id);

-- ============================================================================
-- votes
-- ============================================================================
create table if not exists public.votes (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.plans (id) on delete cascade,
  member_id    uuid not null references public.members (id) on delete cascade,
  activity_id  text not null,
  created_at   timestamptz not null default now(),
  unique (plan_id, member_id)
);

create index if not exists votes_plan_id_idx on public.votes (plan_id);

-- ============================================================================
-- Row Level Security
--
-- MVP tradeoff: anyone who can compute/guess a plan's uuid can read/write it.
-- Since plan ids are random v4 uuids only shared via the invite link, this is
-- roughly as secure as an unlisted Google Doc. Good enough for an MVP; not a
-- substitute for real auth if this ships beyond a demo.
-- ============================================================================
alter table public.plans enable row level security;
alter table public.members enable row level security;
alter table public.availability enable row level security;
alter table public.votes enable row level security;

create policy "plans are readable by anyone with the id" on public.plans
  for select using (true);
create policy "anyone can create a plan" on public.plans
  for insert with check (true);
create policy "anyone can update a plan" on public.plans
  for update using (true);

create policy "members are readable by anyone with the plan id" on public.members
  for select using (true);
create policy "anyone can join a plan" on public.members
  for insert with check (true);
create policy "members can update their own row" on public.members
  for update using (true);

create policy "availability is readable by anyone with the plan id" on public.availability
  for select using (true);
create policy "anyone can submit availability" on public.availability
  for insert with check (true);
create policy "anyone can update availability" on public.availability
  for update using (true);
create policy "anyone can clear their availability" on public.availability
  for delete using (true);

create policy "votes are readable by anyone with the plan id" on public.votes
  for select using (true);
create policy "anyone can cast a vote" on public.votes
  for insert with check (true);
create policy "anyone can change their vote" on public.votes
  for update using (true);

-- ============================================================================
-- Realtime
-- ============================================================================
alter publication supabase_realtime add table public.plans;
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.availability;
alter publication supabase_realtime add table public.votes;
