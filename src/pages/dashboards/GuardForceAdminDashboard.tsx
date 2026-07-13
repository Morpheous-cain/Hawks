import { ShieldHalf, Users, Calendar, Package, GraduationCap, ClipboardCheck, AlertTriangle, MapPin, FileText } from "lucide-react";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { useDashboardMetrics, useDashboardRows } from "@/hooks/useDashboardMetrics";

const GuardForceAdminDashboard = () => {
  const today = new Date().toISOString().slice(0, 10);
  const { metrics, loading } = useDashboardMetrics([
    { key: "officers", table: "staff", filter: (q) => q.eq("status", "active") },
    { key: "scheduled_today", table: "schedules", filter: (q) => q.eq("shift_date", today) },
    { key: "scheduled_week", table: "schedules", filter: (q) => q.gte("shift_date", today).lte("shift_date", new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) },
    { key: "attendance_today", table: "attendance", filter: (q) => q.gte("clock_in", `${today}T00:00:00`).lte("clock_in", `${today}T23:59:59`) },
    { key: "active_patrols", table: "patrols", filter: (q) => q.eq("status", "in_progress") },
    { key: "completed_patrols_today", table: "patrols", filter: (q) => q.eq("status", "completed").gte("ended_at", `${today}T00:00:00`) },
    { key: "checkpoints_today", table: "patrol_checkpoints", filter: (q) => q.gte("scanned_at", `${today}T00:00:00`) },
    { key: "leave_active", table: "leave_records", filter: (q) => q.eq("status", "approved").lte("start_date", today).gte("end_date", today) },
    { key: "leave_pending", table: "leave_records", filter: (q) => q.eq("status", "pending") },
    { key: "equipment_issued", table: "device_assignment_log" },
    { key: "training_scheduled", table: "training_sessions", filter: (q) => q.eq("status", "scheduled") },
    { key: "sites", table: "sites" },
  ]);

  const { rows: schedules } = useDashboardRows<any>("schedules", (q) => q.eq("shift_date", today).order("shift_start", { ascending: true }).limit(8));
  const { rows: noShows } = useDashboardRows<any>("attendance", (q) => q.eq("status", "absent").order("created_at", { ascending: false }).limit(5));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Workforce · Guard Force Admin"
        title="Guard Force Command"
        description="Deployment, rosters, parade state, attendance, equipment issue and reserve pool."
        icon={ShieldHalf}
        gradient="from-rose-500 to-red-600"
      />

      <KpiGrid cols={6}>
        <KpiTile label="Active Officers" value={metrics.officers ?? 0} loading={loading} icon={Users} />
        <KpiTile label="Scheduled Today" value={metrics.scheduled_today ?? 0} loading={loading} icon={Calendar} />
        <KpiTile label="Attendance Today" value={metrics.attendance_today ?? 0} loading={loading} tone="good" icon={ClipboardCheck} />
        <KpiTile label="On Leave" value={metrics.leave_active ?? 0} loading={loading} />
        <KpiTile label="Sites" value={metrics.sites ?? 0} loading={loading} icon={MapPin} />
        <KpiTile label="Pending Leave" value={metrics.leave_pending ?? 0} loading={loading} tone={metrics.leave_pending ? "warn" : "good"} />
      </KpiGrid>

      <KpiGrid cols={5}>
        <KpiTile label="Active Patrols" value={metrics.active_patrols ?? 0} loading={loading} icon={ClipboardCheck} />
        <KpiTile label="Patrols Done Today" value={metrics.completed_patrols_today ?? 0} loading={loading} tone="good" />
        <KpiTile label="Checkpoint Scans Today" value={metrics.checkpoints_today ?? 0} loading={loading} />
        <KpiTile label="Equipment Issued" value={metrics.equipment_issued ?? 0} loading={loading} icon={Package} />
        <KpiTile label="Training Scheduled" value={metrics.training_scheduled ?? 0} loading={loading} icon={GraduationCap} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Today's Roster">
          {schedules.length === 0 ? (
            <EmptyState message="No shifts scheduled for today." />
          ) : (
            <div className="space-y-1">
              {schedules.map((s) => (
                <ListRow
                  key={s.id}
                  primary={`${s.shift_start ?? "—"} → ${s.shift_end ?? "—"}`}
                  secondary={s.notes ?? "—"}
                  trailing={<StatusBadge status={s.status ?? "scheduled"} tone="info" />}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Absences">
          {noShows.length === 0 ? (
            <EmptyState message="No absences recorded." />
          ) : (
            <div className="space-y-1">
              {noShows.map((a) => (
                <ListRow
                  key={a.id}
                  primary={`Absence · ${a.staff_id?.slice(0, 8)}`}
                  secondary={new Date(a.created_at).toLocaleString()}
                  trailing={<StatusBadge status="absent" tone="bad" />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Workforce Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/platform/guard-force-admin/m/field-officers" label="Field Officers" desc="Provisioning & ranks" icon={Users} />
          <QuickLink to="/platform/guard-force-admin/m/staff-scheduling" label="Roster Builder" desc="Shifts & coverage" icon={Calendar} />
          <QuickLink to="/platform/guard-force-admin/m/equipment" label="Equipment Issuance" desc="Per-officer kit" icon={Package} />
          <QuickLink to="/platform/guard-force-admin/m/leave" label="Leave Tracking" desc="Approve & monitor" icon={Calendar} />
          <QuickLink to="/platform/guard-force-admin/m/training-drills" label="Training Drills" desc="Live drills" icon={GraduationCap} />
          <QuickLink to="/platform/guard-force-admin/m/supervision-patrol" label="Patrol Compliance" desc="A–F scoring" icon={ClipboardCheck} />
          <QuickLink to="/platform/control-room/m/incidents" label="Incident Register" desc="AWOL escalations" icon={AlertTriangle} />
          <QuickLink to="/platform/hr-manager/m/documents" label="HR Documents" desc="Officer files" icon={FileText} />
        </div>
      </Panel>
    </div>
  );
};

export default GuardForceAdminDashboard;
