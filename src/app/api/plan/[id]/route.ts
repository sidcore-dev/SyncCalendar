import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlanBundle } from "@/lib/types";

/**
 * Returns the full data bundle for a plan. Used by the client-side realtime
 * hook to refetch after a postgres_changes event from another member's
 * browser — simpler and more robust than reconciling granular diffs client
 * side, at the cost of an extra round trip per change.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plan, error: planError }, { data: members }, { data: availability }, { data: votes }] =
    await Promise.all([
      supabase.from("plans").select("*").eq("id", id).single(),
      supabase.from("members").select("*").eq("plan_id", id).order("created_at"),
      supabase.from("availability").select("*").eq("plan_id", id),
      supabase.from("votes").select("*").eq("plan_id", id),
    ]);

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const bundle: PlanBundle = {
    plan,
    members: members ?? [],
    availability: availability ?? [],
    votes: votes ?? [],
  };

  return NextResponse.json(bundle);
}
