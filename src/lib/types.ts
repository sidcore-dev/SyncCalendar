// Core domain types shared across the app. Mirrors supabase/schema.sql.

export type PlanStatus = "collecting_availability" | "voting" | "finalized";

export type Budget = "free" | "low" | "medium" | "high";

export type SlotBlock = "morning" | "afternoon" | "evening";

export type AvailabilityStatus = "available" | "busy";

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  budget: Budget;
  status: PlanStatus;
  finalized_date: string | null;
  finalized_block: SlotBlock | null;
  finalized_activity_id: string | null;
  finalized_activity_name: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  plan_id: string;
  name: string;
  is_host: boolean;
  responded_at: string | null;
  created_at: string;
}

export interface AvailabilityRow {
  id: string;
  plan_id: string;
  member_id: string;
  slot_id: string;
  status: AvailabilityStatus;
  created_at: string;
}

export interface VoteRow {
  id: string;
  plan_id: string;
  member_id: string;
  activity_id: string;
  created_at: string;
}

/** Full bundle used to hydrate the plan page, client-side state, and the realtime refetch route. */
export interface PlanBundle {
  plan: Plan;
  members: Member[];
  availability: AvailabilityRow[];
  votes: VoteRow[];
}

/** What's stored in localStorage so a member can return to a plan without an account. */
export interface MemberSession {
  memberId: string;
  planId: string;
  name: string;
  isHost: boolean;
}
