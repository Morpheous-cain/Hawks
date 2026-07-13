/**
 * useAlarms — reusable data + realtime + CRUD hook for the
 * Alarm & Sensor Integration + Mobile Response Network module.
 *
 * Architectural pattern (replicable across modules):
 *   1. Single fetch() pulls all module datasets in parallel.
 *   2. subscribe() opens postgres_changes channels and refetches on event.
 *   3. Action functions (acknowledge / dispatch / resolve) are stable
 *      useCallbacks that write through Supabase, log audit, then refetch.
 *   4. The page component is purely presentational — it consumes
 *      { data, loading, actions } and renders.
 *
 * To replicate for another module: copy this file, swap the table
 * names + action verbs + audit module string. The hook shape
 * (data, loading, refetch, actions) stays identical.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/utils/auditLog";
import { useAudioAlerts } from "@/hooks/useAudioAlerts";

export interface AlarmRecord {
  id: string;
  alarm_number: string;
  alarm_type: string;
  alarm_source?: string | null;
  location: string;
  priority: string;
  status: string;
  triggered_at: string;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  dispatched_at?: string | null;
  assigned_vehicle_id?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  false_alarm?: boolean | null;
  sla_deadline?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
}

interface UseAlarmsResult {
  vehicles: any[];
  sosAlerts: any[];
  alarmActivations: AlarmRecord[];
  sensors: any[];
  loading: boolean;
  refetch: () => Promise<void>;
  acknowledge: (alarmId: string) => Promise<void>;
  dispatch: (alarmId: string, vehicleId: string) => Promise<void>;
  resolve: (alarmId: string, notes: string, isFalseAlarm: boolean) => Promise<void>;
}

/**
 * Hook returns all alarm-network state + actions. Safe to call in
 * any page; realtime subscription is set up once and torn down on
 * unmount. Action callbacks are stable (useCallback) so they can be
 * passed into memoized children without triggering re-renders.
 */
