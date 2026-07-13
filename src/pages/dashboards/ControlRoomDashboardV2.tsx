import { Monitor, Radio, AlertTriangle, ShieldAlert, Camera, Video, Users, MapPin, Activity, Truck, ClipboardCheck, Globe, Siren } from "lucide-react";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { useDashboardMetrics, useDashboardRows } from "@/hooks/useDashboardMetrics";
import LiveSectorMap from "@/components/field-app/shell/LiveSectorMap";

const ControlRoomDashboardV2 = () => {
  const today = new Date().toISOString().slice(0, 10);
  const { metrics, loading } = useDashboardMetrics([
    { key: "incidents_open", table: "incidents", filter: (q) => q.in("status", ["open", "in_progress"]) },
    { key: "sev1", table: "incidents", filter: (q) => q.eq("severity", "critical").in("status", ["open", "in_progress"]) },
    { key: "alarms_active", table: "alarm_activations", filter: (q) => q.in("status", ["active", "responding"]) },
    { key: "sos_active", table: "sos_alerts", filter: (q) => q.in("status", ["active", "acknowledged"]) },
    { key: "dispatch_pending", table: "dispatch_requests", filter: (q) => q.eq("status", "pending") },
    { key: "dispatch_active", table: "dispatch_requests", filter: (q) => q.eq("status", "dispatched") },
    { key: "calls_today", table: "calls", filter: (q) => q.gte("created_at", `${today}T00:00:00`) },
    { key: "sms_today", table: "sms_messages", filter: (q) => q.gte("created_at", `${today}T00:00:00`) },
    { key: "advisories_active", table: "strategic_advisories", filter: (q) => q.eq("status", "Active") },
    { key: "patrols_active", table: "patrols", filter: (q) => q.eq("status", "in_progress") },
    { key: "checkpoints_today", table: "patrol_checkpoints", filter: (q) => q.gte("scanned_at", `${today}T00:00:00`) },
    { key: "mdt_messages_today", table: "mdt_messages", filter: (q) => q.gte("created_at", `${today}T00:00:00`) },
    { key: "body_cams_recording", table: "body_cam_clips", filter: (q) => q.eq("status", "recording") },
    { key: "operators_online", table: "operator_statuses", filter: (q) => q.eq("status", "online") },
    { key: "dob_today", table: "dob_entries", filter: (q) => q.gte("created_at", `${today}T00:00:00`) },
    { key: "courier_in_transit", table: "courier_deliveries", filter: (q) => q.in("status", ["picked_up", "in_transit"]) },
  ]);

  const { rows: alarms } = useDashboardRows<any>("alarm_activations", (q) => q.in("status", ["active", "responding"]).order("triggered_at", { ascending: false }).limit(6));
  const { rows: incidents } = useDashboardRows<any>("incidents", (q) => q.in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(6));
  const { rows: sos } = useDashboardRows<any>("sos_alerts", (q) => q.in("status", ["active", "acknowledged"]).order("created_at", { ascending: false }).limit(5));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Control Room · 24/7 Hub"
        title="Control Room Workspace"
        description="Live alarms, incidents, dispatch, SOS, comms, CCTV and patrol oversight — every signal in one place."
        icon={Monitor}
        gradient="from-slate-500 to-slate-700"
      />

      <KpiGrid cols={6}>
        <KpiTile label="Open Incidents" value={metrics.incidents_open ?? 0} loading={loading} tone={metrics.incidents_open ? "warn" : "good"} icon={AlertTriangle} />
        <KpiTile label="Sev-1 Live" value={metrics.sev1 ?? 0} loading={loading} tone={metrics.sev1 ? "bad" : "good"} />
        <KpiTile label="Live Alarms" value={metrics.alarms_active ?? 0} loading={loading} tone={metrics.alarms_active ? "warn" : "good"} icon={Siren} />
        <KpiTile label="SOS Active" value={metrics.sos_active ?? 0} loading={loading} tone={metrics.sos_active ? "bad" : "good"} icon={ShieldAlert} />
        <KpiTile label="Dispatch Pending" value={metrics.dispatch_pending ?? 0} loading={loading} tone={metrics.dispatch_pending ? "warn" : "good"} />
        <KpiTile label="Dispatched" value={metrics.dispatch_active ?? 0} loading={loading} icon={Activity} />
      </KpiGrid>

      <KpiGrid cols={6}>
        <KpiTile label="Calls Today" value={metrics.calls_today ?? 0} loading={loading} icon={Radio} />
        <KpiTile label="SMS Today" value={metrics.sms_today ?? 0} loading={loading} />
        <KpiTile label="MDT Messages" value={metrics.mdt_messages_today ?? 0} loading={loading} />
        <KpiTile label="Active Patrols" value={metrics.patrols_active ?? 0} loading={loading} icon={ClipboardCheck} />
        <KpiTile label="Checkpoint Scans" value={metrics.checkpoints_today ?? 0} loading={loading} />
        <KpiTile label="Body Cams Live" value={metrics.body_cams_recording ?? 0} loading={loading} icon={Video} />
      </KpiGrid>

      <KpiGrid cols={5}>
        <KpiTile label="Operators Online" value={metrics.operators_online ?? 0} loading={loading} icon={Users} tone="good" />
        <KpiTile label="Active Advisories" value={metrics.advisories_active ?? 0} loading={loading} icon={Globe} />
        <KpiTile label="DOB Entries Today" value={metrics.dob_today ?? 0} loading={loading} />
        <KpiTile label="Courier In Transit" value={metrics.courier_in_transit ?? 0} loading={loading} icon={Truck} />
        <KpiTile label="CCTV Grid" value="Live" loading={loading} icon={Camera} tone="good" />
      </KpiGrid>

      <Panel title="Live Sector Map">
        <LiveSectorMap />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Live Alarms" className="lg:col-span-1">
          {alarms.length === 0 ? (
            <EmptyState message="No active alarms." />
          ) : (
            <div className="space-y-1">
              {alarms.map((a) => (
                <ListRow
                  key={a.id}
                  primary={a.alarm_number || a.alarm_type || "Alarm"}
                  secondary={`${a.priority ?? "—"} · ${new Date(a.triggered_at).toLocaleTimeString()}`}
                  trailing={<StatusBadge status={a.status} tone={a.status === "responding" ? "info" : "bad"} />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Open Incidents" className="lg:col-span-1">
          {incidents.length === 0 ? (
            <EmptyState message="No open incidents." />
          ) : (
            <div className="space-y-1">
              {incidents.map((i) => (
                <ListRow
                  key={i.id}
                  primary={i.title || i.incident_type || "Incident"}
                  secondary={`${i.severity ?? "—"} · ${new Date(i.created_at).toLocaleTimeString()}`}
                  trailing={<StatusBadge status={i.severity ?? "—"} tone={i.severity === "critical" ? "bad" : "warn"} />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="SOS Alerts" className="lg:col-span-1">
          {sos.length === 0 ? (
            <EmptyState message="No SOS alerts." />
          ) : (
            <div className="space-y-1">
              {sos.map((s) => (
                <ListRow
                  key={s.id}
                  primary={s.alert_type ?? "SOS"}
                  secondary={`${s.location_description ?? "—"} · ${new Date(s.created_at).toLocaleTimeString()}`}
                  trailing={<StatusBadge status={s.status} tone="bad" />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Console Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/platform/control-room/m/control-room" label="Control Room Floor" desc="Operator workspace" icon={Monitor} />
          <QuickLink to="/platform/control-room/m/map" label="Live Map" desc="Geo-view" icon={MapPin} />
          <QuickLink to="/platform/control-room/m/alarms" label="Alarms & Sensors" desc="QRF console" icon={Siren} />
          <QuickLink to="/platform/control-room/m/mdt" label="MDT" desc="Vehicle comms" icon={Radio} />
          
          <QuickLink to="/platform/control-room/m/comms" label="Communications" desc="Calls & radio" icon={Radio} />
          <QuickLink to="/platform/control-room/m/incidents" label="Incidents" desc="Triage & dispatch" icon={AlertTriangle} />
          <QuickLink to="/platform/control-room/m/cctv" label="CCTV" desc="Camera matrix" icon={Camera} />
          <QuickLink to="/platform/control-room/m/bodycam" label="Body Cams" desc="Live + evidence" icon={Video} />
          <QuickLink to="/platform/control-room/m/supervision-patrol" label="Patrol Monitor" desc="Live patrol stream" icon={ClipboardCheck} />
          <QuickLink to="/platform/control-room/m/dob" label="Daily OB" desc="Occurrence book" icon={ClipboardCheck} />
          <QuickLink to="/platform/control-room/m/auto-dispatch" label="Auto-Dispatch" desc="Rules engine" icon={Activity} />
          <QuickLink to="/platform/control-room/m/war-room" label="War Room" desc="Crisis coordination" icon={ShieldAlert} />
        </div>
      </Panel>
    </div>
  );
};

export default ControlRoomDashboardV2;
