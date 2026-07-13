/**
 * useCMC - core hook for Crisis Management Centre lifecycle.
 *
 * Architectural pattern (reusable for any operational-command module):
 *   1. Single hook owns: fetch + realtime subscription + write actions.
 *   2. UI components are dumb — they call hook actions and render hook state.
 *   3. All writes are persisted to Supabase + mirrored to audit_trail.
 *   4. Realtime keeps every operator's screen in sync.
 *
 * To replicate for a new module:
 *   - Duplicate this file, swap table names + payload shape.
 *   - Reuse the same { state, loading, actions } return contract.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/utils/auditLog";

const sb = supabase as any; // tables not yet in generated types

export type CMCActivation = {
  id: string;
  activation_number: string;
  tier: "tier_1" | "tier_2" | "tier_3";
  status: "active" | "stood_down";
  reason: string;
  trigger_type: string;
  trigger_reference?: string | null;
  gold_commander?: string | null;
  silver_commander?: string | null;
  bronze_commander?: string | null;
  activated_by?: string | null;
  activated_at: string;
  stood_down_by?: string | null;
  stood_down_at?: string | null;
  stand_down_notes?: string | null;
};

export type CMCDecision = {
  id: string;
  activation_id: string | null;
  category: string;
  decision: string;
  rationale?: string | null;
  made_by?: string | null;
  made_by_role?: string | null;
  made_at: string;
  signed_off_at?: string | null;
};

export type CMCNotification = {
  id: string;
  activation_id: string | null;
  role_name: string;
  recipient_name?: string | null;
  channel: "call" | "sms" | "email" | "radio" | "app";
  sla_minutes: number;
  status: "pending" | "sent" | "acknowledged" | "failed";
  sent_at?: string | null;
  acknowledged_at?: string | null;
  notes?: string | null;
};

export type CMCResource = {
  id: string;
  activation_id: string | null;
  resource_type: string;
  identifier: string;
  status: "standby" | "engaged" | "enroute" | "onscene" | "offline";
  assigned_to?: string | null;
  location?: string | null;
  updated_at: string;
};

/** Default escalation chain seeded on every new activation. */
const DEFAULT_NOTIFICATION_CHAIN: Array<Pick<CMCNotification, "role_name" | "channel" | "sla_minutes">> = [
  { role_name: "COO", channel: "call", sla_minutes: 1 },
  { role_name: "CEO", channel: "call", sla_minutes: 5 },
  { role_name: "Client Account Manager", channel: "call", sla_minutes: 10 },
  { role_name: "Insurance & Legal", channel: "email", sla_minutes: 30 },
  { role_name: "Regulator (PSRA)", channel: "email", sla_minutes: 1440 },
];