export const useAlarms = (): UseAlarmsResult => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [alarmActivations, setAlarmActivations] = useState<AlarmRecord[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { playAlert } = useAudioAlerts();
  // Stash playAlert in a ref so the subscribe effect doesn't re-fire
  // when the audio hook returns a fresh function each render.
  const playAlertRef = useRef(playAlert);
  useEffect(() => { playAlertRef.current = playAlert; }, [playAlert]);

  /** Pull every dataset the module needs in one parallel batch. */
  const refetch = useCallback(async () => {
    try {
      const [vehiclesRes, sosRes, alarmsRes, sensorsRes] = await Promise.all([
        supabase.from("vehicles").select("*").eq("is_active", true),
        supabase
          .from("sos_alerts")
          .select("*")
          .in("status", ["active", "responding"])
          .order("triggered_at", { ascending: false }),
        supabase
          .from("alarm_activations")
          .select("*")
          .in("status", ["active", "acknowledged", "dispatched", "arrived"])
          .order("triggered_at", { ascending: false }),
        supabase.from("alarm_sensors").select("*").eq("is_active", true),
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (sosRes.error) throw sosRes.error;
      if (alarmsRes.error) throw alarmsRes.error;
      if (sensorsRes.error) throw sensorsRes.error;

      setVehicles(vehiclesRes.data ?? []);
      setSosAlerts(sosRes.data ?? []);
      setAlarmActivations((alarmsRes.data ?? []) as AlarmRecord[]);
      setSensors(sensorsRes.data ?? []);
    } catch (err) {
      console.error("[useAlarms] fetch failed:", err);
      toast.error("Failed to load control room data");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Initial load + realtime wiring. Runs once per mount. */
  useEffect(() => {
    refetch();

    // Best-effort browser notification permission.
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const channels = [
      supabase
        .channel("alarms-hook-vehicles")
        .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => refetch())
        .subscribe(),

      supabase
        .channel("alarms-hook-sos")
        .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, (payload: any) => {
          if (payload?.eventType === "INSERT" && payload?.new?.status === "active") {
            toast.error(`🚨 SOS ALERT: ${payload.new.alert_number}`, { duration: 10000 });
          }
          refetch();
        })
        .subscribe(),

      supabase
        .channel("alarms-hook-alarms")
        .on("postgres_changes", { event: "*", schema: "public", table: "alarm_activations" }, (payload: any) => {
          if (payload?.eventType === "INSERT" && payload?.new?.status === "active") {
            const p = (payload.new.priority || "medium").toLowerCase();
            const tone = p === "critical" || p === "high" ? "critical" : "warning";
            try { playAlertRef.current?.(tone as any); } catch { /* noop */ }
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(`🚨 ${p.toUpperCase()} ALARM`, {
                  body: `${payload.new.alarm_number} · ${payload.new.alarm_type} · ${payload.new.location}`,
                  tag: payload.new.id,
                });
              } catch { /* noop */ }
            }
            toast.error(
              `🚨 ALARM TRIGGERED: ${payload.new.alarm_number} - ${payload.new.location}`,
              { duration: 10000 },
            );
          }
          refetch();
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch { /* noop */ }
      });
    };
    // refetch is stable (empty deps) so this effect runs exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Operator acknowledged the alarm — stops the initial-response SLA clock. */
  const acknowledge = useCallback(async (alarmId: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error, count } = await supabase
        .from("alarm_activations")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
        })
        .eq("id", alarmId)
        .eq("status", "active")    // Guard: only acknowledge alarms still in 'active' state.
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      if (count === 0) {
        toast.warning("Alarm was already acknowledged by another operator.");
        refetch();
        return;
      }

      await logAudit({ module: "alarm_response", action: "acknowledge_alarm", recordId: alarmId });
      toast.success("Alarm acknowledged");
      refetch();
    } catch (err) {
      console.error("[useAlarms] acknowledge failed:", err);
      toast.error("Failed to acknowledge alarm");
    }
  }, [refetch]);

  /** Dispatch a QRF vehicle. Caller should pre-sort by proximity. */
  const dispatch = useCallback(async (alarmId: string, vehicleId: string) => {
    try {
      const { error, count } = await supabase
        .from("alarm_activations")
        .update({
          status: "dispatched",
          dispatched_at: new Date().toISOString(),
          assigned_vehicle_id: vehicleId,
        })
        .eq("id", alarmId)
        .eq("status", "acknowledged")   // Guard: only dispatch acknowledged alarms.
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      if (count === 0) {
        toast.warning("Alarm has already been dispatched or is no longer in an acknowledged state.");
        refetch();
        return;
      }

      await logAudit({
        module: "alarm_response",
        action: "dispatch_vehicle",
        recordId: alarmId,
        changes: { vehicle_id: vehicleId },
      });
      toast.success("Vehicle dispatched to alarm location");
      refetch();
    } catch (err) {
      console.error("[useAlarms] dispatch failed:", err);
      toast.error("Failed to dispatch vehicle");
    }
  }, [refetch]);

  /** Close out an alarm — either resolved or marked as a false alarm. */
  const resolve = useCallback(async (alarmId: string, notes: string, isFalseAlarm: boolean) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error, count } = await supabase
        .from("alarm_activations")
        .update({
          status: isFalseAlarm ? "false_alarm" : "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          resolution_notes: notes,
          false_alarm: isFalseAlarm,
        })
        .eq("id", alarmId)
        .eq("status", "arrived")    // Guard: only resolve alarms where officer is on-scene.
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      if (count === 0) {
        toast.warning("This alarm was already resolved by another operator, or the officer has not yet marked arrival.");
        refetch();
        return;
      }

      await logAudit({
        module: "alarm_response",
        action: isFalseAlarm ? "false_alarm" : "resolve_alarm",
        recordId: alarmId,
        changes: { resolution_notes: notes },
      });
      toast.success(isFalseAlarm ? "Marked as false alarm" : "Alarm resolved");
      refetch();
    } catch (err) {
      console.error("[useAlarms] resolve failed:", err);
      toast.error("Failed to resolve alarm");
    }
  }, [refetch]);

  return { vehicles, sosAlerts, alarmActivations, sensors, loading, refetch, acknowledge, dispatch, resolve };
};
