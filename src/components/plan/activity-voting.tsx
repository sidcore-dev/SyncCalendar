"use client";

import { motion } from "framer-motion";
import { Check, DollarSign, TreePine, Building2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoredActivity } from "@/lib/activities";
import type { Member, VoteRow } from "@/lib/types";

const BUDGET_LABEL: Record<string, string> = {
  free: "Free",
  low: "$",
  medium: "$$",
  high: "$$$",
};

const SETTING_ICON = { indoor: Building2, outdoor: TreePine, either: Building2 };

export function ActivityVoting({
  activities,
  votes,
  members,
  currentMemberId,
  onVote,
  disabled,
}: {
  activities: ScoredActivity[];
  votes: VoteRow[];
  members: Member[];
  currentMemberId: string | null;
  onVote: (activityId: string) => void;
  disabled?: boolean;
}) {
  const voteCounts = new Map<string, string[]>();
  for (const vote of votes) {
    const list = voteCounts.get(vote.activity_id) ?? [];
    const member = members.find((m) => m.id === vote.member_id);
    list.push(member?.name ?? "Someone");
    voteCounts.set(vote.activity_id, list);
  }
  const maxVotes = Math.max(0, ...[...voteCounts.values()].map((v) => v.length));
  const myVote = votes.find((v) => v.member_id === currentMemberId)?.activity_id;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {activities.map((activity, i) => {
        const voters = voteCounts.get(activity.id) ?? [];
        const isMine = myVote === activity.id;
        const isLeading = voters.length > 0 && voters.length === maxVotes;
        const SettingIcon = SETTING_ICON[activity.setting];

        return (
          <motion.button
            key={activity.id}
            type="button"
            disabled={disabled}
            onClick={() => onVote(activity.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.98] disabled:opacity-60",
              isMine
                ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                : "border-neutral-200 bg-white hover:border-neutral-300"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{activity.emoji}</span>
                <span className="font-semibold">{activity.name}</span>
              </div>
              {isMine && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="size-3.5" />
                </span>
              )}
            </div>
            <p className={cn("text-sm", isMine ? "text-neutral-300" : "text-neutral-500")}>
              {activity.description}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  isMine ? "bg-white/10 text-neutral-200" : "bg-neutral-100 text-neutral-500"
                )}
              >
                <DollarSign className="size-3" />
                {BUDGET_LABEL[activity.budget]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                  isMine ? "bg-white/10 text-neutral-200" : "bg-neutral-100 text-neutral-500"
                )}
              >
                <SettingIcon className="size-3" />
                {activity.setting}
              </span>
              {isLeading && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    isMine ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"
                  )}
                >
                  <Trophy className="size-3" />
                  Leading
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className={cn("text-xs", isMine ? "text-neutral-300" : "text-neutral-400")}>
                {voters.length === 0
                  ? "No votes yet"
                  : `${voters.length} vote${voters.length === 1 ? "" : "s"}`}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
