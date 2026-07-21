# Sync

Make plans with 3+ people without the endless group chat. Create a plan, share one
link, everyone marks when they're free (no account needed), Sync finds the best
overlapping time, the group votes on an activity, and the host locks it in.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Realtime) ·
shadcn-style UI components · Framer Motion

## Getting started

### 1. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com), then open the SQL
editor and run everything in [`supabase/schema.sql`](./supabase/schema.sql). This
creates the four tables (`plans`, `members`, `availability`, `votes`), indexes,
row-level security policies, and enables Realtime on all four tables.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your
Supabase project's API settings (Project Settings → API).

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a plan, then open the
invite link in another browser (or incognito window) to join as a second member.

## How it works

**Flow:** Create Plan → Share Invite Link → Friends Join (name only) → Everyone
marks availability on a simple calendar → Sync ranks overlapping times by most
people available + longest stretch → Group votes on an activity → Host finalizes.

**No accounts.** A member's identity is a random id stored in `localStorage`,
scoped to that plan. The invite link (a random UUID) is effectively the shared
secret — anyone with the link can read and write within that plan. This is an
intentional MVP tradeoff (see `supabase/schema.sql` for the RLS policies and
notes on hardening this later).

**Realtime.** Every open browser subscribes to Postgres changes for its plan
([`src/hooks/use-plan-realtime.ts`](./src/hooks/use-plan-realtime.ts)) and
refetches the full bundle via [`/api/plan/[id]`](./src/app/api/plan/%5Bid%5D/route.ts)
when anything changes, so the progress bar, response counter, overlap results,
and votes update live for everyone without a refresh.

**Overlap algorithm** ([`src/lib/overlap.ts`](./src/lib/overlap.ts)). Each day is
split into three blocks (morning / afternoon / evening). For every block, we know
who's available, who's busy, and who hasn't responded at all. Adjacent same-day
blocks with an identical set of available members are merged into one window, so
a person free all day scores higher than the same person only free in three
disconnected blocks. Windows are ranked by `(available count, total hours)` —
most people first, longest stretch as the tiebreaker — and the top result is
"best," with up to three "alternatives" below it.

**Activity suggestions** ([`src/lib/activities.ts`](./src/lib/activities.ts)). A
static catalog of ~18 activities, each scored against the group size, the plan's
budget, indoor/outdoor fit against placeholder weather
([`src/lib/weather.ts`](./src/lib/weather.ts)) for the best window's date, and
whether the activity fits that time of day. The weather is deterministic (same
date → same forecast) so demos are reproducible. This whole module is the seam
where real weather data or an AI-suggestions feature would plug in later.

## Project structure

```
src/
  app/
    page.tsx                 Landing page + create-plan form
    plan/[id]/page.tsx        Server-rendered plan hub (fetches initial data)
    api/plan/[id]/route.ts    JSON bundle endpoint used by the realtime hook
  components/
    ui/                       Reusable shadcn-style primitives (Button, Card, ...)
    plan/                     Plan-specific feature components (see below)
    create-plan-form.tsx
  hooks/
    use-plan-realtime.ts      Supabase Realtime subscription + refetch
  lib/
    actions.ts                Server Actions: createPlan, joinPlan, submitAvailability,
                               castVote, advanceToVoting, finalizePlan
    overlap.ts                Availability overlap / ranking algorithm
    activities.ts             Activity catalog + scoring
    weather.ts                Placeholder deterministic "forecast"
    slots.ts                  Time-slot generation (dates × morning/afternoon/evening)
    member-session.ts         localStorage-backed member identity
    supabase/                 Browser + server Supabase clients, DB types
supabase/
  schema.sql                  Full Postgres schema + RLS policies
```

`components/plan/` breaks the plan hub into single-purpose pieces:
`progress-steps`, `join-gate`, `availability-picker`, `overlap-results`,
`activity-voting`, `finalized-view`, `host-controls`, `member-list`,
`response-counter`, `status-badge`, `copy-link-button`, orchestrated by
`plan-view.tsx`.

## Database schema

Four tables, all UUID-keyed, `plan_id` cascades on delete:

- **plans** — name, description, location, optional date range, budget,
  `status` (`collecting_availability` → `voting` → `finalized`), and the
  finalized date/block/activity once locked in.
- **members** — name, `is_host`, `responded_at` (null = pending).
- **availability** — one row per `(member, slot)` once a member submits, status
  `available` or `busy`. `slot_id` is `"<yyyy-mm-dd>_<morning|afternoon|evening>"`.
- **votes** — one row per `(plan, member)`, upserted, so a member can change
  their vote before the host finalizes.

## Built to extend, not to bloat

The schema, types, and algorithm interfaces are intentionally scoped to today's
feature set, but kept boring and composable enough that these don't require a
rewrite to add later:

- **Calendar sync** (Google/Apple) — would read from `plans`/`finalized_*` and
  write ICS/API events; no schema change needed.
- **Discord** — a bot could call the same Server Actions (`joinPlan`,
  `submitAvailability`, `castVote`) instead of the web UI.
- **AI suggestions** — `scoreActivities()` in `lib/activities.ts` is the exact
  seam to swap a static catalog for a model call.
- **Reminders, maps, reservations, expense splitting** — each is additive: a new
  table plus a new component under `components/plan/`, without touching the
  core flow.

None of the above is implemented — this MVP intentionally stops at finalize.
