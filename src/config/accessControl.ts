/**
 * Black Hawk SOC-OS · Access Control Matrix (single source of truth)
 * --------------------------------------------------------------
 * This file defines, for every designation, the EXACT permission
 * level on every module/sub-module in the system.
 *
 * It is consumed by:
 *   - usePermissions()             → UI gating (sidebars, buttons, routes)
 *   - <RequirePermission/>         → route + element guards
 *   - Backend RLS policies         → mirror these rules in Postgres
 *
 * Permission levels (escalating):
 *   "none"   → completely hidden, route blocked, API rejected
 *   "view"   → read-only
 *   "edit"   → read + update existing
 *   "create" → read + update + create new (implies edit)
 *   "delete" → full CRUD including destructive operations
 *
 * Conditional scoping is expressed via `scope`:
 *   "all"     → unrestricted across tenants/branches
 *   "region"  → only records in the user's region
 *   "branch"  → only records in the user's branch
 *   "self"    → only records the user owns / created / is assigned to
 */

export type Permission = "none" | "view" | "edit" | "create" | "delete";
export type Scope = "all" | "region" | "branch" | "self";

export type DesignationId =
  | "ceo" | "coo" | "gm"
  | "ops_manager" | "admin_manager" | "admin_officer"
  | "branch_manager" | "regional_manager"
  | "control"
  | "contract_manager" | "guard_force_admin"
  | "hr" | "hr_officer"
  | "finance" | "finance_officer" | "payroll_officer"
  | "cit_manager" | "cit_officer"
  | "courier_manager" | "courier_dispatcher" | "courier_officer"
  | "compliance" | "system_admin"
  | "customer_service_manager" | "customer_service_officer";

/** All gateable modules in the system. Add new modules here. */
export type ModuleKey =
  // Dashboards
  | "dashboard.executive" | "dashboard.operations" | "dashboard.finance"
  | "dashboard.hr" | "dashboard.compliance" | "dashboard.client"
  // Operations
  | "ops.controlRoom" | "ops.mdt" | "ops.dispatch" | "ops.incidents"
  | "ops.alarms" | "ops.fleet" | "ops.fieldOfficers" | "ops.patrol"
  | "ops.cctv" | "ops.bodycam"
  // Workforce
  | "hr.staff" | "hr.scheduling" | "hr.leave" | "hr.training"
  | "hr.documents" | "hr.equipment"
  // Finance
  | "fin.billing" | "fin.invoicing" | "fin.expenses" | "fin.bankRec"
  | "fin.lossControl"
  // Payroll
  | "pay.runs" | "pay.payslips" | "pay.statutory"
  // CIT (Cash & In-Transit)
  | "cit.operations" | "cit.runs" | "cit.manifests" | "cit.vault"
  | "cit.routes" | "cit.crews" | "cit.incidents"
  // Courier / Last-mile
  | "courier.operations" | "courier.deliveries" | "courier.dispatch"
  | "courier.riders" | "courier.routes" | "courier.incidents"
  // Clients & contracts
  | "client.management" | "client.contracts" | "client.portal"
  // Compliance & governance
  | "gov.compliance" | "gov.audit" | "gov.policies" | "gov.approvals"
  // Reporting
  | "rep.custom" | "rep.export" | "rep.analytics"
  // System administration
  | "sys.users" | "sys.roles" | "sys.settings" | "sys.tenants"
  | "sys.backup"
  // Customer Service
  | "cs.tickets" | "cs.complaints" | "cs.reports" | "cs.team" | "cs.config";

export interface Rule {
  level: Permission;
  scope?: Scope;
  /** Optional rule, e.g. "edit only if status=pending" */
  condition?: string;
  /** Why this designation has this level — drives audits & docs. */
  reason: string;
}

export type Matrix = Record<DesignationId, Partial<Record<ModuleKey, Rule>>>;

/* -------------------------------------------------------------- */
/* Helpers                                                        */
/* -------------------------------------------------------------- */
const r = (level: Permission, reason: string, scope: Scope = "all", condition?: string): Rule =>
  ({ level, scope, reason, condition });

const FULL: Rule = r("delete", "Executive authority — full CRUD across the platform.");
const VIEW_ALL: Rule = r("view", "Read-only oversight required for governance.");
const NONE: Rule = r("none", "Outside designation's job function.");

