/**
 * useIncidents — reusable data + realtime + CRUD hook for the
 * Incident Command Centre module.
 *
 * Follows the same 3-layer pattern as useAlarms:
 *   1. Hook owns datasets, realtime subscriptions, and stable actions.
 *   2. Action callbacks are useCallback-stable and always refetch on success.
 *   3. Page is purely presentational — owns only local UI state (form,
 *      selected incident, dialog flags).
 *
 * Realtime channels:
 *   - incidents              (toast on INSERT, full refetch)
 *   - incident_timeline      (reload active detail)
 *   - incident_escalations   (reload active detail)
 *   - incident_evidence      (reload active detail)
 *
 * The "active incident id" is passed in so the hook knows which detail
 * payload to reload on child-table events. We stash it in a ref so
 * changing the active selection doesn't tear down the realtime channel.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/utils/auditLog";

export interface TimelineEvent {
  id: string;
  incident_id: string;
  event_type: string;
  event_at: string;
  note: string | null;
  payload: any;
}
export interface Escalation {
  id: string;
  incident_id: string;
  level: number;
  escalated_to_role: string;
  reason: string | null;
  acknowledged: boolean;
  created_at: string;
}
export interface Evidence {
  id: string;
  incident_id: string;
  evidence_type: string;
  title: string;
  description: string | null;
  storage_path: string | null;
  mime_type: string | null;
  collected_at: string;
}
export interface SopStep {
  order: number;
  action: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

export const INCIDENT_TRANSITIONS: Record<string, string[]> = {
  open: ["investigating"],
  investigating: ["resolved", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

export interface UpdateStatusOptions {
  notes?: string;
  userId?: string;
  currentStatus?: string;
}

interface UseIncidentsResult {
  // Data
  incidents: any[];
  clients: any[];
  sites: any[];
  staff: any[];
  timeline: TimelineEvent[];
  escalations: Escalation[];
  evidence: Evidence[];
  loading: boolean;
  // Detail loader (call when active incident changes)
  loadDetail: (incidentId: string) => Promise<void>;
  refetch: () => Promise<void>;
  // Actions
  createIncident: (formData: any, userId: string | undefined) => Promise<boolean>;
  updateStatus: (id: string, status: string, options?: UpdateStatusOptions) => Promise<void>;
  addNote: (incidentId: string, note: string, userId: string | undefined) => Promise<boolean>;
  escalate: (incidentId: string, level: number, role: string, reason: string) => Promise<boolean>;
  toggleSopStep: (incident: any, idx: number, userId: string | undefined) => Promise<SopStep[] | null>;
  uploadEvidence: (incidentId: string, files: FileList, userId: string | undefined) => Promise<void>;
  runAiSummary: (incidentId: string) => Promise<{ summary?: string; at?: string } | null>;
}

async function generateIncidentNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("next_incident_number");
  if (error || !data) {
    // Fallback: timestamp-based number avoids Math.random() collisions while
    // the sequence migration is pending. Still has millisecond resolution so
    // truly concurrent inserts are extremely unlikely to collide.
    const d = new Date();
    return `INC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getTime()).slice(-6)}`;
  }
  return data as string;
}

export const useIncidents = (activeIncidentId?: string | null): UseIncidentsResult => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref-stash the active id so realtime channel never needs to re-subscribe.
  const activeIdRef = useRef<string | null | undefined>(activeIncidentId);
  useEffect(() => { activeIdRef.current = activeIncidentId; }, [activeIncidentId]);

  const fetchIncidents = useCallback(async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select(`*, clients(legal_name), sites(site_name), staff(full_name)`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setIncidents(data || []);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const [t, e, ev] = await Promise.all([
      supabase.from("incident_timeline" as any).select("*").eq("incident_id", id).order("event_at", { ascending: false }).limit(200),
      supabase.from("incident_escalations" as any).select("*").eq("incident_id", id).order("level", { ascending: false }),
      supabase.from("incident_evidence" as any).select("*").eq("incident_id", id).order("collected_at", { ascending: false }),
    ]);
    if (t.error) { console.error("[useIncidents] timeline fetch failed:", t.error); }
    if (e.error) { console.error("[useIncidents] escalations fetch failed:", e.error); }
    if (ev.error) { console.error("[useIncidents] evidence fetch failed:", ev.error); }
    setTimeline((t.data as any) || []);
    setEscalations((e.data as any) || []);
    setEvidence((ev.data as any) || []);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const [, c, s, st] = await Promise.all([
        fetchIncidents(),
        supabase.from("clients").select("id, legal_name"),
        supabase.from("sites").select("id, site_name, client_id"),
        supabase.from("staff").select("id, full_name"),
      ]);
      setClients(c.data || []);
      setSites(s.data || []);
      setStaff(st.data || []);
    } catch (err) {
      console.error("[useIncidents] fetch failed:", err);
      toast.error("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, [fetchIncidents]);

  // Initial load + realtime wiring (runs exactly once per mount).
  useEffect(() => {
    refetch();
    const channel = supabase
      .channel("incidents-hook")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, (payload: any) => {
        if (payload.eventType === "INSERT") toast.info("New incident reported");
        fetchIncidents();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_timeline" }, () => {
        const id = activeIdRef.current; if (id) loadDetail(id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_escalations" }, () => {
        const id = activeIdRef.current; if (id) loadDetail(id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_evidence" }, () => {
        const id = activeIdRef.current; if (id) loadDetail(id);
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createIncident = useCallback(async (formData: any, userId: string | undefined) => {
    try {
      const incidentNumber = await generateIncidentNumber();
      const { error } = await supabase.from("incidents").insert([{
        ...formData,
        incident_number: incidentNumber,
        reported_by: userId,
        status: "open",
      }]);
      if (error) throw error;
      await logAudit({ module: "incident_command", action: "create_incident" });
      toast.success("Incident reported · SOP auto-applied");
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string, options?: UpdateStatusOptions) => {
    const { notes, userId, currentStatus } = options ?? {};
    if (currentStatus) {
      const allowed = INCIDENT_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(status)) {
        toast.error(`Cannot transition from ${currentStatus} to ${status}.`);
        return;
      }
    }
    const patch: any = { status };
    if (status === "resolved" || status === "closed") {
      patch.resolved_at = new Date().toISOString();
      if (userId) patch.resolved_by = userId;
    }
    if (notes) patch.resolution_notes = notes;
    const { error } = await supabase.from("incidents").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAudit({ module: "incident_command", action: `status_${status}`, recordId: id, changes: notes ? { notes } : undefined });
    toast.success(`Incident ${status}`);
  }, []);

  const addNote = useCallback(async (incidentId: string, note: string, userId: string | undefined) => {
    if (!note.trim()) return false;
    const { error } = await (supabase.from("incident_timeline" as any) as any).insert({
      incident_id: incidentId, event_type: "note", note, actor_id: userId,
    });
    if (error) { toast.error(error.message); return false; }
    toast.success("Note added");
    return true;
  }, []);

  const escalate = useCallback(async (incidentId: string, level: number, role: string, reason: string) => {
    const { error } = await (supabase.from("incident_escalations" as any) as any).insert({
      incident_id: incidentId, level, escalated_to_role: role, reason,
    });
    if (error) { toast.error(error.message); return false; }
    await (supabase.from("incident_timeline" as any) as any).insert({
      incident_id: incidentId, event_type: "escalated",
      note: `Escalated to ${role}`, payload: { level, role, reason },
    });
    await logAudit({ module: "incident_command", action: "escalate", recordId: incidentId, changes: { level, role } });
    toast.success(`Escalated to ${role}`);
    return true;
  }, []);

  const toggleSopStep = useCallback(async (incident: any, idx: number, userId: string | undefined) => {
    const steps: SopStep[] = Array.isArray(incident.steps_completed) ? [...incident.steps_completed] : [];
    if (!steps[idx]) return null;
    const wasDone = !!steps[idx].completed;
    steps[idx] = {
      ...steps[idx],
      completed: !wasDone,
      completed_at: wasDone ? null : new Date().toISOString(),
      completed_by: wasDone ? null : userId ?? null,
    };
    const { error } = await supabase.from("incidents").update({ steps_completed: steps as any }).eq("id", incident.id);
    if (error) { toast.error(error.message); return null; }
    await (supabase.from("incident_timeline" as any) as any).insert({
      incident_id: incident.id,
      event_type: wasDone ? "sop_step_uncheck" : "sop_step_complete",
      note: `${wasDone ? "Reopened" : "Completed"}: ${steps[idx].action}`,
      actor_id: userId,
      payload: { order: steps[idx].order },
    });
    return steps;
  }, []);

  const uploadEvidence = useCallback(async (incidentId: string, files: FileList, userId: string | undefined) => {
    const fileArray = Array.from(files);
    const results = await Promise.all(
      fileArray.map(async (file) => {
        const path = `incidents/${incidentId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("evidence-vault").upload(path, file, { upsert: false });
        if (upErr) return { ok: false, name: file.name, error: upErr.message, path: null as null };
        return { ok: true, file, path, kind: file.type.startsWith("image/") ? "photo"
          : file.type.startsWith("video/") ? "video"
          : file.type.startsWith("audio/") ? "audio" : "file", name: file.name };
      })
    );

    const uploaded = results.filter(r => r.ok) as Array<{ ok: true; file: File; path: string; kind: string; name: string }>;
    const failed = results.filter(r => !r.ok);

    if (failed.length) {
      failed.forEach(f => toast.error(`Upload failed: ${f.name} — ${(f as any).error}`));
    }

    if (uploaded.length === 0) return;

    const { error: insErr } = await (supabase.from("incident_evidence" as any) as any).insert(
      uploaded.map(u => ({
        incident_id: incidentId, evidence_type: u.kind, title: u.name, storage_path: u.path,
        mime_type: u.file.type, file_size: u.file.size, collected_by: userId,
        chain_of_custody: [{ at: new Date().toISOString(), by: userId, action: "uploaded" }],
      }))
    );
    if (insErr) {
      // Metadata insert failed — remove orphaned storage objects.
      await Promise.allSettled(
        uploaded.map(u => supabase.storage.from("evidence-vault").remove([u.path]))
      );
      toast.error(`Evidence metadata failed to save: ${insErr.message}. Files removed.`);
      return;
    }

    const { error: tlErr } = await (supabase.from("incident_timeline" as any) as any).insert(
      uploaded.map(u => ({
        incident_id: incidentId, event_type: "evidence_added",
        note: `Evidence attached: ${u.name}`, actor_id: userId,
      }))
    );
    if (tlErr) {
      console.error("[useIncidents] timeline insert after upload failed:", tlErr.message);
    }

    toast.success(`${uploaded.length} file${uploaded.length !== 1 ? "s" : ""} attached as evidence`);
  }, []);

  const runAiSummary = useCallback(async (incidentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("incident-ai-summary", { body: { incident_id: incidentId } });
      if (error) throw error;
      toast.success("Executive brief generated");
      return { summary: data?.summary, at: new Date().toISOString() };
    } catch (e: any) {
      toast.error(e.message || "AI brief failed");
      return null;
    }
  }, []);

  return {
    incidents, clients, sites, staff, timeline, escalations, evidence, loading,
    loadDetail, refetch,
    createIncident, updateStatus, addNote, escalate, toggleSopStep, uploadEvidence, runAiSummary,
  };
};
