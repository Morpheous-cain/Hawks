import { Coins, Truck, Users, AlertTriangle, FileText, ShieldCheck, MapPin, Activity, Boxes } from "lucide-react";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { useDashboardMetrics, useDashboardRows } from "@/hooks/useDashboardMetrics";

const CITDashboard = () => {
  const today = new Date().toISOString().slice(0, 10);
  const { metrics, loading } = useDashboardMetrics([
    { key: "courier_today", table: "courier_deliveries", filter: (q) => q.gte("created_at", `${today}T00:00:00`) },
    { key: "in_transit", table: "courier_deliveries", filter: (q) => q.in("status", ["in_transit", "picked_up"]) },
    { key: "delivered_today", table: "courier_deliveries", filter: (q) => q.eq("status", "delivered").gte("delivered_at", `${today}T00:00:00`) },
    { key: "riders", table: "courier_riders" },
    { key: "active_riders", table: "courier_riders", filter: (q) => q.eq("status", "active") },
    { key: "vehicles", table: "vehicles" },
    { key: "available_vehicles", table: "vehicles", filter: (q) => q.eq("status", "available") },
    { key: "incidents_today", table: "incidents", filter: (q) => q.gte("created_at", `${today}T00:00:00`).ilike("incident_type", "%cit%") },
    { key: "sos_active", table: "sos_alerts", filter: (q) => q.in("status", ["active", "acknowledged"]) },
    { key: "escort_active", table: "escort_missions", filter: (q) => q.in("status", ["scheduled", "in_progress"]) },
    { key: "deposits", table: "client_deposits" },
    { key: "open_dispatches", table: "dispatch_requests", filter: (q) => q.in("status", ["pending", "dispatched"]) },
  ]);

  const { rows: deliveries } = useDashboardRows<any>("courier_deliveries", (q) => q.order("created_at", { ascending: false }).limit(6));
  const { rows: sos } = useDashboardRows<any>("sos_alerts", (q) => q.in("status", ["active", "acknowledged"]).order("created_at", { ascending: false }).limit(5));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="CIT · Cash & In-Transit"
        title="CIT Operations Command"
        description="Live runs, crews, vault movements, route risk, dual-control verification, and SOS overlay."
        icon={Coins}
        gradient="from-yellow-500 to-amber-600"
      />

      <KpiGrid cols={6}>
        <KpiTile label="Runs Today" value={metrics.courier_today ?? 0} loading={loading} icon={Truck} />
        <KpiTile label="In Transit" value={metrics.in_transit ?? 0} loading={loading} icon={Activity} />
        <KpiTile label="Delivered Today" value={metrics.delivered_today ?? 0} loading={loading} tone="good" />
        <KpiTile label="Active Crews" value={metrics.active_riders ?? 0} loading={loading} icon={Users} />
        <KpiTile label="Available Vehicles" value={metrics.available_vehicles ?? 0} loading={loading} icon={Truck} />
        <KpiTile label="Open Dispatches" value={metrics.open_dispatches ?? 0} loading={loading} tone={metrics.open_dispatches ? "warn" : "good"} />
      </KpiGrid>

      <KpiGrid cols={5}>
        <KpiTile label="SOS Live" value={metrics.sos_active ?? 0} loading={loading} tone={metrics.sos_active ? "bad" : "good"} icon={AlertTriangle} />
        <KpiTile label="Active Escorts" value={metrics.escort_active ?? 0} loading={loading} icon={ShieldCheck} />
        <KpiTile label="CIT Incidents Today" value={metrics.incidents_today ?? 0} loading={loading} tone={metrics.incidents_today ? "warn" : "good"} />
        <KpiTile label="Crew Roster" value={metrics.riders ?? 0} loading={loading} icon={Users} />
        <KpiTile label="Vault Receipts" value={metrics.deposits ?? 0} loading={loading} icon={Boxes} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Recent Runs">
          {deliveries.length === 0 ? (
            <EmptyState message="No runs yet." />
          ) : (
            <div className="space-y-1">
              {deliveries.map((d) => (
                <ListRow
                  key={d.id}
                  primary={d.tracking_number || `Run ${d.id.slice(0, 8)}`}
                  secondary={`${d.pickup_location ?? "—"} → ${d.delivery_location ?? "—"}`}
                  trailing={<StatusBadge status={d.status} tone={d.status === "delivered" ? "good" : d.status === "failed" ? "bad" : "info"} />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Live SOS Alerts">
          {sos.length === 0 ? (
            <EmptyState message="No active SOS alerts." />
          ) : (
            <div className="space-y-1">
              {sos.map((s) => (
                <ListRow
                  key={s.id}
                  primary={s.alert_type ?? "SOS"}
                  secondary={`${s.location_description ?? "—"} · ${new Date(s.created_at).toLocaleString()}`}
                  trailing={<StatusBadge status={s.status} tone="bad" />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="CIT Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/platform/cit-manager/m/cit" label="CIT Operations" desc="Runs, vault, manifests" icon={Coins} />
          <QuickLink to="/platform/cit-manager/m/incidents" label="CIT Incidents" desc="Heists, variance, claims" icon={AlertTriangle} />
          <QuickLink to="/platform/cit-manager/m/fleet" label="Fleet" desc="Armoured vehicles" icon={Truck} />
          <QuickLink to="/platform/cit-manager/m/field-officers" label="Crews" desc="Officer assignments" icon={Users} />
          <QuickLink to="/platform/cit-manager/m/compliance" label="Compliance" desc="Regulatory posture" icon={ShieldCheck} />
          <QuickLink to="/platform/control-room/m/map" label="Live Map" desc="Track runs in real-time" icon={MapPin} />
          <QuickLink to="/platform/cit-officer/m/documents" label="Manifests" desc="Sealed-bag custody" icon={FileText} />
        </div>
      </Panel>
    </div>
  );
};

export default CITDashboard;
