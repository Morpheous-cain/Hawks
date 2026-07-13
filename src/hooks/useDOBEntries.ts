/**
 * useDOBEntries — reusable data hook for the Digital Occurrence Book.
 *
 * This hook is the canonical pattern for new operational modules in
 * Black Hawk SOC-OS. It owns one slice of Supabase data end-to-end:
 *
 *   1. Fetch (with abort-on-unmount)
 *   2. Realtime subscription (with cleanup)
 *   3. CRUD (create / update / delete) with optimistic toast feedback
 *   4. Derived stats + filtering memoised once at the hook level
 *
 * UI components stay dumb — they render `entries`, call `actions.create()`,
 * and never touch Supabase directly. To replicate this pattern for another
 * module (e.g. an Equipment Issuance log, Visitor Book, etc.) copy this
 * file, change the table name + the row→row mapper, and you're done.
 *
 * @module hooks/useDOBEntries
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

/** Canonical UI-shaped occurrence-book entry. */
export interface DOBEntry {
  id: string;
  entryNo: string;
  date: string;
  time: string;
  entryTime: string;          // ISO timestamp — used for sorting & filtering
  officer: string;
  nature: string;
  signature: string;
  remarks: string;
  type: DOBEntryType;
  rawType: string;            // original DB value (for round-tripping edits)
  site: string;
}

export type DOBEntryType =
  | "taking_over"
  | "handover"
  | "closing"
  | "opening"
  | "late_entry"
  | "incident"
  | "normal"
  | "supervisor_patrol";

