import { Building2, BarChart3, Users, AlertTriangle, GraduationCap, Wallet, ShieldCheck, FileText, Calendar, ClipboardCheck, Briefcase, Truck } from "lucide-react";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { useDashboardMetrics, useDashboardRows } from "@/hooks/useDashboardMetrics";

const GMDashboard = () => {
  const { metrics, loading } = useDashboardMetrics([
    { key: "clients", table: "clients", filter: (q) => q.eq("status", "active") },
    { key: "contracts", table: "contracts", filter: (q) => q.eq("status", "active") },
    { key: "headcount", table: "staff", filter: (q) => q.eq("status", "active") },
    { key: "scheduled_shifts", table: "schedules", filter: (q) => q.gte("shift_date", new Date().toISOString().slice(0, 10)) },
    { key: "open_incidents", table: "incidents", filter: (q) => q.in("status", ["open", "in_progress"]) },
    { key: "leave_pending", table: "leave_records", filter: (q) => q.eq("status", "pending") },
    { key: "training_active", table: "training_sessions", filter: (q) => q.eq("status", "scheduled") },
    { key: "expiring_certs", table: "staff_certifications", filter: (q) => q.lte("expiry_date", new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)) },
    { key: "fleet", table: "vehicles" },
    { key: "active_patrols", table: "patrols", filter: (q) => q.eq("status", "in_progress") },
  ]);

  const { rows: complaints } = useDashboardRows<any>("communication_tickets", (q) => q.in("status", ["open", "escalated"]).order("created_at", { ascending: false }).limit(5));
  const { rows: leave } = useDashboardRows<any>("leave_records", (q) => q.eq("status", "pending").order("created_at", { ascending: false }).limit(5));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="MANAGEMENT PLATFORM · OPS"
        title=" Operations Overview"
        description="Cross-functional control: client portfolio, workforce, finance health and approval queue."
        icon={Building2}
        gradient="from-violet-500 to-purple-600"
      />

      <KpiGrid cols={5}>
        <KpiTile label="Active Clients" value={metrics.clients ?? 0} loading={loading} icon={Building2} />
        <KpiTile label="Live Contracts" value={metrics.contracts ?? 0} loading={loading} icon={FileText} />
        <KpiTile label="Active Staff" value={metrics.headcount ?? 0} loading={loading} icon={Users} />
        <KpiTile label="Upcoming Shifts" value={metrics.scheduled_shifts ?? 0} loading={loading} icon={Calendar} />
        <KpiTile label="Open Incidents" value={metrics.open_incidents ?? 0} loading={loading} tone={metrics.open_incidents ? "warn" : "good"} icon={AlertTriangle} />
      </KpiGrid>

      <KpiGrid cols={5}>
        <KpiTile label="Pending Leave" value={metrics.leave_pending ?? 0} loading={loading} tone={metrics.leave_pending ? "warn" : "good"} />
        <KpiTile label="Live Training" value={metrics.training_active ?? 0} loading={loading} icon={GraduationCap} />
        <KpiTile label="Cert Expiry < 60d" value={metrics.expiring_certs ?? 0} loading={loading} tone={metrics.expiring_certs ? "warn" : "good"} />
        <KpiTile label="Fleet Vehicles" value={metrics.fleet ?? 0} loading={loading} icon={Truck} />
        <KpiTile label="Active Patrols" value={metrics.active_patrols ?? 0} loading={loading} icon={ClipboardCheck} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Approval Inbox · Pending Leave">
          {leave.length === 0 ? (
            <EmptyState message="No pending leave requests." />
          ) : (
            <div className="space-y-1">
              {leave.map((l) => (
                <ListRow
                  key={l.id}
                  primary={`${l.leave_type ?? "Leave"} — ${l.days_requested ?? "?"} day(s)`}
                  secondary={`${l.start_date} → ${l.end_date}`}
                  trailing={<StatusBadge status="pending" tone="warn" />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Client Complaints / Tickets">
          {complaints.length === 0 ? (
            <EmptyState message="No open complaints." />
          ) : (
            <div className="space-y-1">
              {complaints.map((c) => (
                <ListRow
                  key={c.id}
                  primary={c.subject || c.ticket_type || "Ticket"}
                  secondary={`${c.priority ?? "—"} · ${new Date(c.created_at).toLocaleString()}`}
                  trailing={<StatusBadge status={c.status} tone={c.status === "escalated" ? "bad" : "warn"} />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Departmental Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/platform/gm/m/clients" label="Client Portfolio" desc="Accounts & contracts" icon={Building2} />
          <QuickLink to="/platform/gm/m/billing" label="Billing & Revenue" desc="AR, invoicing" icon={Wallet} />
          <QuickLink to="/platform/gm/m/staff" label="Staff" desc="HR overview" icon={Users} />
          <QuickLink to="/platform/gm/m/staff-scheduling" label="Scheduling" desc="Roster coverage" icon={Calendar} />
          <QuickLink to="/platform/gm/m/training" label="Training" desc="Capability matrix" icon={GraduationCap} />
          <QuickLink to="/platform/gm/m/incidents" label="Incident Oversight" desc="All severity tiers" icon={AlertTriangle} />
          <QuickLink to="/platform/gm/m/compliance" label="Compliance" desc="Policies & posture" icon={ShieldCheck} />
          <QuickLink to="/platform/gm/m/leave" label="Leave Approvals" desc="Approve / decline" icon={Calendar} />
          <QuickLink to="/platform/gm/m/analytics-dashboard" label="Analytics" desc="Trends & insights" icon={BarChart3} />
          <QuickLink to="/platform/gm/m/audit-log" label="Audit Log" desc="Accountability trail" icon={FileText} />
          <QuickLink to="/platform/gm/m/fleet" label="Fleet" desc="Vehicle utilisation" icon={Truck} />
          <QuickLink to="/platform/gm/m/control-dashboard" label="Ops Snapshot" desc="Live operational posture" icon={Briefcase} />
        </div>
      </Panel>
    </div>
  );
};

export default GMDashboard;
