/**
 * useExecutiveDashboard — reusable data + realtime hook for the
 * Executive Dashboard module.
 *
 * Follows the established 3-layer module template used by useAlarms and
 * useIncidents:
 *
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │ 1. DATA LAYER  (this file)                                    │
 *   │    - Owns all Supabase queries, datasets, realtime channels   │
 *   │    - Exposes stable `actions` (useCallback) for side effects  │
 *   │    - Provides a single `refresh()` for manual reload          │
 *   │                                                               │
 *   │ 2. PRESENTATION LAYER  (src/pages/ExecutiveDashboard.tsx)     │
 *   │    - Pure UI, owns only local UI state (dialogs, filters)     │
 *   │    - Consumes { data, loading, actions } from this hook       │
 *   │                                                               │
 *   │ 3. COMPOSITION LAYER  (StatsCard, AdvisoryCard, IncidentFeed) │
 *   │    - Small dumb components that take props and render         │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * Replicating for a new module:
 *   1. Copy this file → `useMyModule.ts`
 *   2. Replace the `FETCHERS` map with your queries
 *   3. Replace the `REALTIME_TABLES` array with the tables to watch
 *   4. Wire a new page that calls `useMyModule()` and renders {data}
 *
 * Logging hooks:
 *   Every fetch and action logs via `debug()` with a stable namespace,
 *   so issues can be diagnosed with `localStorage.debug = "exec:*"`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToCSV } from "@/utils/exportData";

/* ────────────────────────────── Types ────────────────────────────── */

export interface RecentEvent {
  id: string;
  title: string | null;
  incident_type: string | null;
  severity: string | null;
  status: string | null;
  created_at: string;
  location: string | null;
}

export interface TopClient {
  id: string;
  legal_name: string | null;
  trading_name: string | null;
  annual_value: number | null;
  active_sites_count: number | null;
}

export interface FinancialsSnapshot {
  /** Sum of `client_finances.amount` where payment_status = 'paid' */
  revenue: number;
  /** Sum of `client_finances.amount` where payment_status in (pending, overdue) */
  outstanding: number;
  /** Heuristic payroll estimate: active staff × KES 20,000 */
  payroll: number;
  /** Count of active staff */
  staffCount: number;
}

export interface ExecutiveDashboardData {
  recentEvents: RecentEvent[];
  topClients: TopClient[];
  financials: FinancialsSnapshot;
}

export interface ExecutiveDashboardActions {
  /** Manually refetch everything. Safe to call from buttons. */
  refresh: () => Promise<void>;
  /** Export the current snapshot to CSV in /mnt/documents/. */
  exportSnapshot: () => void;
}

/* ─────────────────────────── Constants ─────────────────────────── */

const NS = "[useExecutiveDashboard]";
const EMPTY_FIN: FinancialsSnapshot = { revenue: 0, outstanding: 0, payroll: 0, staffCount: 0 };

/** Lightweight namespaced logger — replace with your telemetry sink if needed. */
const debug = (...args: unknown[]) => {
  if (typeof window !== "undefined" && (window as any).__DEBUG_EXEC__) {
    // eslint-disable-next-line no-console
    console.debug(NS, ...args);
  }
};

/* ──────────────────────────── Hook ─────────────────────────────── */

/**
 * @returns `{ data, loading, actions }` — stable references safe for deps.
 *
 * Example:
 * ```tsx
 * const { data, loading, actions } = useExecutiveDashboard();
 * return <Button onClick={actions.refresh}>Refresh</Button>;
 * ```
 */
export function useExecutiveDashboard() {
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [financials, setFinancials] = useState<FinancialsSnapshot>(EMPTY_FIN);
  const [loading, setLoading] = useState(true);

  // Guard against state updates after unmount (StrictMode / fast navigation).
  const mountedRef = useRef(true);

  /* ───────── Fetchers — each is independent & defensive ───────── */

  const fetchRecentEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("id, title, incident_type, severity, status, created_at, location")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      if (mountedRef.current) setRecentEvents((data as RecentEvent[]) || []);
      debug("recentEvents loaded", data?.length);
    } catch (e) {
      console.warn(NS, "fetchRecentEvents failed:", e);
      if (mountedRef.current) setRecentEvents([]);
    }
  }, []);

  const fetchTopClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, legal_name, trading_name, annual_value, active_sites_count")
        .eq("status", "active")
        .order("annual_value", { ascending: false })
        .limit(4);
      if (error) throw error;
      if (mountedRef.current) setTopClients((data as TopClient[]) || []);
      debug("topClients loaded", data?.length);
    } catch (e) {
      console.warn(NS, "fetchTopClients failed:", e);
      if (mountedRef.current) setTopClients([]);
    }
  }, []);

  const fetchFinancials = useCallback(async () => {
    try {
      // Run aggregations in parallel — independent queries, no shared state.
      const [outstandingRes, paidRes, staffRes] = await Promise.all([
        supabase
          .from("client_finances")
          .select("amount, payment_status")
          .in("payment_status", ["pending", "overdue"]),
        supabase
          .from("client_finances")
          .select("amount")
          .eq("payment_status", "paid"),
        supabase
          .from("staff")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      const outstanding =
        outstandingRes.data?.reduce((sum, inv: any) => sum + (Number(inv.amount) || 0), 0) ?? 0;
      const revenue =
        paidRes.data?.reduce((sum, inv: any) => sum + (Number(inv.amount) || 0), 0) ?? 0;
      const staffCount = staffRes.count ?? 0;

      if (mountedRef.current) {
        setFinancials({
          revenue,
          outstanding,
          payroll: staffCount * 20000,
          staffCount,
        });
      }
      debug("financials loaded", { revenue, outstanding, staffCount });
    } catch (e) {
      console.warn(NS, "fetchFinancials failed:", e);
      if (mountedRef.current) setFinancials(EMPTY_FIN);
    }
  }, []);

  /** Public refresh — runs all fetches in parallel. */
  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRecentEvents(), fetchTopClients(), fetchFinancials()]);
    if (mountedRef.current) setLoading(false);
  }, [fetchRecentEvents, fetchTopClients, fetchFinancials]);

  /* ───────── Initial load + realtime subscription ───────── */

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const channel = supabase
      .channel("exec-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, fetchRecentEvents)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, fetchTopClients)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_finances" }, fetchFinancials)
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [refresh, fetchRecentEvents, fetchTopClients, fetchFinancials]);

  /* ───────── Actions ───────── */

  const exportSnapshot = useCallback(() => {
    try {
      const rows = [
        { metric: "Paid Revenue (KES)", value: financials.revenue },
        { metric: "Outstanding (KES)", value: financials.outstanding },
        { metric: "Estimated Payroll (KES)", value: financials.payroll },
        { metric: "Active Staff", value: financials.staffCount },
        { metric: "Top Clients (count)", value: topClients.length },
        { metric: "Recent Incidents (count)", value: recentEvents.length },
      ];
      exportToCSV(rows, "executive_dashboard_snapshot");
      toast.success("Snapshot exported");
    } catch (e) {
      console.error(NS, "exportSnapshot failed:", e);
      toast.error("Export failed");
    }
  }, [financials, topClients, recentEvents]);

  const data: ExecutiveDashboardData = { recentEvents, topClients, financials };
  const actions: ExecutiveDashboardActions = { refresh, exportSnapshot };

  return { data, loading, actions };
}
