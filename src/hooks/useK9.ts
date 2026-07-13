/**
 * useK9 — Single source of truth for the K9 Management System.
 *
 * Architectural pattern (replicated from useCMC):
 *   1. ONE hook owns fetch + realtime + write actions for the whole module.
 *   2. UI components only render hook state and call hook actions.
 *   3. All writes are persisted, all reads are realtime.
 *
 * To replicate for another module:
 *   - Copy this file, swap table names + types.
 *   - Keep the `{ data, loading, error, actions }` return contract.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/utils/auditLog";

const sb = supabase as any; // tables not yet in generated types

// ---------- TYPES ----------
export type K9Unit = {
  id: string;
  k9_id: string;
  name: string;
  breed?: string;
  specialty?: string;
  status: "available" | "deployed" | "rest" | "medical" | "training";
  health_status: "excellent" | "good" | "fair" | "poor";
  current_location?: string | null;
  last_vet_check?: string | null;
  next_vet_check?: string | null;
  total_deployments?: number;
  handler_id?: string | null;
  staff?: { full_name?: string } | null;
};

export type K9Deployment = {
  id: string;
  deployment_number: string;
  k9_unit_id: string;
  handler_id?: string | null;
  site_name: string;
  purpose: string;
  status: "scheduled" | "active" | "completed" | "aborted";
  started_at: string;
  ended_at?: string | null;
  duration_minutes?: number | null;
  outcome?: string | null;
  finds_count: number;
  notes?: string | null;
};

export type K9HealthRecord = {
  id: string;
  k9_unit_id: string;
  record_type: "checkup" | "vaccination" | "treatment" | "injury" | "dental" | "grooming";
  vet_name?: string | null;
  performed_at: string;
  diagnosis?: string | null;
  treatment?: string | null;
  medications?: string | null;
  next_due_at?: string | null;
  cost?: number | null;
};

export type K9TrainingRecord = {
  id: string;
  k9_unit_id: string;
  session_type: string;
  instructor?: string | null;
  performed_at: string;
  duration_minutes?: number | null;
  score?: number | null;
  pass: boolean;
  notes?: string | null;
};

export type K9Incident = {
  id: string;
  k9_unit_id: string;
  deployment_id?: string | null;
  incident_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location?: string | null;
  occurred_at: string;
};

// ---------- HOOK ----------
export function useK9(unitFilter?: string) {
  const [units, setUnits] = useState<K9Unit[]>([]);
  const [deployments, setDeployments] = useState<K9Deployment[]>([]);
  const [health, setHealth] = useState<K9HealthRecord[]>([]);
  const [training, setTraining] = useState<K9TrainingRecord[]>([]);
  const [incidents, setIncidents] = useState<K9Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [u, d, h, t, i] = await Promise.all([
        sb.from("k9_units").select("*, staff:handler_id(full_name)").order("created_at", { ascending: false }),
        sb.from("k9_deployments").select("*").order("started_at", { ascending: false }).limit(200),
        sb.from("k9_health_records").select("*").order("performed_at", { ascending: false }).limit(200),
        sb.from("k9_training_records").select("*").order("performed_at", { ascending: false }).limit(200),
        sb.from("k9_incidents").select("*").order("occurred_at", { ascending: false }).limit(200),
      ]);
      setUnits(u.data ?? []);
      setDeployments(d.data ?? []);
      setHealth(h.data ?? []);
      setTraining(t.data ?? []);
      setIncidents(i.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load K9 data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel("k9-module")
      .on("postgres_changes", { event: "*", schema: "public", table: "k9_units" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "k9_deployments" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "k9_health_records" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "k9_training_records" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "k9_incidents" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // ---------- ACTIONS ----------

  /** Change a unit's status (used by quick action buttons on each card). */
  const setUnitStatus = useCallback(async (unitId: string, status: K9Unit["status"]) => {
    const { error } = await sb.from("k9_units").update({ status }).eq("id", unitId);
    if (error) throw error;
    await logAudit({ module: "k9", action: "K9_STATUS_CHANGED", recordId: unitId, changes: { status } });
  }, []);

  /** Update an arbitrary unit field (used by drawer edits). */
  const updateUnit = useCallback(async (unitId: string, patch: Partial<K9Unit>) => {
    const { error } = await sb.from("k9_units").update(patch).eq("id", unitId);
    if (error) throw error;
    await logAudit({ module: "k9", action: "K9_UPDATED", recordId: unitId, changes: patch });
  }, []);

  /** Soft-aware delete (RLS limits to elevated users). */
  const deleteUnit = useCallback(async (unitId: string) => {
    const { error } = await sb.from("k9_units").delete().eq("id", unitId);
    if (error) throw error;
    await logAudit({ module: "k9", action: "K9_DELETED", recordId: unitId });
  }, []);

  /** Start a new deployment + auto-flip unit to 'deployed'. */
  const deployUnit = useCallback(async (payload: {
    k9_unit_id: string;
    handler_id?: string | null;
    site_name: string;
    purpose: string;
    notes?: string;
  }) => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await sb.from("k9_deployments").insert({
      ...payload,
      status: "active",
      created_by: u.user?.id,
    }).select().single();
    if (error) throw error;
    await sb.from("k9_units").update({
      status: "deployed",
      current_location: payload.site_name,
    }).eq("id", payload.k9_unit_id);
    await logAudit({ module: "k9", action: "K9_DEPLOYED", recordId: payload.k9_unit_id, changes: payload });
    return data as K9Deployment;
  }, []);

  /** Complete (recall) an active deployment. */
  const completeDeployment = useCallback(async (deploymentId: string, outcome: string, finds: number) => {
    const { error } = await sb.from("k9_deployments").update({
      status: "completed",
      ended_at: new Date().toISOString(),
      outcome,
      finds_count: finds,
    }).eq("id", deploymentId);
    if (error) throw error;
    await logAudit({ module: "k9", action: "K9_RECALLED", recordId: deploymentId, changes: { outcome, finds } });
  }, []);

  /** Abort a deployment without success metrics. */
  const abortDeployment = useCallback(async (deploymentId: string, reason: string) => {
    const { error } = await sb.from("k9_deployments").update({
      status: "aborted",
      ended_at: new Date().toISOString(),
      outcome: `ABORTED: ${reason}`,
    }).eq("id", deploymentId);
    if (error) throw error;
  }, []);

  const logHealth = useCallback(async (rec: Omit<K9HealthRecord, "id">) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("k9_health_records").insert({ ...rec, recorded_by: u.user?.id });
    if (error) throw error;
    await logAudit({ module: "k9", action: "K9_HEALTH_LOGGED", recordId: rec.k9_unit_id, changes: { type: rec.record_type } });
  }, []);

  const logTraining = useCallback(async (rec: Omit<K9TrainingRecord, "id">) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("k9_training_records").insert({ ...rec, recorded_by: u.user?.id });
    if (error) throw error;
  }, []);

  const logIncident = useCallback(async (rec: Omit<K9Incident, "id">) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("k9_incidents").insert({ ...rec, reported_by: u.user?.id });
    if (error) throw error;
  }, []);

  // ---------- DERIVED ----------
  const byUnit = useCallback((unitId: string) => ({
    deployments: deployments.filter((d) => d.k9_unit_id === unitId),
    health: health.filter((h) => h.k9_unit_id === unitId),
    training: training.filter((t) => t.k9_unit_id === unitId),
    incidents: incidents.filter((i) => i.k9_unit_id === unitId),
    activeDeployment: deployments.find((d) => d.k9_unit_id === unitId && d.status === "active") ?? null,
  }), [deployments, health, training, incidents]);

  return {
    units, deployments, health, training, incidents,
    loading, error,
    byUnit,
    actions: {
      setUnitStatus, updateUnit, deleteUnit,
      deployUnit, completeDeployment, abortDeployment,
      logHealth, logTraining, logIncident,
      refresh: fetchAll,
    },
  };
}
