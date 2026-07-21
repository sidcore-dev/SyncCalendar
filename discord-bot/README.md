# Sync Discord bot

A small Python bot that lets a Discord server create, join, and check Sync
plans without leaving chat. It talks directly to the same Supabase project as
the web app — no separate backend, no duplicated data model.

Availability picking and activity voting stay on the web app on purpose: those
are grid/multi-select interactions that a slash command can't do justice to.
The bot always hands off to the plan link (`/sync status`, `/sync link`) for
that part.

## Commands

- `/sync create name [description] [location] [budget]` — creates a plan with
  you as host, replies with the invite link.
- `/sync join plan_id` — joins an existing plan using your Discord display
  name, replies (ephemerally) with the link to mark your availability.
- `/sync status plan_id` — shows the plan's phase, response count, and (once
  finalized) the locked-in date/time and activity.
- `/sync link plan_id` — just the invite link, for re-sharing.

## Setup

### 1. Create the Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Under **Bot**, click **Reset Token** and copy it — this is `DISCORD_BOT_TOKEN`.
3. Under **OAuth2 → URL Generator**, check scopes `bot` and `applications.commands`,
   then under bot permissions check **Send Messages** and **Use Slash Commands**.
   Open the generated URL to invite the bot to your server.

### 2. Configure environment variables

```bash
cd discord-bot
cp .env.example .env
```

Fill in `DISCORD_BOT_TOKEN`, the same `SUPABASE_URL` / `SUPABASE_ANON_KEY` the
web app uses (see the root `.env.example`), and `SYNC_APP_URL` (your deployed
site, or `http://localhost:3000` while developing). `DISCORD_GUILD_ID` is
optional — set it to your test server's ID while developing so slash commands
sync instantly instead of waiting up to an hour for the global sync.

### 3. Install and run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python bot.py
```

The bot requires the same `supabase/schema.sql` to already be applied to your
Supabase project (see the root README) — it reads and writes the exact same
`plans` / `members` tables the web app does.
