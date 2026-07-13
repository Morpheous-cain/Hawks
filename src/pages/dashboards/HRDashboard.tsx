import { UserCog, Users, GraduationCap, Calendar, FileText, ShieldCheck, Package, ClipboardCheck, AlertTriangle, BarChart3 } from "lucide-react";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { useDashboardMetrics, useDashboardRows } from "@/hooks/useDashboardMetrics";

const HRDashboard = () => {
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  const { metrics, loading } = useDashboardMetrics([
    { key: "headcount", table: "staff", filter: (q) => q.eq("status", "active") },
    { key: "total_staff", table: "staff" },
    { key: "leave_pending", table: "leave_records", filter: (q) => q.eq("status", "pending") },
    { key: "leave_active", table: "leave_records", filter: (q) => q.eq("status", "approved").lte("start_date", today).gte("end_date", today) },
    { key: "training_scheduled", table: "training_sessions", filter: (q) => q.eq("status", "scheduled") },
    { key: "training_records", table: "training_records" },
    { key: "certs_active", table: "staff_certifications", filter: (q) => q.eq("status", "active") },
    { key: "certs_30d", table: "staff_certifications", filter: (q) => q.eq("status", "active").lte("expiry_date", in30) },
    { key: "certs_90d", table: "staff_certifications", filter: (q) => q.eq("status", "active").lte("expiry_date", in90) },
    { key: "documents", table: "documents" },
    { key: "attendance_today", table: "attendance", filter: (q) => q.gte("clock_in", `${today}T00:00:00`).lte("clock_in", `${today}T23:59:59`) },
    { key: "open_disciplinary", table: "welfare_events", filter: (q) => q.in("status", ["open", "in_progress"]) },
  ]);

  const { rows: leave } = useDashboardRows<any>("leave_records", (q) => q.eq("status", "pending").order("created_at", { ascending: false }).limit(6));
  const { rows: expiring } = useDashboardRows<any>("staff_certifications", (q) => q.eq("status", "active").lte("expiry_date", in30).order("expiry_date", { ascending: true }).limit(6));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Human Capital · HR"
        title="HR Command Center"
        description="Headcount, lifecycle, training compliance, statutory and welfare across the organisation."
        icon={UserCog}
        gradient="from-pink-500 to-rose-600"
      />

      <KpiGrid cols={6}>
        <KpiTile label="Active Headcount" value={metrics.headcount ?? 0} loading={loading} icon={Users} />
        <KpiTile label="Total Records" value={metrics.total_staff ?? 0} loading={loading} icon={Users} />
        <KpiTile label="On Leave Today" value={metrics.leave_active ?? 0} loading={loading} icon={Calendar} />
        <KpiTile label="Pending Leave" value={metrics.leave_pending ?? 0} loading={loading} tone={metrics.leave_pending ? "warn" : "good"} />
        <KpiTile label="Attendance Today" value={metrics.attendance_today ?? 0} loading={loading} icon={ClipboardCheck} />
        <KpiTile label="Open Welfare" value={metrics.open_disciplinary ?? 0} loading={loading} tone={metrics.open_disciplinary ? "warn" : "good"} icon={AlertTriangle} />
      </KpiGrid>

      <KpiGrid cols={5}>
        <KpiTile label="Active Certs" value={metrics.certs_active ?? 0} loading={loading} icon={ShieldCheck} />
        <KpiTile label="Cert Expiry < 30d" value={metrics.certs_30d ?? 0} loading={loading} tone={metrics.certs_30d ? "bad" : "good"} />
        <KpiTile label="Cert Expiry < 90d" value={metrics.certs_90d ?? 0} loading={loading} tone={metrics.certs_90d ? "warn" : "good"} />
        <KpiTile label="Training Scheduled" value={metrics.training_scheduled ?? 0} loading={loading} icon={GraduationCap} />
        <KpiTile label="Documents on File" value={metrics.documents ?? 0} loading={loading} icon={FileText} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Pending Leave Requests">
          {leave.length === 0 ? (
            <EmptyState message="No pending leave requests." />
          ) : (
            <div className="space-y-1">
              {leave.map((l) => (
                <ListRow
                  key={l.id}
                  primary={`${l.leave_type ?? "Leave"} · ${l.days_requested ?? "?"} day(s)`}
                  secondary={`${l.start_date} → ${l.end_date}`}
                  trailing={<StatusBadge status="pending" tone="warn" />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Certifications Expiring Soon">
          {expiring.length === 0 ? (
            <EmptyState message="No certifications expiring in 30 days." />
          ) : (
            <div className="space-y-1">
              {expiring.map((c) => (
                <ListRow
                  key={c.id}
                  primary={c.certification_type ?? "Certification"}
                  secondary={`Expires ${c.expiry_date}`}
                  trailing={<StatusBadge status={c.status} tone="warn" />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="HR Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/platform/hr-manager/m/staff" label="Staff Directory" desc="Records & onboarding" icon={Users} />
          <QuickLink to="/platform/hr-manager/m/staff-scheduling" label="Scheduling" desc="Rosters & coverage" icon={Calendar} />
          <QuickLink to="/platform/hr-manager/m/leave" label="Leave Management" desc="Approve / track" icon={Calendar} />
          <QuickLink to="/platform/hr-manager/m/training" label="Training" desc="Programs & enrolment" icon={GraduationCap} />
          <QuickLink to="/platform/hr-manager/m/compliance" label="Compliance" desc="Statutory posture" icon={ShieldCheck} />
          <QuickLink to="/platform/hr-manager/m/documents" label="Documents" desc="HR records" icon={FileText} />
          <QuickLink to="/platform/hr-manager/m/equipment" label="Equipment Issuance" desc="Onboarding kit" icon={Package} />
          <QuickLink to="/platform/hr-manager/m/field-officers" label="Field Officers" desc="Operational staff" icon={ClipboardCheck} />
          <QuickLink to="/platform/hr-manager/m/analytics-dashboard" label="Workforce Analytics" desc="Attrition & trends" icon={BarChart3} />
        </div>
      </Panel>
    </div>
  );
};

export default HRDashboard;