export function useCMC() {
  const [activation, setActivation] = useState<CMCActivation | null>(null);
  const [decisions, setDecisions] = useState<CMCDecision[]>([]);
  const [notifications, setNotifications] = useState<CMCNotification[]>([]);
  const [resources, setResources] = useState<CMCResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- READ ----------
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data: actData, error: actErr } = await sb
        .from("cmc_activations")
        .select("*")
        .eq("status", "active")
        .order("activated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (actErr) throw actErr;
      setActivation(actData ?? null);

      if (actData?.id) {
        const [{ data: decs }, { data: notifs }, { data: ress }] = await Promise.all([
          sb.from("cmc_decisions").select("*").eq("activation_id", actData.id).order("made_at", { ascending: false }),
          sb.from("cmc_notifications").select("*").eq("activation_id", actData.id).order("created_at"),
          sb.from("cmc_resources").select("*").eq("activation_id", actData.id).order("created_at"),
        ]);
        setDecisions(decs ?? []);
        setNotifications(notifs ?? []);
        setResources(ress ?? []);
      } else {
        setDecisions([]); setNotifications([]); setResources([]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load CMC state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ---------- REALTIME ----------
  useEffect(() => {
    const channel = supabase
      .channel("cmc-room")
      .on("postgres_changes", { event: "*", schema: "public", table: "cmc_activations" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cmc_decisions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cmc_notifications" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cmc_resources" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // ---------- WRITES ----------
  const activate = useCallback(async (payload: {
    tier: CMCActivation["tier"];
    reason: string;
    trigger_type?: string;
    trigger_reference?: string | null;
    gold_commander?: string | null;
    silver_commander?: string | null;
    bronze_commander?: string | null;
  }) => {
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    const { data, error } = await sb.from("cmc_activations").insert({
      tier: payload.tier,
      reason: payload.reason,
      trigger_type: payload.trigger_type ?? "manual",
      trigger_reference: payload.trigger_reference ?? null,
      gold_commander: payload.gold_commander ?? null,
      silver_commander: payload.silver_commander ?? null,
      bronze_commander: payload.bronze_commander ?? null,
      activated_by: userId,
    }).select().single();
    if (error) throw error;

    // Seed default escalation chain
    await sb.from("cmc_notifications").insert(
      DEFAULT_NOTIFICATION_CHAIN.map((n) => ({ ...n, activation_id: data.id }))
    );

    // First decision = "Activation"
    await sb.from("cmc_decisions").insert({
      activation_id: data.id,
      category: "strategic",
      decision: `CMC ${payload.tier.toUpperCase()} activated: ${payload.reason}`,
      made_by: userId,
      made_by_role: "gold",
    });

    await logAudit({ module: "crisis_management_centre", action: "CMC_ACTIVATED", recordId: data.id, changes: payload });
    return data as CMCActivation;
  }, []);

  const standDown = useCallback(async (notes: string) => {
    if (!activation) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("cmc_activations").update({
      status: "stood_down",
      stood_down_by: u.user?.id,
      stood_down_at: new Date().toISOString(),
      stand_down_notes: notes,
    }).eq("id", activation.id);
    if (error) throw error;

    await sb.from("cmc_decisions").insert({
      activation_id: activation.id,
      category: "strategic",
      decision: "CMC stood down",
      rationale: notes,
      made_by: u.user?.id,
      made_by_role: "gold",
    });
    await logAudit({ module: "crisis_management_centre", action: "CMC_STOOD_DOWN", recordId: activation.id, changes: { notes } });
  }, [activation]);

  const logDecision = useCallback(async (payload: {
    category: CMCDecision["category"];
    decision: string;
    rationale?: string;
    role?: string;
  }) => {
    if (!activation) throw new Error("No active CMC to log decisions against.");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("cmc_decisions").insert({
      activation_id: activation.id,
      category: payload.category,
      decision: payload.decision,
      rationale: payload.rationale ?? null,
      made_by: u.user?.id,
      made_by_role: payload.role ?? "silver",
    });
    if (error) throw error;
    await logAudit({ module: "crisis_management_centre", action: "CMC_DECISION_LOGGED", recordId: activation.id, changes: payload });
  }, [activation]);

  const updateNotification = useCallback(async (
    id: string,
    patch: Partial<Pick<CMCNotification, "status" | "notes" | "sent_at" | "acknowledged_at">>
  ) => {
    const { data: u } = await supabase.auth.getUser();
    const finalPatch: any = { ...patch };
    if (patch.status === "sent" && !patch.sent_at) finalPatch.sent_at = new Date().toISOString();
    if (patch.status === "acknowledged" && !patch.acknowledged_at) finalPatch.acknowledged_at = new Date().toISOString();
    finalPatch.sent_by = u.user?.id;
    const { error } = await sb.from("cmc_notifications").update(finalPatch).eq("id", id);
    if (error) throw error;
    await logAudit({ module: "crisis_management_centre", action: "CMC_NOTIFICATION_UPDATED", recordId: id, changes: finalPatch });
  }, []);

  const addResource = useCallback(async (r: Omit<CMCResource, "id" | "updated_at" | "activation_id">) => {
    if (!activation) throw new Error("No active CMC.");
    const { error } = await sb.from("cmc_resources").insert({ ...r, activation_id: activation.id });
    if (error) throw error;
  }, [activation]);

  const updateResource = useCallback(async (id: string, patch: Partial<CMCResource>) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("cmc_resources").update({
      ...patch,
      updated_by: u.user?.id,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw error;
  }, []);

  return {
    activation, decisions, notifications, resources,
    loading, error,
    actions: { activate, standDown, logDecision, updateNotification, addResource, updateResource, refresh: fetchAll },
  };
}
