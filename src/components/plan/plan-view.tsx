"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, CalendarRange, Pencil } from "lucide-react";
import { usePlanRealtime } from "@/hooks/use-plan-realtime";
import { getMemberSession, setMemberSession } from "@/lib/member-session";
import { submitAvailability, castVote, advanceToVoting, finalizePlan } from "@/lib/actions";
import { computeOverlap } from "@/lib/overlap";
import { scoreActivities } from "@/lib/activities";
import { formatSlotDate } from "@/lib/slots";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressSteps } from "@/components/plan/progress-steps";
import { JoinGate } from "@/components/plan/join-gate";
import { ResponseCounter } from "@/components/plan/response-counter";
import { MemberList } from "@/components/plan/member-list";
import { CopyLinkButton } from "@/components/plan/copy-link-button";
import { AvailabilityPicker } from "@/components/plan/availability-picker";
import { OverlapResults } from "@/components/plan/overlap-results";
import { ActivityVoting } from "@/components/plan/activity-voting";
import { FinalizedView } from "@/components/plan/finalized-view";
import { HostControls } from "@/components/plan/host-controls";
import type { AvailabilityStatus, MemberSession, PlanBundle } from "@/lib/types";

export function PlanView({ initialBundle }: { initialBundle: PlanBundle }) {
  const { bundle } = usePlanRealtime(initialBundle.plan.id, initialBundle);
  const { plan, members, availability, votes } = bundle;

  const [session, setSession] = useState<MemberSession | null | undefined>(undefined);
  useEffect(() => {
    setSession(getMemberSession(plan.id) ?? null);
  }, [plan.id]);

  const [editingAvailability, setEditingAvailability] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [votingBusy, setVotingBusy] = useState(false);
  const [hostBusy, setHostBusy] = useState(false);

  const overlap = useMemo(
    () => computeOverlap(plan, members, availability),
    [plan, members, availability]
  );
  const activities = useMemo(
    () =>
      scoreActivities({
        groupSize: members.length,
        budget: plan.budget,
        bestWindow: overlap.best,
      }).slice(0, 6),
    [members.length, plan.budget, overlap.best]
  );

  if (session === undefined) return <PlanSkeleton />;

  if (session === null) {
    return (
      <JoinGate
        plan={plan}
        onJoined={(memberId, name) => {
          const next: MemberSession = { memberId, planId: plan.id, name, isHost: false };
          setMemberSession(next);
          setSession(next);
        }}
      />
    );
  }

  const currentMember = members.find((m) => m.id === session.memberId) ?? null;
  const isHost = session.isHost;
  const respondedCount = members.filter((m) => m.responded_at).length;

  const myAvailability: Record<string, AvailabilityStatus> = {};
  if (currentMember) {
    for (const row of availability) {
      if (row.member_id === currentMember.id) myAvailability[row.slot_id] = row.status;
    }
  }

  const handleSaveAvailability = async (selections: Record<string, AvailabilityStatus>) => {
    setSavingAvailability(true);
    try {
      await submitAvailability({ planId: plan.id, memberId: session.memberId, selections });
      setEditingAvailability(false);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleVote = async (activityId: string) => {
    setVotingBusy(true);
    try {
      await castVote({ planId: plan.id, memberId: session.memberId, activityId });
    } finally {
      setVotingBusy(false);
    }
  };

  const handleAdvanceToVoting = async () => {
    setHostBusy(true);
    try {
      await advanceToVoting(plan.id);
    } finally {
      setHostBusy(false);
    }
  };

  const handleFinalize = async ({
    windowKey,
    activityId,
  }: {
    windowKey: string;
    activityId: string;
  }) => {
    const window = [overlap.best, ...overlap.alternatives].find((w) => w?.key === windowKey);
    const activity = activities.find((a) => a.id === activityId);
    if (!window || !activity) return;
    setHostBusy(true);
    try {
      await finalizePlan({
        planId: plan.id,
        date: window.date,
        block: window.blocks[0],
        activityId: activity.id,
        activityName: `${activity.emoji} ${activity.name}`,
      });
    } finally {
      setHostBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {plan.name}
            </h1>
            {plan.description && <p className="mt-1 text-neutral-500">{plan.description}</p>}
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-neutral-500">
              {plan.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {plan.location}
                </span>
              )}
              {(plan.date_range_start || plan.date_range_end) && (
                <span className="flex items-center gap-1">
                  <CalendarRange className="size-3.5" />
                  {plan.date_range_start && formatSlotDate(plan.date_range_start)}
                  {plan.date_range_start && plan.date_range_end && " – "}
                  {plan.date_range_end && formatSlotDate(plan.date_range_end)}
                </span>
              )}
            </div>
          </div>
          {plan.status !== "finalized" && <CopyLinkButton planId={plan.id} />}
        </div>
        <ProgressSteps status={plan.status} />
      </header>

      {plan.status === "finalized" ? (
        <FinalizedView plan={plan} members={members} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ResponseCounter responded={respondedCount} total={members.length} />
            <MemberList members={members} />
          </div>

          {plan.status === "collecting_availability" && (
            <section className="flex flex-col gap-4">
              {currentMember?.responded_at && !editingAvailability ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-700">
                    You&rsquo;re all set — we&rsquo;ll show the best time below as others respond.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setEditingAvailability(true)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                </div>
              ) : (
                <AvailabilityPicker
                  plan={plan}
                  initialSelections={myAvailability}
                  onSubmit={handleSaveAvailability}
                  submitting={savingAvailability}
                />
              )}

              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-700">Best times so far</p>
                <OverlapResults overlap={overlap} members={members} />
              </div>

              {isHost && (
                <div className="flex justify-center pt-2">
                  <HostControls
                    phase="collecting_availability"
                    membersCount={members.length}
                    overlap={overlap}
                    activities={activities}
                    votes={votes}
                    onAdvanceToVoting={handleAdvanceToVoting}
                    onFinalize={() => {}}
                    busy={hostBusy}
                  />
                </div>
              )}
            </section>
          )}

          {plan.status === "voting" && (
            <section className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-700">Locking in a time</p>
                <OverlapResults overlap={overlap} members={members} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-700">Vote on an activity</p>
                <ActivityVoting
                  activities={activities}
                  votes={votes}
                  members={members}
                  currentMemberId={session.memberId}
                  onVote={handleVote}
                  disabled={votingBusy}
                />
              </div>
              {isHost && (
                <div className="flex justify-center pt-2">
                  <HostControls
                    phase="voting"
                    membersCount={members.length}
                    overlap={overlap}
                    activities={activities}
                    votes={votes}
                    onAdvanceToVoting={() => {}}
                    onFinalize={handleFinalize}
                    busy={hostBusy}
                  />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-8 h-40 w-full" />
    </div>
  );
}
