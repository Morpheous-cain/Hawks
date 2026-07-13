/**
 * Module prefetch registry.
 *
 * Lives in its own module so both PlatformPage (lazy + idle prefetch) and
 * PlatformShell (hover/focus/touch prefetch on sidebar links) can share the
 * exact same dynamic-import functions. Importing here triggers Vite's
 * code-split chunk fetch — once a chunk is in the browser cache, the
 * subsequent React.lazy() resolves synchronously and there is no Suspense
 * flash on navigation.
 */

export const moduleImporters = {
  "executive-dashboard": () => import("@/pages/ExecutiveDashboard"),
  "duty-roster": () => import("@/pages/DutyRosterBoard"),
  "control-dashboard": () => import("@/pages/ControlRoomDashboard"),
  "control-room": () => import("@/pages/ControlRoom"),
  "strategic-advisory": () => import("@/pages/StrategicAdvisory"),
  "analytics": () => import("@/pages/Analytics"),
  "analytics-dashboard": () => import("@/pages/AnalyticsDashboard"),
  "compliance": () => import("@/pages/Compliance"),
  "audit-log": () => import("@/pages/AuditLog"),
  "tenants": () => import("@/pages/TenantAdmin"),
  "mdt": () => import("@/pages/MDT"),
  "mdt-management": () => import("@/pages/MDTManagement"),
  "incidents": () => import("@/pages/IncidentManagement"),
  "auto-dispatch": () => import("@/pages/AutoDispatchRules"),
  "guard-monitoring": () => import("@/pages/GuardTourReports"),
  "map": () => import("@/pages/Map"),
  "alarms": () => import("@/pages/Alarms"),
  "comms": () => import("@/pages/Communications"),
  "cctv": () => import("@/pages/CCTV"),
  "bodycam": () => import("@/pages/BodyCam"),
  "loss-control": () => import("@/pages/LossControl"),
  "technical-security": () => import("@/pages/TechnicalSecurity"),
  "dob": () => import("@/pages/DOB"),
  "access": () => import("@/pages/AccessControl"),
  "gps-patrol": () => import("@/pages/GPSPatrolTracking"),
  "supervision-patrol": () => import("@/pages/SupervisionPatrol"),
  "k9": () => import("@/pages/K9"),
  "escort": () => import("@/pages/Escort"),
  "investigations": () => import("@/pages/Investigations"),
  "patrol-checkpoints": () => import("@/pages/PatrolCheckpoints"),
  "staff": () => import("@/pages/StaffManagement"),
  "staff-scheduling": () => import("@/pages/StaffScheduling"),
  "clients": () => import("@/pages/ClientManagement"),
  "courier": () => import("@/pages/CourierOperations"),
  "courier-riders": () => import("@/pages/courier/CourierRidersPage"),
  "courier-dispatch": () => import("@/pages/courier/CourierDispatchPage"),
  "courier-cockpit": () => import("@/pages/courier/CourierCockpit"),
  "documents": () => import("@/pages/Documents"),
  "training": () => import("@/pages/TrainingManagement"),
  "training-drills": () => import("@/pages/TrainingDrills"),
  "event-security": () => import("@/pages/EventSecurity"),
  "settings": () => import("@/pages/Settings"),
  "field-officers": () => import("@/pages/FieldOfficersManagement"),
  "fleet": () => import("@/pages/FleetManagement"),
  "billing": () => import("@/pages/BillingInvoicing"),
  "leave": () => import("@/pages/LeaveManagement"),
  "sop-library": () => import("@/pages/SOPLibrary"),
  "emergency-plans": () => import("@/pages/EmergencyPlans"),
  "equipment": () => import("@/pages/EquipmentIssuance"),
  "war-room": () => import("@/pages/WarRoom"),
  "shift-handover": () => import("@/pages/ShiftHandover"),
  "cit": () => import("@/pages/CashInTransit"),
  "ceo-dashboard": () => import("@/pages/dashboards/CEODashboard"),
  "gm-dashboard": () => import("@/pages/dashboards/GMDashboard"),
  "hr-dashboard": () => import("@/pages/dashboards/HRDashboard"),
  "finance-dashboard": () => import("@/pages/dashboards/FinanceDashboard"),
  "cit-dashboard": () => import("@/pages/dashboards/CITDashboard"),
  "admin-dashboard": () => import("@/pages/dashboards/AdminDashboard"),
  "guard-force-admin-dashboard": () => import("@/pages/dashboards/GuardForceAdminDashboard"),
  "ops-manager-dashboard": () => import("@/pages/dashboards/OpsManagerDashboard"),
  "control-room-dashboard-v2": () => import("@/pages/dashboards/ControlRoomDashboardV2"),
  // New HR/Finance/Payroll/Governance/System modules
  "invoices": () => import("@/pages/modules/Invoices"),
  "expenses": () => import("@/pages/modules/Expenses"),
  "payroll-runs": () => import("@/pages/modules/PayrollRuns"),
  "payslips": () => import("@/pages/modules/Payslips"),
  "statutory-returns": () => import("@/pages/modules/StatutoryReturns"),
  "compliance-register": () => import("@/pages/modules/ComplianceRegister"),
  "policy-library": () => import("@/pages/modules/PolicyLibrary"),
  "approvals-inbox": () => import("@/pages/modules/ApprovalsInbox"),
  "system-settings": () => import("@/pages/modules/SystemSettings"),
  // Enterprise first wave
  "deployment-board": () => import("@/pages/modules/DeploymentBoard"),
  "patrol-intelligence": () => import("@/pages/modules/PatrolIntelligence"),
  "incident-command": () => import("@/pages/modules/IncidentCommand"),
  // HR Suite — full set of HR sub-modules
  "hr-attendance": () => import("@/pages/hr/HRAttendance"),
  "hr-recruitment": () => import("@/pages/hr/HRRecruitment"),
  "hr-onboarding": () => import("@/pages/hr/HROnboarding"),
  "hr-performance": () => import("@/pages/hr/HRPerformance"),
  "hr-disciplinary": () => import("@/pages/hr/HRDisciplinary"),
  // Customer Service modules
  "cs-manager-dashboard": () => import("@/pages/cs/CSManagerDashboard"),
  "cs-officer-dashboard": () => import("@/pages/cs/CSOfficerDashboard"),
  "cs-tickets": () => import("@/pages/cs/CSTickets"),
  "cs-complaints": () => import("@/pages/cs/CSComplaints"),
  "cs-reports": () => import("@/pages/cs/CSReports"),
  "cs-team": () => import("@/pages/cs/CSTeam"),
  "cs-config": () => import("@/pages/cs/CSConfig"),
} as const;

export type ModuleKey = keyof typeof moduleImporters;

// Track keys we've already kicked off so hover-spam doesn't re-fetch.
const inFlight = new Set<string>();

/** Fire-and-forget prefetch for a single module key. Safe to call repeatedly. */
export function prefetchModule(key: string | undefined | null): void {
  if (!key || inFlight.has(key)) return;
  const fn = (moduleImporters as Record<string, () => Promise<unknown>>)[key];
  if (!fn) return;
  inFlight.add(key);
  try {
    fn().finally(() => inFlight.delete(key));
  } catch {
    inFlight.delete(key);
  }
}

/** Detect Save-Data / 2g so we can skip aggressive prefetch on poor networks. */
export function isSlowNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as any).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const t = conn.effectiveType as string | undefined;
  return t === "slow-2g" || t === "2g";
}
