"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { MapPin, CalendarPlus, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberList } from "@/components/plan/member-list";
import { formatSlotDateLong, BLOCK_META } from "@/lib/slots";
import { buildGoogleCalendarUrl, downloadICS } from "@/lib/calendar";
import type { Member, Plan, SlotBlock } from "@/lib/types";

export function FinalizedView({ plan, members }: { plan: Plan; members: Member[] }) {
  useEffect(() => {
    const flag = `sync:confetti:${plan.id}`;
    if (typeof window === "undefined" || window.sessionStorage.getItem(flag)) return;
    window.sessionStorage.setItem(flag, "1");

    const duration = 1400;
    const end = Date.now() + duration;
    const colors = ["#111827", "#8b5cf6", "#10b981", "#f59e0b"];

    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [plan.id]);

  const block = plan.finalized_block as SlotBlock | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-700 px-6 py-8 text-center text-white sm:px-8 sm:py-10">
          <p className="text-sm font-medium text-neutral-300">It&rsquo;s official</p>
          <div className="mt-2 text-5xl">
            {plan.finalized_activity_name ? "🎉" : "🎉"}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{plan.name}</h2>
        </div>
        <CardContent className="flex flex-col gap-5 pt-6">
          {plan.finalized_date && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                When
              </p>
              <p className="mt-1 text-lg font-medium text-neutral-900">
                {formatSlotDateLong(plan.finalized_date)}
              </p>
              {block && (
                <p className="text-sm text-neutral-500">
                  {BLOCK_META[block].label} · {BLOCK_META[block].timeLabel}
                </p>
              )}
            </div>
          )}

          {plan.finalized_activity_name && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                What
              </p>
              <p className="mt-1 text-lg font-medium text-neutral-900">
                {plan.finalized_activity_name}
              </p>
            </div>
          )}

          {plan.location && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Where
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-neutral-700">
                <MapPin className="size-4 text-neutral-400" />
                {plan.location}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Who&rsquo;s in ({members.length})
            </p>
            <MemberList members={members} />
          </div>

          {(() => {
            const googleUrl = buildGoogleCalendarUrl(plan);
            if (!googleUrl) return null;
            return (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Add to calendar
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                      <CalendarPlus className="size-3.5" />
                      Google Calendar
                    </a>
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => downloadICS(plan)}>
                    <Download className="size-3.5" />
                    Apple Calendar (.ics)
                  </Button>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </motion.div>
  );
}
