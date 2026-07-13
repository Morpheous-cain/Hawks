import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useDashboardMetrics
 * --------------------------------------------
 * Lightweight aggregator hook that runs a set of `count`/`select` queries
 * in parallel and exposes them as named numeric metrics. Designed for the
 * many role dashboards so we don't repeat boilerplate per page.
 *
 * Each spec is `{ key, table, filter? }` and produces `metrics[key]` (number).
 * Subscribes to realtime postgres_changes so dashboards stay live.
 */

type FilterFn = (q: any) => any;

export interface MetricSpec {
  key: string;
  table: string;
  /** Optional chained filter, e.g. q => q.eq('status','open') */
  filter?: FilterFn;
}

export const useDashboardMetrics = (specs: MetricSpec[]) => {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const results = await Promise.all(
        specs.map(async (s) => {
          let q = supabase.from(s.table as any).select("*", { count: "exact", head: true });
          if (s.filter) q = s.filter(q);
          const { count, error } = await q;
          if (error) {
            // RLS denial or missing table — fall back to 0 silently
            return [s.key, 0] as const;
          }
          return [s.key, count ?? 0] as const;
        }),
      );
      setMetrics(Object.fromEntries(results));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load metrics");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(specs.map((s) => [s.key, s.table]))]);

  useEffect(() => {
    void load();
  }, [load]);

  // Lightweight realtime: refresh metrics whenever any tracked table changes.
  useEffect(() => {
    const tables = Array.from(new Set(specs.map((s) => s.table)));
    const channel = supabase
      .channel(`dash_${tables.join("_")}_${Math.random().toString(36).slice(2, 8)}`);
    tables.forEach((t) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: t } as any,
        () => void load(),
      );
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(specs.map((s) => s.table))]);

  return { metrics, loading, error, refresh: load };
};

/**
 * useDashboardRows
 * Fetch a small list (e.g. 5 latest incidents) for a panel.
 */
export const useDashboardRows = <T = any>(
  table: string,
  build: (q: any) => any,
  deps: any[] = [],
) => {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await build(supabase.from(table as any).select("*"));
      if (alive) {
        setRows((data as T[] | null) ?? []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`rows_${table}_${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table } as any,
        async () => {
          const { data } = await build(supabase.from(table as any).select("*"));
          if (alive) setRows((data as T[] | null) ?? []);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { rows, loading };
};
