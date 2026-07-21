import { addDays, format, parseISO } from "date-fns";
import type { Plan, SlotBlock } from "./types";

export interface Slot {
  id: string;
  date: string;
  block: SlotBlock;
  label: string;
  timeLabel: string;
  hours: number;
}

export const BLOCK_ORDER: SlotBlock[] = ["morning", "afternoon", "evening"];

export const BLOCK_META: Record<
  SlotBlock,
  { label: string; timeLabel: string; hours: number; short: string }
> = {
  morning: { label: "Morning", timeLabel: "8 – 11am", hours: 4, short: "AM" },
  afternoon: { label: "Afternoon", timeLabel: "12 – 4pm", hours: 5, short: "PM" },
  evening: { label: "Evening", timeLabel: "5 – 9pm", hours: 4, short: "Eve" },
};

/** 24-hour start/end for each block — the actual wall-clock range behind BLOCK_META's labels. */
export const BLOCK_HOURS: Record<SlotBlock, { start: number; end: number }> = {
  morning: { start: 8, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
};

/** Availability grids default to a 14-day window when a plan has no explicit date range. */
export const DEFAULT_WINDOW_DAYS = 14;
/** Hard cap so a huge custom date range can't blow up the grid / overlap computation. */
const MAX_WINDOW_DAYS = 30;

export function getSlotDates(
  plan: Pick<Plan, "date_range_start" | "date_range_end">
): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = plan.date_range_start ? parseISO(plan.date_range_start) : today;
  let end = plan.date_range_end
    ? parseISO(plan.date_range_end)
    : addDays(start, DEFAULT_WINDOW_DAYS - 1);

  const maxEnd = addDays(start, MAX_WINDOW_DAYS - 1);
  if (end > maxEnd) end = maxEnd;
  if (end < start) end = start;

  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function generateSlots(
  plan: Pick<Plan, "date_range_start" | "date_range_end">
): Slot[] {
  const dates = getSlotDates(plan);
  const slots: Slot[] = [];
  for (const date of dates) {
    for (const block of BLOCK_ORDER) {
      const meta = BLOCK_META[block];
      slots.push({
        id: `${date}_${block}`,
        date,
        block,
        label: meta.label,
        timeLabel: meta.timeLabel,
        hours: meta.hours,
      });
    }
  }
  return slots;
}

export function formatSlotDate(date: string) {
  return format(parseISO(date), "EEE, MMM d");
}

export function formatSlotDateLong(date: string) {
  return format(parseISO(date), "EEEE, MMMM d");
}
