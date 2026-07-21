"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlanBundle } from "@/lib/types";

/**
 * Keeps a plan's data bundle fresh across every open browser tab. Subscribes
 * to Postgres changes for this plan's rows and refetches the full bundle
 * (debounced) whenever anything changes — simplest approach that scales fine
 * at MVP group sizes, and leaves room to swap in granular patches later.
 */
export function usePlanRealtime(planId: string, initialBundle: PlanBundle) {
  const [bundle, setBundle] = useState(initialBundle);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBundle(initialBundle);
    // Only reset when the plan identity changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    const supabase = createClient();

    const refetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/plan/${planId}`, { cache: "no-store" });
          if (res.ok) setBundle(await res.json());
        } catch {
          // Best-effort: a missed realtime refresh just means slightly stale
          // data until the next event or manual action.
        }
      }, 250);
    };

    const channel = supabase
      .channel(`plan:${planId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans", filter: `id=eq.${planId}` },
        refetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `plan_id=eq.${planId}` },
        refetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability", filter: `plan_id=eq.${planId}` },
        refetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `plan_id=eq.${planId}` },
        refetch
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [planId]);

  return { bundle, setBundle };
}
