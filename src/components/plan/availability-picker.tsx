"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateSlots, formatSlotDate, BLOCK_ORDER, BLOCK_META } from "@/lib/slots";
import type { Plan, AvailabilityStatus } from "@/lib/types";

export function AvailabilityPicker({
  plan,
  initialSelections,
  onSubmit,
  submitting,
}: {
  plan: Pick<Plan, "date_range_start" | "date_range_end">;
  initialSelections: Record<string, AvailabilityStatus>;
  onSubmit: (selections: Record<string, AvailabilityStatus>) => void;
  submitting: boolean;
}) {
  const slots = useMemo(() => generateSlots(plan), [plan]);
  const dates = useMemo(() => [...new Set(slots.map((s) => s.date))], [slots]);

  const [available, setAvailable] = useState<Set<string>>(
    () =>
      new Set(
        Object.entries(initialSelections)
          .filter(([, status]) => status === "available")
          .map(([slotId]) => slotId)
      )
  );

  const toggle = (slotId: string) => {
    setAvailable((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const handleSubmit = () => {
    const selections: Record<string, AvailabilityStatus> = {};
    for (const slot of slots) {
      selections[slot.id] = available.has(slot.id) ? "available" : "busy";
    }
    onSubmit(selections);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {dates.map((date, i) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-neutral-700 sm:w-32">
              {formatSlotDate(date)}
            </span>
            <div className="flex flex-1 justify-end gap-2">
              {BLOCK_ORDER.map((block) => {
                const slotId = `${date}_${block}`;
                const isOn = available.has(slotId);
                return (
                  <button
                    key={block}
                    type="button"
                    onClick={() => toggle(slotId)}
                    aria-pressed={isOn}
                    className={cn(
                      "flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all duration-150 active:scale-95 sm:flex-none sm:w-24",
                      isOn
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
                    )}
                  >
                    {BLOCK_META[block].label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-center pt-2">
        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="shadow-lg">
          {submitting ? "Saving…" : "Save availability"}
        </Button>
      </div>
    </div>
  );
}
