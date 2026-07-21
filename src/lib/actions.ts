"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilityStatus, Budget, SlotBlock } from "@/lib/types";

export interface CreatePlanInput {
  hostName: string;
  name: string;
  description?: string;
  location?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  budget?: Budget;
}

export async function createPlan(input: CreatePlanInput) {
  const name = input.name.trim();
  const hostName = input.hostName.trim();
  if (!name) throw new Error("Plan name is required.");
  if (!hostName) throw new Error("Your name is required.");

  const supabase = await createClient();

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      name,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      date_range_start: input.dateRangeStart || null,
      date_range_end: input.dateRangeEnd || null,
      budget: input.budget ?? "medium",
    })
    .select()
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Could not create plan.");
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({ plan_id: plan.id, name: hostName, is_host: true })
    .select()
    .single();

  if (memberError || !member) {
    throw new Error(memberError?.message ?? "Could not add you as host.");
  }

  return { planId: plan.id as string, memberId: member.id as string };
}

export async function joinPlan(input: { planId: string; name: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Your name is required.");

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("members")
    .insert({ plan_id: input.planId, name, is_host: false })
    .select()
    .single();

  if (error || !member) {
    throw new Error(error?.message ?? "Could not join plan.");
  }

  revalidatePath(`/plan/${input.planId}`);
  return { memberId: member.id as string };
}

export async function submitAvailability(input: {
  planId: string;
  memberId: string;
  selections: Record<string, AvailabilityStatus>;
}) {
  const supabase = await createClient();

  await supabase.from("availability").delete().eq("member_id", input.memberId);

  const rows = Object.entries(input.selections).map(([slotId, status]) => ({
    plan_id: input.planId,
    member_id: input.memberId,
    slot_id: slotId,
    status,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("availability").insert(rows);
    if (error) throw new Error(error.message);
  }

  const { error: memberError } = await supabase
    .from("members")
    .update({ responded_at: new Date().toISOString() })
    .eq("id", input.memberId);

  if (memberError) throw new Error(memberError.message);

  revalidatePath(`/plan/${input.planId}`);
}

export async function castVote(input: {
  planId: string;
  memberId: string;
  activityId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("votes")
    .upsert(
      { plan_id: input.planId, member_id: input.memberId, activity_id: input.activityId },
      { onConflict: "plan_id,member_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/plan/${input.planId}`);
}

export async function advanceToVoting(planId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({ status: "voting" })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath(`/plan/${planId}`);
}

export async function backToAvailability(planId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({ status: "collecting_availability" })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath(`/plan/${planId}`);
}

export async function finalizePlan(input: {
  planId: string;
  date: string;
  block: SlotBlock;
  activityId: string;
  activityName: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({
      status: "finalized",
      finalized_date: input.date,
      finalized_block: input.block,
      finalized_activity_id: input.activityId,
      finalized_activity_name: input.activityName,
    })
    .eq("id", input.planId);

  if (error) throw new Error(error.message);
  revalidatePath(`/plan/${input.planId}`);
}
