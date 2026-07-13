import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FieldKpi {
  label: string;
  value: number | string;
  delta?: number;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

/** Reusable KPI fetcher — returns rank-aware metrics from real Supabase data. */
export const useFieldKpis = (rank: string, staffId?: string) => {
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();

      const out: Record<string, number> = {};

      try {
        const { count: incidentsToday } = await (supabase as any)
          .from("incidents")
          .select("id", { count: "exact", head: true })
          .gte("created_at", iso);
        out.incidentsToday = incidentsToday ?? 0;

        const { count: openDispatch } = await (supabase as any)
          .from("dispatch_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "dispatched", "en_route"]);
        out.openDispatch = openDispatch ?? 0;

        const { count: onDuty } = await (supabase as any)
          .from("staff")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");
        out.onDuty = onDuty ?? 0;

        const { count: alarms } = await (supabase as any)
          .from("alarms")
          .select("id", { count: "exact", head: true })
          .gte("created_at", iso);
        out.alarmsToday = alarms ?? 0;

        if (staffId) {
          const { count: myIncidents } = await (supabase as any)
            .from("incidents")
            .select("id", { count: "exact", head: true })
            .eq("reported_by", staffId)
            .gte("created_at", iso);
          out.myIncidents = myIncidents ?? 0;
        }
      } catch (e) { console.warn("[useFieldKpis] error", e); }

      if (!cancelled) { setKpis(out); setLoading(false); }
    };
    load();
    const ch = supabase
      .channel(`field-kpis-${rank}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_requests" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [rank, staffId]);

  return { kpis, loading };
};

export default useFieldKpis;
