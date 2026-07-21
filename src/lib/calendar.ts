import { BLOCK_HOURS } from "./slots";
import type { Plan } from "./types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Wall-clock start/end Date objects for the plan's finalized date + block, or null if not finalized. */
export function getFinalizedEventTimes(
  plan: Pick<Plan, "finalized_date" | "finalized_block">
): { start: Date; end: Date } | null {
  if (!plan.finalized_date || !plan.finalized_block) return null;
  const [year, month, day] = plan.finalized_date.split("-").map(Number);
  const { start: startHour, end: endHour } = BLOCK_HOURS[plan.finalized_block];
  return {
    start: new Date(year, month - 1, day, startHour, 0, 0),
    end: new Date(year, month - 1, day, endHour, 0, 0),
  };
}

function eventDetails(plan: Plan) {
  return [plan.finalized_activity_name, plan.description].filter(Boolean).join(" — ");
}

function toGoogleDateString(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours()
  )}${pad(date.getMinutes())}00`;
}

/** Opens Google's own "add event" page prefilled — no auth/API key needed, user still confirms on Google's side. */
export function buildGoogleCalendarUrl(plan: Plan): string | null {
  const times = getFinalizedEventTimes(plan);
  if (!times) return null;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: plan.name,
    dates: `${toGoogleDateString(times.start)}/${toGoogleDateString(times.end)}`,
    details: eventDetails(plan),
    location: plan.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toICSDateString(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours()
  )}${pad(date.getMinutes())}00`;
}

function icsEscape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** Universal .ics file — imports into Apple Calendar, Outlook, or any other calendar app. */
export function buildICS(plan: Plan): string | null {
  const times = getFinalizedEventTimes(plan);
  if (!times) return null;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sync//Plan//EN",
    "BEGIN:VEVENT",
    `UID:${plan.id}@sync.app`,
    `DTSTAMP:${toICSDateString(new Date())}`,
    `DTSTART:${toICSDateString(times.start)}`,
    `DTEND:${toICSDateString(times.end)}`,
    `SUMMARY:${icsEscape(plan.name)}`,
    plan.location ? `LOCATION:${icsEscape(plan.location)}` : null,
    `DESCRIPTION:${icsEscape(eventDetails(plan))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.join("\r\n");
}

export function downloadICS(plan: Plan) {
  const ics = buildICS(plan);
  if (!ics) return;

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "plan"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