/* -------------------------------------------------------------- */
/* Matrix                                                         */
/* -------------------------------------------------------------- */
export const accessMatrix: Matrix = {
  /* ---------- C-Suite ---------- */
  ceo: {
    "dashboard.executive": FULL, "dashboard.operations": VIEW_ALL,
    "dashboard.finance": VIEW_ALL, "dashboard.hr": VIEW_ALL,
    "dashboard.compliance": VIEW_ALL,
    "ops.controlRoom": VIEW_ALL, "ops.incidents": r("edit", "Override authority on critical incidents."),
    "fin.billing": VIEW_ALL, "fin.lossControl": VIEW_ALL,
    "hr.staff": VIEW_ALL,
    "cit.operations": VIEW_ALL, "cit.runs": VIEW_ALL, "cit.vault": VIEW_ALL,
    "client.management": VIEW_ALL, "client.contracts": r("edit", "May approve strategic contracts."),
    "gov.compliance": FULL, "gov.audit": VIEW_ALL, "gov.approvals": FULL,
    "rep.custom": FULL, "rep.export": FULL, "rep.analytics": FULL,
    "sys.users": VIEW_ALL,
  },
  coo: {
    "dashboard.executive": VIEW_ALL, "dashboard.operations": FULL,
    "ops.controlRoom": FULL, "ops.mdt": FULL, "ops.dispatch": FULL,
    "ops.incidents": FULL, "ops.alarms": FULL, "ops.fleet": FULL,
    "ops.fieldOfficers": FULL, "ops.patrol": FULL, "ops.cctv": r("edit", "Operational oversight."),
    "ops.bodycam": r("edit", "Operational oversight."),
    "cit.operations": FULL, "cit.runs": FULL, "cit.vault": r("edit", "Sign-off on extraordinary movements."),
    "cit.routes": FULL, "cit.crews": FULL, "cit.incidents": FULL,
    "hr.scheduling": r("edit", "Adjust deployment to meet ops demand."),
    "client.management": VIEW_ALL, "gov.compliance": VIEW_ALL,
    "rep.custom": r("create", "Build operational reports."), "rep.export": r("create", "Operational exports."),
  },
  gm: {
    "dashboard.executive": VIEW_ALL, "dashboard.operations": VIEW_ALL,
    "dashboard.finance": VIEW_ALL, "dashboard.hr": VIEW_ALL,
    "client.management": r("delete", "Owns commercial relationship."),
    "client.contracts": r("delete", "Signs commercial contracts."),
    "fin.billing": r("edit", "Approves invoices and write-offs."),
    "hr.staff": r("edit", "Approves senior hiring and discipline."),
    "ops.fieldOfficers": VIEW_ALL, "ops.incidents": VIEW_ALL,
    "gov.compliance": VIEW_ALL, "rep.custom": r("create", "Commercial & delivery reports."),
  },

  /* ---------- Operations ---------- */
  ops_manager: {
    "dashboard.operations": FULL,
    "ops.controlRoom": r("edit", "Coordinates the room day to day."),
    "ops.mdt": FULL, "ops.dispatch": FULL, "ops.incidents": FULL,
    "ops.alarms": FULL, "ops.fleet": r("edit", "Allocates fleet resources."),
    "ops.fieldOfficers": r("edit", "Assigns and re-deploys officers."),
    "ops.patrol": FULL,
    "hr.scheduling": r("edit", "Adjust shifts to meet ops demand.", "branch"),
    "rep.export": r("create", "Operational reporting."),
  },
  control: {
    "dashboard.operations": VIEW_ALL,
    "ops.controlRoom": FULL, "ops.mdt": FULL, "ops.dispatch": FULL,
    "ops.incidents": r("create", "Logs and progresses incidents."),
    "ops.alarms": r("edit", "Acknowledges and routes alarms."),
    "ops.cctv": r("view", "Live monitoring only."), "ops.bodycam": r("view", "Live monitoring only."),
    "cit.runs": r("view", "Monitors live CIT movements."),
  },

  /* ---------- Branch & Regional ---------- */
  branch_manager: {
    "dashboard.operations": r("view", "Branch-scoped view.", "branch"),
    "dashboard.finance": r("view", "Branch P&L only.", "branch"),
    "client.management": r("edit", "Manages branch clients only.", "branch"),
    "hr.staff": r("edit", "Manages branch staff.", "branch"),
    "hr.scheduling": r("edit", "Branch roster.", "branch"),
    "fin.billing": r("view", "Branch billing visibility.", "branch"),
    "ops.incidents": r("edit", "Owns branch incident outcomes.", "branch"),
    "ops.fieldOfficers": r("edit", "Branch officers only.", "branch"),
    "rep.export": r("create", "Branch reports.", "branch"),
  },
  regional_manager: {
    "dashboard.executive": r("view", "Region-scoped exec view.", "region"),
    "dashboard.operations": r("view", "Region-scoped ops view.", "region"),
    "client.management": r("edit", "Regional client portfolio.", "region"),
    "hr.staff": r("view", "Regional headcount oversight.", "region"),
    "fin.billing": r("view", "Regional revenue visibility.", "region"),
    "ops.incidents": r("edit", "Region-wide escalations.", "region"),
    "gov.compliance": r("view", "Regional compliance posture.", "region"),
    "rep.export": r("create", "Regional reports.", "region"),
  },

  /* ---------- Admin ---------- */
  admin_manager: {
    "hr.documents": FULL, "hr.equipment": FULL,
    "ops.fleet": r("edit", "Procurement & maintenance scheduling."),
    "gov.compliance": r("view", "Vendor & facility compliance."),
    "rep.export": r("create", "Procurement & facility reports."),
  },
  admin_officer: {
    "hr.documents": r("create", "Maintains office records.", "all", "edit only own & branch docs"),
    "hr.equipment": r("edit", "Issues / receives equipment.", "branch"),
    "hr.staff": r("view", "Directory access only."),
  },

  /* ---------- Contract / Guard force ---------- */
  contract_manager: {
    "client.management": r("edit", "Owns assigned contracts.", "self", "scope to contracts assigned to this PM"),
    "client.contracts": r("create", "Creates and updates project documents.", "self"),
    "ops.fieldOfficers": r("view", "Officers on assigned contracts.", "self"),
    "fin.billing": r("view", "Project P&L view.", "self"),
    "hr.documents": r("view", "Contract docs only.", "self"),
    "gov.compliance": r("view", "Contract compliance.", "self"),
  },
  guard_force_admin: {
    "ops.fieldOfficers": FULL, "ops.patrol": r("edit", "Patrol compliance & assignments."),
    "hr.scheduling": FULL, "hr.leave": r("edit", "Approves leave for guard force."),
    "hr.equipment": r("edit", "Issues uniforms & gear."),
    "hr.training": r("view", "Tracks training currency for officers."),
    "rep.export": r("create", "Roster & deployment reports."),
  },

  /* ---------- HR ---------- */
  hr: {
    "dashboard.hr": FULL, "hr.staff": FULL, "hr.scheduling": r("edit", "Strategic scheduling."),
    "hr.leave": FULL, "hr.training": FULL, "hr.documents": FULL,
    "hr.equipment": r("view", "Compliance visibility on issuance."),
    "gov.compliance": r("view", "HR compliance only."),
    "rep.export": r("create", "HR reports."),
  },
  hr_officer: {
    "dashboard.hr": VIEW_ALL,
    "hr.staff": r("edit", "Maintains employee records."),
    "hr.leave": r("create", "Processes leave requests."),
    "hr.training": r("edit", "Records enrolments & completions."),
    "hr.documents": r("create", "Uploads HR docs."),
    "hr.equipment": r("view", "Visibility for HR queries."),
  },

  /* ---------- Finance ---------- */
  finance: {
    "dashboard.finance": FULL, "fin.billing": FULL, "fin.invoicing": FULL,
    "fin.expenses": r("edit", "Approves expenses."),
    "fin.bankRec": FULL, "fin.lossControl": r("edit", "Owns loss-control register."),
    "client.management": r("view", "Billing context."),
    "rep.custom": r("create", "Finance reports."), "rep.export": r("create", "Finance exports."),
  },
  finance_officer: {
    "dashboard.finance": VIEW_ALL,
    "fin.billing": r("create", "Issues invoices, allocates receipts."),
    "fin.invoicing": r("create", "Creates invoices."),
    "fin.expenses": r("edit", "Captures expenses; cannot approve own."),
    "fin.bankRec": r("edit", "Reconciles bank items."),
    "client.management": r("view", "Billing context."),
  },

  /* ---------- Payroll ---------- */
  payroll_officer: {
    "pay.runs": FULL, "pay.payslips": FULL, "pay.statutory": r("edit", "Calculates and files PAYE/NHIF/NSSF/NITA."),
    "hr.staff": r("view", "Read-only HR data for payroll calc."),
    "hr.leave": r("view", "Leave impact on pay."),
    "fin.billing": r("view", "Cost recharges visibility."),
  },

  /* ---------- CIT (Cash & In-Transit) ---------- */
  cit_manager: {
    "cit.operations": FULL, "cit.runs": FULL, "cit.manifests": r("edit", "Approves manifests."),
    "cit.vault": FULL, "cit.routes": FULL, "cit.crews": FULL, "cit.incidents": FULL,
    "ops.fieldOfficers": r("view", "Visibility on assigned CIT crews.", "self"),
    "gov.compliance": r("view", "CIT regulatory posture."),
    "rep.export": r("create", "CIT reports."),
  },
  cit_officer: {
    "cit.runs": r("edit", "Executes assigned runs.", "self"),
    "cit.manifests": r("create", "Creates manifests for own runs.", "self"),
    "cit.vault": r("edit", "Records custody handovers.", "self"),
    "cit.incidents": r("create", "Reports CIT incidents.", "self"),
  },

  /* ---------- Courier / Last-mile ---------- */
  courier_manager: {
    "courier.operations": FULL, "courier.deliveries": FULL, "courier.dispatch": FULL,
    "courier.riders": FULL, "courier.routes": FULL, "courier.incidents": FULL,
    "ops.fleet": r("edit", "Allocates courier fleet."),
    "ops.fieldOfficers": r("view", "Visibility on rider/driver pool."),
    "client.management": r("view", "Recipient & sender contacts."),
    "fin.billing": r("view", "Delivery cost recovery visibility."),
    "gov.compliance": r("view", "Courier regulatory posture."),
    "rep.export": r("create", "Courier reports."),
  },
  courier_dispatcher: {
    "courier.operations": r("edit", "Runs the dispatch board day to day."),
    "courier.dispatch": FULL,
    "courier.deliveries": r("edit", "Assigns, re-routes and closes deliveries."),
    "courier.riders": r("edit", "Allocates riders to jobs."),
    "courier.routes": r("view", "Reads route catalogue."),
    "courier.incidents": r("create", "Logs in-transit incidents."),
    "ops.fleet": r("view", "Vehicle availability."),
  },
  courier_officer: {
    "courier.deliveries": r("edit", "Executes assigned deliveries.", "self"),
    "courier.dispatch": r("view", "Sees own job queue.", "self"),
    "courier.routes": r("view", "Reads assigned route.", "self"),
    "courier.incidents": r("create", "Reports delivery incidents.", "self"),
  },

  /* ---------- Compliance & Governance ---------- */
  compliance: {
    "dashboard.compliance": FULL,
    "gov.compliance": FULL, "gov.audit": FULL, "gov.policies": FULL, "gov.approvals": FULL,
    "ops.incidents": r("view", "Investigates serious incidents."),
    "fin.lossControl": r("view", "Loss-control oversight."),
    "hr.training": r("view", "Training compliance."),
    "cit.operations": r("view", "CIT regulatory inspection."),
    "rep.export": r("create", "Compliance reports."),
  },

  /* ---------- System admin ---------- */
  system_admin: {
    "sys.users": FULL, "sys.roles": FULL, "sys.settings": FULL,
    "sys.tenants": FULL, "sys.backup": FULL,
    "gov.audit": VIEW_ALL,
    // Sys admin should NOT routinely access operational data
    "fin.billing": NONE, "hr.staff": r("view", "Account provisioning only."),
    "cit.operations": NONE,
  },

  /* ---------- Customer Service ---------- */
  customer_service_manager: {
    "cs.tickets": FULL,
    "cs.complaints": FULL,
    "cs.reports": r("view", "CS analytics and performance reporting."),
    "cs.team": r("delete", "Manages CS officer team and access."),
    "cs.config": r("delete", "Configures ticket categories and escalation rules."),
    "client.management": r("view", "View client records for ticket context."),
  },
  customer_service_officer: {
    "cs.tickets": r("edit", "Views assigned tickets, updates status, adds notes.", "self"),
    "cs.complaints": r("view", "View complaints linked to assigned tickets.", "self"),
    "client.management": r("view", "View client info for assigned tickets.", "self"),
  },
};

/* -------------------------------------------------------------- */
/* Public API                                                     */
/* -------------------------------------------------------------- */

export const getPermission = (
  designation: DesignationId | null | undefined,
  module: ModuleKey,
): Rule => {
  if (!designation) return NONE;
  return accessMatrix[designation]?.[module] ?? NONE;
};

export const can = (
  designation: DesignationId | null | undefined,
  module: ModuleKey,
  required: Exclude<Permission, "none"> = "view",
): boolean => {
  const order: Permission[] = ["none", "view", "edit", "create", "delete"];
  return order.indexOf(getPermission(designation, module).level) >= order.indexOf(required);
};

/** Modules this designation has at least "view" on. Used for sidebars. */
export const visibleModules = (designation: DesignationId | null | undefined): ModuleKey[] => {
  if (!designation) return [];
  const map = accessMatrix[designation] ?? {};
  return (Object.keys(map) as ModuleKey[]).filter((k) => map[k]?.level && map[k]!.level !== "none");
};
