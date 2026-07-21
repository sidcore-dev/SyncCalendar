"""Discord bot for Sync.

Lets a Discord server create/join/check plans without leaving chat, for the
parts that are just a few words of input. Availability picking and voting stay
on the web app — they're inherently a grid/UI interaction that a chat command
can't do justice to — so this bot always hands off to the plan link for that.

Setup: see README.md in this folder.
"""

import asyncio
import os

import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

import supabase_client
from supabase_client import PlanNotFoundError

load_dotenv()

DISCORD_BOT_TOKEN = os.environ["DISCORD_BOT_TOKEN"]
SYNC_APP_URL = os.environ.get("SYNC_APP_URL", "http://localhost:3000").rstrip("/")
GUILD_ID = os.environ.get("DISCORD_GUILD_ID") or None

BUDGET_CHOICES = [
    app_commands.Choice(name="Free", value="free"),
    app_commands.Choice(name="Low ($)", value="low"),
    app_commands.Choice(name="Medium ($$)", value="medium"),
    app_commands.Choice(name="High ($$$)", value="high"),
]

PHASE_LABELS = {
    "collecting_availability": "📅 Collecting availability",
    "voting": "🗳️ Voting on an activity",
    "finalized": "✅ Finalized",
}

intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)
sync_group = app_commands.Group(name="sync", description="Sync scheduling commands")


def plan_url(plan_id: str) -> str:
    return f"{SYNC_APP_URL}/plan/{plan_id}"


@bot.event
async def on_ready():
    if GUILD_ID:
        guild = discord.Object(id=int(GUILD_ID))
        bot.tree.copy_global_to(guild=guild)
        await bot.tree.sync(guild=guild)
    else:
        await bot.tree.sync()
    print(f"Logged in as {bot.user} — slash commands synced.")


@sync_group.command(name="create", description="Create a new Sync plan")
@app_commands.describe(
    name="What's the plan called?",
    description="Optional description",
    location="Optional location",
    budget="Budget for activity suggestions (defaults to Medium)",
)
@app_commands.choices(budget=BUDGET_CHOICES)
async def sync_create(
    interaction: discord.Interaction,
    name: str,
    description: str | None = None,
    location: str | None = None,
    budget: app_commands.Choice[str] | None = None,
):
    await interaction.response.defer()
    plan = await asyncio.to_thread(
        supabase_client.create_plan,
        host_name=interaction.user.display_name,
        name=name,
        description=description,
        location=location,
        budget=budget.value if budget else "medium",
    )

    embed = discord.Embed(
        title=f"🗓️ {plan['name']}",
        description="Share this link so everyone can join and mark when they're free.",
        color=0x111111,
    )
    embed.add_field(name="Invite link", value=plan_url(plan["id"]), inline=False)
    embed.set_footer(text=f"Plan ID: {plan['id']}")
    await interaction.followup.send(embed=embed)


@sync_group.command(name="join", description="Join an existing Sync plan")
@app_commands.describe(plan_id="The plan ID (from /sync create or the invite link)")
async def sync_join(interaction: discord.Interaction, plan_id: str):
    await interaction.response.defer(ephemeral=True)
    try:
        await asyncio.to_thread(
            supabase_client.join_plan,
            plan_id=plan_id,
            name=interaction.user.display_name,
        )
    except PlanNotFoundError:
        await interaction.followup.send(
            "Couldn't find a plan with that ID — double-check it and try again.",
            ephemeral=True,
        )
        return

    await interaction.followup.send(
        f"You're in! Mark your availability here: {plan_url(plan_id)}",
        ephemeral=True,
    )


@sync_group.command(name="status", description="Check a Sync plan's status")
@app_commands.describe(plan_id="The plan ID")
async def sync_status(interaction: discord.Interaction, plan_id: str):
    await interaction.response.defer()
    try:
        bundle = await asyncio.to_thread(supabase_client.get_plan_bundle, plan_id)
    except PlanNotFoundError:
        await interaction.followup.send("Couldn't find a plan with that ID.")
        return

    plan = bundle["plan"]
    members = bundle["members"]
    responded = sum(1 for m in members if m["responded_at"])

    embed = discord.Embed(title=plan["name"], color=0x111111)
    embed.add_field(
        name="Phase", value=PHASE_LABELS.get(plan["status"], plan["status"]), inline=True
    )
    embed.add_field(name="Responded", value=f"{responded}/{len(members)}", inline=True)

    if plan["status"] == "finalized":
        if plan.get("finalized_date"):
            when = plan["finalized_date"]
            if plan.get("finalized_block"):
                when += f" ({plan['finalized_block']})"
            embed.add_field(name="When", value=when, inline=False)
        if plan.get("finalized_activity_name"):
            embed.add_field(name="What", value=plan["finalized_activity_name"], inline=False)
    else:
        embed.add_field(name="Details", value=plan_url(plan["id"]), inline=False)

    await interaction.followup.send(embed=embed)


@sync_group.command(name="link", description="Get a Sync plan's invite link")
@app_commands.describe(plan_id="The plan ID")
async def sync_link(interaction: discord.Interaction, plan_id: str):
    await interaction.response.send_message(plan_url(plan_id))


bot.tree.add_command(sync_group)


if __name__ == "__main__":
    bot.run(DISCORD_BOT_TOKEN)
