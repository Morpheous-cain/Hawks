import { Briefcase, Package, Truck, FileText, ShieldCheck, AlertTriangle, Users, Building2, Wrench } from "lucide-react";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { useDashboardMetrics, useDashboardRows } from "@/hooks/useDashboardMetrics";

const AdminDashboard = () => {
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const { metrics, loading } = useDashboardMetrics([
    { key: "vehicles", table: "vehicles" },
    { key: "vehicles_available", table: "vehicles", filter: (q) => q.eq("status", "available") },
    { key: "vehicles_maintenance", table: "vehicles", filter: (q) => q.eq("status", "maintenance") },
    { key: "documents", table: "documents" },
    { key: "documents_expiring", table: "documents", filter: (q) => q.lte("expiry_date", in30) },
    { key: "tech_equipment", table: "technical_equipment" },
    { key: "work_orders_open", table: "technical_work_orders", filter: (q) => q.in("status", ["pending", "in_progress"]) },
    { key: "maintenance_due", table: "technical_maintenance_schedules", filter: (q) => q.lte("next_due_date", in30) },
    { key: "device_assignments", table: "device_assignment_log" },
    { key: "sites", table: "sites" },
  ]);

  const { rows: workOrders } = useDashboardRows<any>("technical_work_orders", (q) => q.in("status", ["pending", "in_progress"]).order("created_at", { ascending: false }).limit(6));
  const { rows: docs } = useDashboardRows<any>("documents", (q) => q.lte("expiry_date", in30).order("expiry_date", { ascending: true }).limit(6));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Administration"
        title="Admin Command"
        description="Assets, fleet, equipment, documents & licenses, procurement, vendors and facilities."
        icon={Briefcase}
        gradient="from-stone-500 to-zinc-600"
      />

      <KpiGrid cols={5}>
        <KpiTile label="Fleet Total" value={metrics.vehicles ?? 0} loading={loading} icon={Truck} />
        <KpiTile label="Available" value={metrics.vehicles_available ?? 0} loading={loading} tone="good" />
        <KpiTile label="In Maintenance" value={metrics.vehicles_maintenance ?? 0} loading={loading} tone={metrics.vehicles_maintenance ? "warn" : "good"} />
        <KpiTile label="Sites" value={metrics.sites ?? 0} loading={loading} icon={Building2} />
        <KpiTile label="Devices Issued" value={metrics.device_assignments ?? 0} loading={loading} icon={Package} />
      </KpiGrid>

      <KpiGrid cols={5}>
        <KpiTile label="Documents" value={metrics.documents ?? 0} loading={loading} icon={FileText} />
        <KpiTile label="Doc Expiry < 30d" value={metrics.documents_expiring ?? 0} loading={loading} tone={metrics.documents_expiring ? "warn" : "good"} icon={AlertTriangle} />
        <KpiTile label="Tech Equipment" value={metrics.tech_equipment ?? 0} loading={loading} icon={Wrench} />
        <KpiTile label="Open Work Orders" value={metrics.work_orders_open ?? 0} loading={loading} tone={metrics.work_orders_open ? "warn" : "good"} />
        <KpiTile label="Maintenance Due" value={metrics.maintenance_due ?? 0} loading={loading} tone={metrics.maintenance_due ? "warn" : "good"} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Open Work Orders">
          {workOrders.length === 0 ? (
            <EmptyState message="No open work orders." />
          ) : (
            <div className="space-y-1">
              {workOrders.map((w) => (
                <ListRow
                  key={w.id}
                  primary={w.title || w.work_order_number}
                  secondary={`${w.priority ?? "—"} · ${new Date(w.created_at).toLocaleString()}`}
                  trailing={<StatusBadge status={w.status} tone={w.status === "in_progress" ? "info" : "warn"} />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Documents Expiring Soon">
          {docs.length === 0 ? (
            <EmptyState message="No documents expiring in 30 days." />
          ) : (
            <div className="space-y-1">
              {docs.map((d) => (
                <ListRow
                  key={d.id}
                  primary={d.title || d.document_number}
                  secondary={`Expires ${d.expiry_date}`}
                  trailing={<StatusBadge status="expiring" tone="warn" />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Admin Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/platform/admin-manager/m/equipment" label="Equipment & Inventory" desc="Issuance & returns" icon={Package} />
          <QuickLink to="/platform/admin-manager/m/fleet" label="Fleet" desc="Vehicles, service, insurance" icon={Truck} />
          <QuickLink to="/platform/admin-manager/m/documents" label="Documents" desc="Licenses, contracts" icon={FileText} />
          <QuickLink to="/platform/admin-manager/m/compliance" label="Compliance" desc="Regulatory posture" icon={ShieldCheck} />
          <QuickLink to="/platform/admin-manager/m/audit-log" label="Audit Trail" desc="Admin accountability" icon={FileText} />
          <QuickLink to="/platform/control-room/m/technical-security" label="Tech Security" desc="Equipment lifecycle" icon={Wrench} />
          <QuickLink to="/platform/admin-officer/m/staff" label="Staff Directory" desc="People lookup" icon={Users} />
        </div>
      </Panel>
    </div>
  );
};

export default AdminDashboard;
