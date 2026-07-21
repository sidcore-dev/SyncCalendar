"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanStatus } from "@/lib/types";

const STEPS = ["Create", "Invite", "Availability", "Vote", "Done"] as const;

function stepIndexForStatus(status: PlanStatus): number {
  switch (status) {
    case "collecting_availability":
      return 2;
    case "voting":
      return 3;
    case "finalized":
      return 4;
  }
}

export function ProgressSteps({ status }: { status: PlanStatus }) {
  const activeIndex = stepIndexForStatus(status);

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < activeIndex || status === "finalized";
          const active = i === activeIndex && status !== "finalized";
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-300 sm:size-8",
                    done && "border-neutral-900 bg-neutral-900 text-white",
                    active && "border-neutral-900 bg-white text-neutral-900",
                    !done && !active && "border-neutral-200 bg-white text-neutral-300"
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium sm:block",
                    done || active ? "text-neutral-900" : "text-neutral-300"
                  )}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-1.5 h-px flex-1 bg-neutral-200 sm:mx-2">
                  <motion.div
                    className="h-px bg-neutral-900"
                    initial={false}
                    animate={{ width: i < activeIndex || status === "finalized" ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
