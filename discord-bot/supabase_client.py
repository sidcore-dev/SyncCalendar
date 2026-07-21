"""Thin wrapper around the same Supabase tables the web app uses.

The bot is a second client against the same schema (see ../supabase/schema.sql) —
it doesn't call the Next.js app at all, it just talks to Postgres directly via
Supabase's REST API, exactly like the browser does. That's why plan/member rows
created here show up instantly in the web UI and vice versa.
"""

import os
from typing import Optional

from supabase import Client, create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]

_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


class PlanNotFoundError(Exception):
    """Raised when a plan_id doesn't match any row in `plans`."""


def create_plan(
    *,
    host_name: str,
    name: str,
    description: Optional[str] = None,
    location: Optional[str] = None,
    budget: str = "medium",
) -> dict:
    plan_res = (
        _client.table("plans")
        .insert(
            {
                "name": name,
                "description": description,
                "location": location,
                "budget": budget,
            }
        )
        .execute()
    )
    plan = plan_res.data[0]

    _client.table("members").insert(
        {"plan_id": plan["id"], "name": host_name, "is_host": True}
    ).execute()

    return plan


def join_plan(*, plan_id: str, name: str) -> dict:
    plan_res = _client.table("plans").select("id").eq("id", plan_id).execute()
    if not plan_res.data:
        raise PlanNotFoundError(plan_id)

    member_res = (
        _client.table("members")
        .insert({"plan_id": plan_id, "name": name, "is_host": False})
        .execute()
    )
    return member_res.data[0]


def get_plan_bundle(plan_id: str) -> dict:
    plan_res = _client.table("plans").select("*").eq("id", plan_id).execute()
    if not plan_res.data:
        raise PlanNotFoundError(plan_id)
    plan = plan_res.data[0]

    members_res = (
        _client.table("members")
        .select("*")
        .eq("plan_id", plan_id)
        .order("created_at")
        .execute()
    )

    return {"plan": plan, "members": members_res.data}
