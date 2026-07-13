/**
 * useMdtManagement — data + realtime + actions hook for MDT Management Console.
 *
 * 3-layer template:
 *   1. DATA (this file)   — vehicles, messages, sos, patrols + realtime + actions
 *   2. PRESENTATION       — MDTManagement.tsx owns UI state (search/filters/drawers)
 *   3. COMPOSITION        — tab subcomponents render slices of `data`
 *
 * Realtime tables: vehicles, mdt_messages, sos_alerts, mobile_patrols.
 *
 * The hook accepts optional callbacks so the page can drive UI side-effects
 * (toasts, audio alerts, panel popups) without coupling them into data logic.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { writeAudit } from "@/utils/audit";

export interface MdtCallbacks {
  /** Fired on every new mdt_messages INSERT (regardless of sender). */
  onIncomingMessage?: (msg: any) => void;
  /** Fired on a new active sos_alerts INSERT. */
  onIncomingSos?: (sos: any) => void;
}

const NS = "[useMdtManagement]";

export function useMdtManagement(currentUserId: string | undefined, callbacks: MdtCallbacks = {}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [sos, setSos] = useState<any[]>([]);
  const [patrols, setPatrols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ───────── Load ───────── */
  const load = useCallback(async () => {
    try {
      const [v, m, s, p] = await Promise.all([
        supabase.from("vehicles").select("*").eq("is_active", true).order("vehicle_id"),
        supabase.from("mdt_messages").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("sos_alerts")
          .select("*, vehicles(vehicle_id), profiles(full_name)")
          .order("triggered_at", { ascending: false }).limit(50),
        supabase.from("mobile_patrols").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setVehicles(v.data || []);
      setMessages(m.data || []);
      setSos(s.data || []);
      setPatrols(p.data || []);
    } catch (e) {
      console.warn(NS, "load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ───────── Realtime ───────── */
  useEffect(() => {
    load();
    const ch = supabase
      .channel("mdt-mgmt-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "mdt_messages" }, (payload: any) => {
        load();
        if (payload.eventType === "INSERT" && payload.new?.sent_by !== currentUserId) {
          callbacks.onIncomingMessage?.(payload.new);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, (payload: any) => {
        load();
        if (payload.eventType === "INSERT" && payload.new?.status === "active") {
          callbacks.onIncomingSos?.(payload.new);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mobile_patrols" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, currentUserId]);

  /* ───────── Actions ───────── */

  /** Direct transmission to one vehicle. */
  const sendDirect = useCallback(
    async (vehicle: any, message: string, opts: { priority: string; type: string; attachedName?: string | null }) => {
      if (!vehicle || !message.trim() || !currentUserId) return false;
      const body = opts.attachedName ? `${message}\n📎 ${opts.attachedName}` : message;
      const { error } = await supabase.from("mdt_messages").insert({
        vehicle_id: vehicle.id, sent_by: currentUserId, message_type: opts.type,
        message: body, priority: opts.priority, is_read: false,
      });
      if (error) { toast.error("Send failed: " + error.message); return false; }
      await writeAudit({
        action: "dispatch_transmitted", entityType: "vehicle", entityId: vehicle.id,
        after: { priority: opts.priority, type: opts.type, message },
      });
      toast.success(`Transmitted to ${vehicle.vehicle_id}`);
      return true;
    },
    [currentUserId]
  );

  /** Broadcast to a channel (all / qrf / supervisors / region). */
  const broadcast = useCallback(
    async (channel: string, message: string, priority: string) => {
      if (!message.trim() || !currentUserId) return false;
      let targets = vehicles;
      if (channel === "qrf") {
        targets = vehicles.filter((v) => (v.vehicle_type || "").toLowerCase().includes("response"));
      } else if (channel === "supervisors") {
        targets = vehicles.filter((v) => v.call_sign?.toLowerCase().includes("sup"));
      } else if (channel !== "all") {
        targets = vehicles.filter((v) => v.region === channel);
      }
      if (targets.length === 0) { toast.error("No units in channel"); return false; }
      const payload = targets.map((v) => ({
        vehicle_id: v.id, sent_by: currentUserId, message_type: "broadcast",
        message, priority, is_read: false,
      }));
      const { error } = await supabase.from("mdt_messages").insert(payload as any);
      if (error) { toast.error("Broadcast failed"); return false; }
      await writeAudit({
        action: "broadcast", entityType: "channel", entityId: channel,
        after: { count: targets.length, priority },
      });
      toast.success(`Broadcast to ${targets.length} units`);
      return true;
    },
    [currentUserId, vehicles]
  );

  /** Convoy dispatch — same message to multiple selected vehicles. */
  const dispatchMulti = useCallback(
    async (vehicleIds: string[], message: string, priority: string) => {
      if (vehicleIds.length === 0 || !message.trim() || !currentUserId) return false;
      const payload = vehicleIds.map((vid) => ({
        vehicle_id: vid, sent_by: currentUserId, message_type: "dispatch",
        message: `[CONVOY] ${message}`, priority, is_read: false,
      }));
      const { error } = await supabase.from("mdt_messages").insert(payload as any);
      if (error) { toast.error("Multi-dispatch failed"); return false; }
      toast.success(`Convoy dispatched: ${vehicleIds.length} units`);
      return true;
    },
    [currentUserId]
  );

  const respondSos = useCallback(async (id: string) => {
    const { error } = await supabase.from("sos_alerts").update({
      status: "responding", responded_by: currentUserId, response_time: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error("Failed"); else toast.success("Responding");
  }, [currentUserId]);

  const resolveSos = useCallback(async (id: string, note: string) => {
    const { error } = await supabase.from("sos_alerts").update({
      status: "resolved", resolution_time: new Date().toISOString(), resolution_notes: note,
    }).eq("id", id);
    if (error) toast.error("Failed"); else toast.success("SOS resolved");
  }, []);

  /** Dispatch nearest unit Code-3 to an SOS panel alert + mark responding. */
  const dispatchNearest = useCallback(
    async (vehicle: any, sosAlert: any) => {
      if (!sosAlert || !currentUserId) return;
      await supabase.from("mdt_messages").insert({
        vehicle_id: vehicle.id, sent_by: currentUserId, message_type: "dispatch", priority: "critical",
        message: `[AUTO-NEAREST] Respond Code 3 to SOS ${sosAlert.alert_number} @ ${sosAlert.gps_lat}, ${sosAlert.gps_lng}`,
        is_read: false,
      } as any);
      await respondSos(sosAlert.id);
      toast.success(`${vehicle.vehicle_id} dispatched`);
    },
    [currentUserId, respondSos]
  );

  return {
    data: { vehicles, messages, sos, patrols },
    loading,
    actions: { refresh: load, sendDirect, broadcast, dispatchMulti, respondSos, resolveSos, dispatchNearest },
  };
}
