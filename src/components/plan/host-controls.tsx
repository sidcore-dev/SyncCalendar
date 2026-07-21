"use client";

import { useMemo, useState } from "react";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatSlotDateLong, BLOCK_META } from "@/lib/slots";
import type { OverlapResult } from "@/lib/overlap";
import type { ScoredActivity } from "@/lib/activities";
import type { VoteRow } from "@/lib/types";

export function HostControls({
  phase,
  membersCount,
  overlap,
  activities,
  votes,
  onAdvanceToVoting,
  onFinalize,
  busy,
}: {
  phase: "collecting_availability" | "voting";
  membersCount: number;
  overlap: OverlapResult;
  activities: ScoredActivity[];
  votes: VoteRow[];
  onAdvanceToVoting: () => void;
  onFinalize: (input: { windowKey: string; activityId: string }) => void;
  busy: boolean;
}) {
  const windows = useMemo(
    () => (overlap.best ? [overlap.best, ...overlap.alternatives] : []),
    [overlap]
  );

  const voteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of votes) counts.set(v.activity_id, (counts.get(v.activity_id) ?? 0) + 1);
    return counts;
  }, [votes]);

  const topActivityId = useMemo(() => {
    if (votes.length > 0) {
      return [...voteCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    return activities[0]?.id;
  }, [votes, voteCounts, activities]);

  const [open, setOpen] = useState(false);
  const [windowKey, setWindowKey] = useState<string | undefined>(undefined);
  const [activityId, setActivityId] = useState<string | undefined>(undefined);

  const effectiveWindowKey = windowKey ?? windows[0]?.key;
  const effectiveActivityId = activityId ?? topActivityId;

  if (phase === "collecting_availability") {
    return (
      <Button onClick={onAdvanceToVoting} disabled={busy || membersCount < 2} size="lg">
        Continue to voting
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" disabled={busy || windows.length === 0}>
          <PartyPopper className="size-4" />
          Finalize plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lock it in</DialogTitle>
          <DialogDescription>
            Confirm the time and activity — everyone will see the final plan.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Time</Label>
            <Select value={effectiveWindowKey} onValueChange={setWindowKey}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time" />
              </SelectTrigger>
              <SelectContent>
                {windows.map((w) => (
                  <SelectItem key={w.key} value={w.key}>
                    {formatSlotDateLong(w.date)} · {BLOCK_META[w.blocks[0]].label}
                    {w.blocks.length > 1 ? ` – ${BLOCK_META[w.blocks[w.blocks.length - 1]].label}` : ""}{" "}
                    ({w.availableMemberIds.length} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Activity</Label>
            <Select value={effectiveActivityId} onValueChange={setActivityId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an activity" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((a) => {
                  const count = voteCounts.get(a.id);
                  return (
                    <SelectItem key={a.id} value={a.id}>
                      {a.emoji} {a.name} {count ? `(${count} vote${count === 1 ? "" : "s"})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!effectiveWindowKey || !effectiveActivityId || busy}
            onClick={() => {
              if (!effectiveWindowKey || !effectiveActivityId) return;
              onFinalize({ windowKey: effectiveWindowKey, activityId: effectiveActivityId });
              setOpen(false);
            }}
          >
            Finalize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
