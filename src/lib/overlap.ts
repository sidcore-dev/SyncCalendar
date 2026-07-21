import { BLOCK_ORDER, generateSlots, type Slot } from "./slots";
import type { AvailabilityRow, Member, SlotBlock } from "./types";

export interface OverlapWindow {
  key: string;
  date: string;
  blocks: SlotBlock[];
  hours: number;
  availableMemberIds: string[];
  busyMemberIds: string[];
  pendingMemberIds: string[];
  score: number;
}

export interface OverlapResult {
  best: OverlapWindow | null;
  alternatives: OverlapWindow[];
  hasAnyOverlap: boolean;
  respondedCount: number;
  totalCount: number;
}

/**
 * Ranks candidate meeting windows by (1) how many people are free and
 * (2) how long the overlap runs — "most people, longest stretch" per the
 * product spec. Adjacent same-day blocks with an identical set of available
 * members are merged into a single window so a full free day scores higher
 * than three disconnected slots would.
 */
export function computeOverlap(
  plan: Parameters<typeof generateSlots>[0],
  members: Member[],
  availability: AvailabilityRow[]
): OverlapResult {
  const slots = generateSlots(plan);
  const respondedIds = new Set(
    members.filter((m) => m.responded_at).map((m) => m.id)
  );
  const pendingIds = members.filter((m) => !m.responded_at).map((m) => m.id);

  const availabilityBySlot = new Map<string, Map<string, "available" | "busy">>();
  for (const row of availability) {
    if (!availabilityBySlot.has(row.slot_id)) {
      availabilityBySlot.set(row.slot_id, new Map());
    }
    availabilityBySlot.get(row.slot_id)!.set(row.member_id, row.status);
  }

  const slotInfo = slots.map((slot) => {
    const statuses = availabilityBySlot.get(slot.id);
    const availableMemberIds: string[] = [];
    const busyMemberIds: string[] = [];
    for (const memberId of respondedIds) {
      const status = statuses?.get(memberId) ?? "busy";
      if (status === "available") availableMemberIds.push(memberId);
      else busyMemberIds.push(memberId);
    }
    return { slot, availableMemberIds, busyMemberIds };
  });

  const byDate = new Map<string, typeof slotInfo>();
  for (const info of slotInfo) {
    if (!byDate.has(info.slot.date)) byDate.set(info.slot.date, []);
    byDate.get(info.slot.date)!.push(info);
  }

  const windows: OverlapWindow[] = [];

  for (const [date, infos] of byDate) {
    infos.sort(
      (a, b) => BLOCK_ORDER.indexOf(a.slot.block) - BLOCK_ORDER.indexOf(b.slot.block)
    );

    let run: typeof infos = [];
    const flush = () => {
      if (run.length === 0) return;
      const availableMemberIds = [...run[0].availableMemberIds].sort();
      const busyMemberIds = [...run[0].busyMemberIds].sort();
      const hours = run.reduce((sum, r) => sum + r.slot.hours, 0);
      windows.push({
        key: `${date}_${run[0].slot.block}-${run[run.length - 1].slot.block}`,
        date,
        blocks: run.map((r) => r.slot.block),
        hours,
        availableMemberIds,
        busyMemberIds,
        pendingMemberIds: pendingIds,
        score: availableMemberIds.length * 1000 + hours,
      });
      run = [];
    };

    for (const info of infos) {
      const key = [...info.availableMemberIds].sort().join(",");
      const runKey = run.length
        ? [...run[0].availableMemberIds].sort().join(",")
        : null;
      if (run.length === 0 || key === runKey) {
        run.push(info);
      } else {
        flush();
        run.push(info);
      }
    }
    flush();
  }

  windows.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));

  const withOverlap = windows.filter((w) => w.availableMemberIds.length > 0);

  return {
    best: withOverlap[0] ?? null,
    alternatives: withOverlap.slice(1, 4),
    hasAnyOverlap: withOverlap.length > 0,
    respondedCount: respondedIds.size,
    totalCount: members.length,
  };
}

export type { Slot };