/** Display config used by every consumer (table, stat cards, filters). */
export const DOB_TYPE_CONFIG: Record<DOBEntryType, { label: string; color: string; dbValue: string }> = {
  taking_over:       { label: "Taking Over",       color: "bg-blue-500/20 text-blue-400 border-blue-400/30",     dbValue: "Taking Over" },
  handover:          { label: "Handover",          color: "bg-purple-500/20 text-purple-400 border-purple-400/30", dbValue: "Handover" },
  closing:           { label: "Midnight Closing",  color: "bg-orange-500/20 text-orange-400 border-orange-400/30", dbValue: "Midnight Closing" },
  opening:           { label: "Opening",           color: "bg-green-500/20 text-green-400 border-green-400/30",  dbValue: "Opening" },
  late_entry:        { label: "Late Entry",        color: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30", dbValue: "Late Entry of OB" },
  incident:          { label: "Incident",          color: "bg-red-500/20 text-red-400 border-red-400/30",       dbValue: "Incident" },
  normal:            { label: "Normal Occurrence", color: "bg-slate-500/20 text-slate-400 border-slate-400/30", dbValue: "Normal Occurrence" },
  supervisor_patrol: { label: "Supervisor Patrol", color: "bg-cyan-500/20 text-cyan-400 border-cyan-400/30",    dbValue: "Supervisor Patrol" },
};

const DB_TO_UI: Record<string, DOBEntryType> = Object.fromEntries(
  (Object.entries(DOB_TYPE_CONFIG) as [DOBEntryType, { dbValue: string }][])
    .map(([ui, cfg]) => [cfg.dbValue, ui])
) as Record<string, DOBEntryType>;

/** Map raw DB row → UI row. Kept pure so it's trivially unit-testable. */
function mapRow(row: any, index: number, total: number): DOBEntry {
  const d = new Date(row.entry_time);
  const ui = DB_TO_UI[row.entry_type] ?? "normal";
  // Newest first → highest entry number (matches the user's mental model).
  const entryNo = String(total - index).padStart(3, "0");
  return {
    id: row.id,
    entryNo,
    date: format(d, "dd/MM/yyyy"),
    time: format(d, "HH:mm"),
    entryTime: row.entry_time,
    officer: row.description?.match(/Officer:\s*([^|]+)/)?.[1]?.trim() || "Officer on Duty",
    nature: row.description ?? "",
    signature: "(Signed)",
    remarks: row.entry_type,
    type: ui,
    rawType: row.entry_type,
    site: row.site_name ?? "",
  };
}

/** Filter knobs surfaced to the UI. All are optional / safe to leave blank. */
export interface DOBFilters {
  search?: string;
  type?: DOBEntryType | "all";
  from?: string;  // ISO date (yyyy-MM-dd)
  to?: string;    // ISO date (yyyy-MM-dd)
}

export interface DOBCreateInput {
  entryType: DOBEntryType;
  description: string;
  siteName: string;
  entryTime?: string; // ISO; defaults to now()
}

export interface DOBUpdateInput {
  entryType?: DOBEntryType;
  description?: string;
  siteName?: string;
  entryTime?: string;
}

/**
 * Main hook. Stable identity for `actions` so consumers can pass them down
 * without triggering unnecessary re-renders.
 */
export function useDOBEntries(filters: DOBFilters = {}) {
  const [entries, setEntries] = useState<DOBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  /** Fetch — excludes the two "satellite" panels (Operations Team / Field Ops). */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("dob_entries")
        .select("*")
        .is("deleted_at", null)
        .not("site_name", "ilike", "%Operations Team%")
        .not("site_name", "ilike", "%Field Ops%")
        .order("entry_time", { ascending: false });
      if (error) throw error;
      if (!mounted.current) return;
      const rows = data ?? [];
      setEntries(rows.map((r, i) => mapRow(r, i, rows.length)));
    } catch (e: any) {
      if (!mounted.current) return;
      setError(e?.message ?? "Failed to load entries");
      console.error("[useDOBEntries] fetch failed", e);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // Initial load + realtime subscription. Re-fetch is debounced by a single
  // RAF so a burst of inserts only triggers one re-render.
  useEffect(() => {
    mounted.current = true;
    fetchEntries();
    let raf = 0;
    const channel = supabase
      .channel("dob-entries-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "dob_entries" }, () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => fetchEntries());
      })
      .subscribe();
    return () => {
      mounted.current = false;
      cancelAnimationFrame(raf);
      supabase.removeChannel(channel);
    };
  }, [fetchEntries]);

  /** CRUD actions — stable identity. */
  const actions = useMemo(() => ({
    create: async (input: DOBCreateInput) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const dbType = DOB_TYPE_CONFIG[input.entryType].dbValue;
      const { error } = await supabase.from("dob_entries").insert({
        entry_type: dbType,
        description: input.description,
        site_name: input.siteName,
        recorded_by: user.user.id,
        entry_time: input.entryTime ?? new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "Entry created", description: "OB entry has been logged." });
    },
    update: async (id: string, input: DOBUpdateInput) => {
      const patch: Record<string, unknown> = {};
      if (input.entryType) patch.entry_type = DOB_TYPE_CONFIG[input.entryType].dbValue;
      if (input.description !== undefined) patch.description = input.description;
      if (input.siteName !== undefined) patch.site_name = input.siteName;
      if (input.entryTime) patch.entry_time = input.entryTime;
      const { error } = await supabase.from("dob_entries").update(patch).eq("id", id);
      if (error) throw error;
      toast({ title: "Entry updated", description: "Changes saved." });
    },
    remove: async (id: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("dob_entries")
        .update({ deleted_at: new Date().toISOString(), deleted_by: userRes.user?.id ?? null })
        .eq("id", id)
        .is("deleted_at", null);
      if (error) throw error;
      toast({ title: "Entry deleted", variant: "destructive" });
    },
    removeMany: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("dob_entries")
        .update({ deleted_at: new Date().toISOString(), deleted_by: userRes.user?.id ?? null })
        .in("id", ids)
        .is("deleted_at", null);
      if (error) throw error;
      toast({ title: `${ids.length} entries deleted`, variant: "destructive" });
    },
    refresh: fetchEntries,
  }), [fetchEntries]);

  /** Derived: filtered list driven by the `filters` argument. */
  const filtered = useMemo(() => {
    const q = (filters.search ?? "").trim().toLowerCase();
    const fromTs = filters.from ? new Date(filters.from + "T00:00:00").getTime() : null;
    const toTs   = filters.to   ? new Date(filters.to   + "T23:59:59").getTime() : null;
    return entries.filter((e) => {
      if (filters.type && filters.type !== "all" && e.type !== filters.type) return false;
      if (fromTs && new Date(e.entryTime).getTime() < fromTs) return false;
      if (toTs   && new Date(e.entryTime).getTime() > toTs)   return false;
      if (!q) return true;
      return (
        e.entryNo.toLowerCase().includes(q) ||
        e.officer.toLowerCase().includes(q) ||
        e.nature.toLowerCase().includes(q) ||
        e.site.toLowerCase().includes(q)
      );
    });
  }, [entries, filters.search, filters.type, filters.from, filters.to]);

  /** Real stats from the actual data — no placeholder percentages. */
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last24 = Date.now() - 24 * 60 * 60 * 1000;
    let todayTotal = 0;
    let last24Total = 0;
    let critical = 0;
    let handovers = 0;
    for (const e of entries) {
      const ts = new Date(e.entryTime).getTime();
      if (ts >= today.getTime()) todayTotal++;
      if (ts >= last24) last24Total++;
      if (e.type === "incident") critical++;
      if (e.type === "handover" || e.type === "taking_over") handovers++;
    }
    return { todayTotal, last24Total, critical, handovers, total: entries.length };
  }, [entries]);

  return { entries: filtered, allEntries: entries, loading, error, stats, actions };
}

export default useDOBEntries;
