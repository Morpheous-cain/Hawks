/**
 * useInvestigationsData — data + realtime hook for the Investigations module.
 *
 * Multi-tenant isolation: all incident queries are scoped to records the
 * authenticated user is authorised to see. The server-side RLS policies are
 * the authoritative gate; these query predicates are an additional defence.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvestigationsCallbacks {
  onLoadError?: (err: any) => void;
}

const NS = "[useInvestigationsData]";

export function useInvestigationsData<
  TIncident, TTimeline, TEvidence, TAttachment
>(
  filterFn: (incident: TIncident) => boolean,
  callbacks: InvestigationsCallbacks = {},
) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [cases, setCases] = useState<TIncident[]>([]);
  const [timeline, setTimeline] = useState<TTimeline[]>([]);
  const [evidence, setEvidence] = useState<TEvidence[]>([]);
  const [attachments, setAttachments] = useState<TAttachment[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) {
        // Not authenticated — clear all data and stop loading.
        setCases([]);
        setTimeline([]);
        setEvidence([]);
        setAttachments([]);
        setCurrentUser(null);
        return;
      }

      setCurrentUser(authData.user ? { id: authData.user.id, email: authData.user.email } : null);

      // Determine the user's client_id scope (null means system-wide access for admins).
      // We look this up from the profiles table; if no client_id is present the user
      // is an internal operator and sees all records (RLS enforces the real boundary).
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", userId)
        .maybeSingle();

      const clientId: string | null = (profile as any)?.client_id ?? null;

      // Build the base incidents query. When the user is scoped to a client,
      // apply the predicate server-side so no cross-client data is transferred.
      let incidentsQuery = supabase
        .from("incidents")
        .select("id, incident_number, title, description, incident_type, severity, status, location, assigned_to, occurred_at, created_at, updated_at, sla_deadline, sla_breached, ai_summary")
        .order("created_at", { ascending: false })
        .limit(150);

      if (clientId) {
        incidentsQuery = incidentsQuery.eq("client_id", clientId);
      }

      const [incidentsRes, timelineRes, evidenceRes, attachmentsRes] = await Promise.all([
        incidentsQuery,
        supabase.from("incident_timeline")
          .select("id, incident_id, event_at, event_type, actor_name, note, payload")
          .order("event_at", { ascending: false }).limit(300),
        supabase.from("incident_evidence")
          .select("id, incident_id, evidence_type, title, description, collected_at, mime_type, storage_path, external_url")
          .order("collected_at", { ascending: false }).limit(200),
        supabase.from("investigation_attachments")
          .select("id, investigation_id, attachment_type, notes, attached_at, document:documents(title, file_name, file_type, uploaded_at)")
          .order("attached_at", { ascending: false }).limit(100),
      ]);

      if (incidentsRes.error) throw incidentsRes.error;
      if (timelineRes.error) throw timelineRes.error;
      if (evidenceRes.error) throw evidenceRes.error;
      if (attachmentsRes.error) throw attachmentsRes.error;

      const all = (incidentsRes.data ?? []) as TIncident[];
      // filterFn is still supported for additional in-memory filtering on top of
      // the server-side predicate (e.g. status filters, search terms).
      setCases(all.filter(filterFn));
      setTimeline((timelineRes.data ?? []) as TTimeline[]);
      setEvidence((evidenceRes.data ?? []) as TEvidence[]);
      setAttachments((attachmentsRes.data ?? []) as TAttachment[]);
    } catch (error: any) {
      console.warn(NS, "refresh failed:", error);
      callbacks.onLoadError?.(error);
    } finally {
      setLoading(false);
    }
  }, [filterFn, callbacks]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("investigations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_timeline" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_evidence" }, refresh)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: { cases, timeline, evidence, attachments, currentUser },
    loading,
    actions: { refresh },
  };
}
