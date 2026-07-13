import { Activity, AlertTriangle, Radio, ClipboardCheck, Truck, Users, Camera, ShieldAlert, MapPin, Search, Dog, ShieldHalf, FileText, Map as MapIcon } from "lucide-react";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { useDashboardMetrics, useDashboardRows } from "@/hooks/useDashboardMetrics";
import LiveSectorMap from "@/components/field-app/shell/LiveSectorMap";

const OpsManagerDashboard = () => {
  const today = new Date().toISOString().slice(0, 10);
  const { metrics, loading } = useDashboardMetrics([
    { key: "open_incidents", table: "incidents", filter: (q) => q.in("status", ["open", "in_progress"]) },
    { key: "sev1", table: "incidents", filter: (q) => q.eq("severity", "critical").in("status", ["open", "in_progress"]) },
    { key: "incidents_today", table: "incidents", filter: (q) => q.gte("created_at", `${today}T00:00:00`) },
    { key: "active_patrols", table: "patrols", filter: (q) => q.eq("status", "in_progress") },
    { key: "active_alarms", table: "alarm_activations", filter: (q) => q.in("status", ["active", "responding"]) },
    { key: "active_dispatches", table: "dispatch_requests", filter: (q) => q.in("status", ["pending", "dispatched"]) },
    { key: "active_escorts", table: "escort_missions", filter: (q) => q.in("status", ["scheduled", "in_progress"]) },
    { key: "active_k9", table: "k9_units", filter: (q) => q.eq("status", "active") },
    { key: "active_couriers", table: "courier_deliveries", filter: (q) => q.in("status", ["picked_up", "in_transit"]) },
    { key: "checkpoints_today", table: "patrol_checkpoints", filter: (q) => q.gte("scanned_at", `${today}T00:00:00`) },
    { key: "investigations", table: "reports" },
    { key: "open_loss", table: "loss_control_records", filter: (q) => q.in("status", ["open", "investigating"]) },
    { key: "open_tech_wo", table: "technical_work_orders", filter: (q) => q.in("status", ["pending", "in_progress"]) },
    { key: "body_cams_active", table: "body_cam_devices", filter: (q) => q.eq("status", "active") },
    { key: "events", table: "event_staff_assignments" },
    { key: "sos", table: "sos_alerts", filter: (q) => q.in("status", ["active", "acknowledged"]) },
  ]);

  const { rows: incidents } = useDashboardRows<any>("incidents", (q) => q.in("status", ["open", "in_progress"]).order("created_at", { ascending: false }).limit(8));
  const { rows: dispatches } = useDashboardRows<any>("dispatch_requests", (q) => q.in("status", ["pending", "dispatched"]).order("created_at", { ascending: false }).limit(6));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Operations Command"
        title="Ops Manager Cockpit"
        description="End-to-end operational posture: incidents, patrols, dispatch, escort, K9, courier, alarms, evidence and tech security."
        icon={Activity}
        gradient="from-orange-500 to-red-600"
      />

      <KpiGrid cols={6}>
        <KpiTile label="Open Incidents" value={metrics.open_incidents ?? 0} loading={loading} tone={metrics.open_incidents ? "warn" : "good"} icon={AlertTriangle} />
        <KpiTile label="Sev-1 Live" value={metrics.sev1 ?? 0} loading={loading} tone={metrics.sev1 ? "bad" : "good"} />
        <KpiTile label="Incidents Today" value={metrics.incidents_today ?? 0} loading={loading} />
        <KpiTile label="SOS Active" value={metrics.sos ?? 0} loading={loading} tone={metrics.sos ? "bad" : "good"} icon={ShieldAlert} />
        <KpiTile label="Live Alarms" value={metrics.active_alarms ?? 0} loading={loading} tone={metrics.active_alarms ? "warn" : "good"} icon={Radio} />
        <KpiTile label="Dispatch Queue" value={metrics.active_dispatches ?? 0} loading={loading} tone={metrics.active_dispatches ? "warn" : "good"} />
      </KpiGrid>

      <KpiGrid cols={6}>
        <KpiTile label="Active Patrols" value={metrics.active_patrols ?? 0} loading={loading} icon={ClipboardCheck} />
        <KpiTile label="Checkpoint Scans" value={metrics.checkpoints_today ?? 0} loading={loading} />
        <KpiTile label="Active Escorts" value={metrics.active_escorts ?? 0} loading={loading} icon={ShieldHalf} />
        <KpiTile label="Active K9 Units" value={metrics.active_k9 ?? 0} loading={loading} icon={Dog} />
        <KpiTile label="Couriers Moving" value={metrics.active_couriers ?? 0} loading={loading} icon={Truck} />
        <KpiTile label="Body Cams Active" value={metrics.body_cams_active ?? 0} loading={loading} icon={Camera} />
      </KpiGrid>

      <KpiGrid cols={4}>
        <KpiTile label="Open Tech Work Orders" value={metrics.open_tech_wo ?? 0} loading={loading} tone={metrics.open_tech_wo ? "warn" : "good"} />
        <KpiTile label="Open Loss Cases" value={metrics.open_loss ?? 0} loading={loading} tone={metrics.open_loss ? "warn" : "good"} />
        <KpiTile label="Investigations" value={metrics.investigations ?? 0} loading={loading} />
        <KpiTile label="Event Assignments" value={metrics.events ?? 0} loading={loading} />
      </KpiGrid>

      <Panel title="Live Sector Map">
        <LiveSectorMap />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Live Incidents">
          {incidents.length === 0 ? (
            <EmptyState message="No active incidents." />
          ) : (
            <div className="space-y-1">
              {incidents.map((i) => (
                <ListRow
                  key={i.id}
                  primary={i.title || i.incident_type || "Incident"}
                  secondary={`${i.severity ?? "—"} · ${i.status ?? "—"} · ${new Date(i.created_at).toLocaleString()}`}
                  trailing={<StatusBadge status={i.severity ?? "—"} tone={i.severity === "critical" ? "bad" : "warn"} />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Dispatch Queue">
          {dispatches.length === 0 ? (
            <EmptyState message="No active dispatches." />
          ) : (
            <div className="space-y-1">
              {dispatches.map((d) => (
                <ListRow
                  key={d.id}
                  primary={d.request_number || d.request_type || "Dispatch"}
                  secondary={`${d.priority ?? "—"} · ${new Date(d.created_at).toLocaleString()}`}
                  trailing={<StatusBadge status={d.status} tone={d.status === "dispatched" ? "info" : "warn"} />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Operational Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/platform/ops-manager/m/control-room" label="Control Room" desc="Live floor" icon={Radio} />
          <QuickLink to="/platform/ops-manager/m/incidents" label="Incidents" desc="All severity tiers" icon={AlertTriangle} />
          <QuickLink to="/platform/ops-manager/m/auto-dispatch" label="Auto-Dispatch" desc="Rules engine" icon={Activity} />
          <QuickLink to="/platform/ops-manager/m/mdt" label="MDT" desc="Vehicle terminals" icon={Radio} />
          <QuickLink to="/platform/ops-manager/m/supervision-patrol" label="Patrol & Compliance" desc="A–F scoring" icon={ClipboardCheck} />
          <QuickLink to="/platform/ops-manager/m/guard-monitoring" label="Guard Monitoring" desc="Live officer state" icon={Users} />
          <QuickLink to="/platform/ops-manager/m/fleet" label="Fleet" desc="Vehicle availability" icon={Truck} />
          <QuickLink to="/platform/ops-manager/m/field-officers" label="Field Officers" desc="Deployment" icon={Users} />
          <QuickLink to="/platform/coo/m/cctv" label="CCTV" desc="Surveillance grid" icon={Camera} />
          <QuickLink to="/platform/coo/m/investigations" label="Investigations" desc="Case management" icon={Search} />
          <QuickLink to="/platform/coo/m/loss-control" label="Loss Control" desc="Risk register" icon={MapPin} />
          <QuickLink to="/platform/coo/m/sop-library" label="SOP Library" desc="Procedures" icon={FileText} />
        </div>
      </Panel>
    </div>
  );
};

export default OpsManagerDashboard;
