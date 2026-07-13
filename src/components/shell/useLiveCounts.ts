import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LiveCounts {
  incidents: number;
  alarms: number;
  isLive: boolean;
}

/**
 * useLiveCounts — single subscription powering badges in the contextual sidebar.
 * Lifted out of ConsoleSidebar so the new shell can reuse it.
 */
export function useLiveCounts(): LiveCounts {
  const [state, setState] = useState<LiveCounts>({
    incidents: 0,
    alarms: 0,
    isLive: false,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      try {
        const [{ count: incidentCount }, { count: alarmCount }] = await Promise.all([
          supabase
            .from("incidents")
            .select("*", { count: "exact", head: true })
            .eq("status", "open"),
          supabase
            .from("alarm_activations")
            .select("*", { count: "exact", head: true })
            .in("status", ["triggered", "dispatched"]),
        ]);
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          incidents: incidentCount ?? 0,
          alarms: alarmCount ?? 0,
        }));
      } catch {
        /* swallow — badges are non-critical */
      }
    };

    fetchCounts();

    const channel = supabase
      .channel("shell-live-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "alarm_activations" }, fetchCounts)
      .subscribe((status) =>
        setState((prev) => ({ ...prev, isLive: status === "SUBSCRIBED" })),
      );

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return state;
}
