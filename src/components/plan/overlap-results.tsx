import { CalendarX2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/plan/status-badge";
import { formatSlotDateLong, BLOCK_META } from "@/lib/slots";
import type { OverlapResult, OverlapWindow } from "@/lib/overlap";
import type { Member } from "@/lib/types";

function windowTimeLabel(window: OverlapWindow) {
  const first = BLOCK_META[window.blocks[0]];
  const last = BLOCK_META[window.blocks[window.blocks.length - 1]];
  const timeRange = first === last ? first.timeLabel : `${first.timeLabel.split(" – ")[0]} – ${last.timeLabel.split(" – ")[1]}`;
  const blockLabel =
    window.blocks.length === 1 ? first.label : `${first.label} – ${last.label}`;
  return `${blockLabel} · ${timeRange}`;
}

function MemberChips({
  ids,
  members,
  variant,
}: {
  ids: string[];
  members: Member[];
  variant: "available" | "busy" | "pending";
}) {
  if (ids.length === 0) return null;
  const names = ids.map((id) => members.find((m) => m.id === id)?.name ?? "?");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {names.map((name, i) => (
        <Badge key={ids[i]} variant={variant} className="font-normal">
          {name}
        </Badge>
      ))}
    </div>
  );
}

function WindowCard({
  window,
  members,
  highlight,
}: {
  window: OverlapWindow;
  members: Member[];
  highlight?: boolean;
}) {
  const total = window.availableMemberIds.length + window.busyMemberIds.length + window.pendingMemberIds.length;
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5"
          : "rounded-2xl border border-neutral-200 bg-white p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={highlight ? "text-lg font-semibold text-neutral-900" : "font-medium text-neutral-800"}>
            {formatSlotDateLong(window.date)}
          </p>
          <p className="text-sm text-neutral-500">{windowTimeLabel(window)}</p>
        </div>
        <Badge variant={highlight ? "default" : "secondary"}>
          {window.availableMemberIds.length}/{total || window.availableMemberIds.length} available
        </Badge>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <MemberChips ids={window.availableMemberIds} members={members} variant="available" />
        <MemberChips ids={window.busyMemberIds} members={members} variant="busy" />
        <MemberChips ids={window.pendingMemberIds} members={members} variant="pending" />
      </div>
    </div>
  );
}

export function OverlapResults({
  overlap,
  members,
}: {
  overlap: OverlapResult;
  members: Member[];
}) {
  if (members.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Sparkles className="size-6 text-neutral-300" />
          <p className="font-medium text-neutral-700">Waiting for friends to join</p>
          <p className="max-w-xs text-sm text-neutral-400">
            Share your invite link — once a few people join and share their availability,
            we&rsquo;ll surface the best time to meet up.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (overlap.respondedCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarX2 className="size-6 text-neutral-300" />
          <p className="font-medium text-neutral-700">No responses yet</p>
          <p className="max-w-xs text-sm text-neutral-400">
            Nobody has shared their availability yet. As soon as they do, overlapping times
            will show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!overlap.hasAnyOverlap || !overlap.best) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarX2 className="size-6 text-neutral-300" />
          <p className="font-medium text-neutral-700">No overlap yet</p>
          <p className="max-w-xs text-sm text-neutral-400">
            {overlap.respondedCount}/{overlap.totalCount} responded, but there&rsquo;s no shared
            free time so far. Try widening the date range, or check back once more people respond.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <WindowCard window={overlap.best} members={members} highlight />
      {overlap.alternatives.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Other options
          </p>
          {overlap.alternatives.map((window) => (
            <WindowCard key={window.key} window={window} members={members} />
          ))}
        </div>
      )}
    </div>
  );
}
