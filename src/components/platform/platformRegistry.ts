/**
 * Black Hawk Platform Registry
 * --------------------------------------------------------------
 * Each entry defines an INDEPENDENT, self-contained platform.
 * The PlatformShell renders ONE sidebar; module pages render INSIDE that
 * shell via nested routes — no jumping into the legacy WorkspaceShell.
 *
 * Each module declares a `moduleKey` (matched in PlatformPage's lazy registry)
 * and a `to` URL that lives under `/platform/:platformId/m/:moduleKey`.
 *
 * Modules also carry a `category` so the sidebar can group them into
 * collapsible sections (Command, Operations, Workforce, Commercial, …).
 */
import {
  Crown, Briefcase, Building2, Activity, MapPin, Globe, Monitor,
  ClipboardList, ShieldHalf, UserCog, UsersRound, Wallet, Receipt,
  Banknote, ShieldCheck, Shield, Coins, Boxes, FileText as FileTextIcon,
  Home, BarChart3, Users, Calendar, GraduationCap, FileText, ClipboardCheck,
  AlertTriangle, Radio, Truck, Package, Settings, KeyRound,
  Camera, Video, Search, Siren, DoorOpen, Dog, ShieldAlert, Wrench,
  Zap, MessageSquare as MessageSquareIcon, TrendingDown, Tablet, CalendarDays,
  type LucideIcon,
} from "lucide-react";

export type PlatformId =
  | "ceo" | "coo" | "gm"
  | "country-director" | "risk-director" | "finance-director"
  | "control-room"
  | "contract-manager" | "guard-force-admin"
  | "hr-manager" | "hr-officer"
  | "finance-manager" | "finance-officer" | "payroll-officer"
  | "ops-manager" | "admin-manager" | "admin-officer"
  | "regional-ops-manager" | "branch-ops-manager"
  | "asst-snr-ops-manager" | "area-manager" | "facilities-ops-manager"
  | "branch-manager" | "regional-manager"
  | "cit-manager" | "cit-officer"
  | "courier-manager" | "courier-dispatcher" | "courier-officer"
  | "compliance" | "system-admin"
  | "customer-service-manager" | "customer-service-officer";

/** Sidebar grouping label for a module. */
export type ModuleCategory =
  | "Overview"
  | "Command & Monitoring"
  | "Dispatch & Response"
  | "Field Oversight"
  | "Surveillance"
  | "Specialised Units"
  | "Workforce"
  | "Records & Continuity"
  | "Commercial"
  | "Compliance & Governance"
  | "Customer Service"
  | "System";

export interface PlatformModule {
  name: string;
  /** Path under /platform/{id}/* — usually /platform/{id}/m/{moduleKey} */
  to: string;
  icon: LucideIcon;
  desc?: string;
  /** Key in PlatformPage's lazy module registry */
  moduleKey?: string;
  /** Sidebar group. Defaults to "Modules" when omitted. */
  category?: ModuleCategory;
}

export interface PlatformKpi { label: string; value: string; hint?: string; }

export interface PlatformDefinition {
  id: PlatformId;
  name: string;
  eyebrow: string;
  mission: string;
  icon: LucideIcon;
  gradient: string;
  modules: PlatformModule[];
  kpis: PlatformKpi[];
  quickActions: { label: string; to: string }[];
}

const welcome = (id: PlatformId): PlatformModule => ({
  name: "Welcome",
  to: `/platform/${id}`,
  icon: Home,
  desc: "Your platform home",
  category: "Overview",
});

/** Helper: build a module entry that resolves inside the platform shell. */
const mod = (
  id: PlatformId,
  key: string,
  name: string,
  icon: LucideIcon,
  category: ModuleCategory = "Command & Monitoring",
  desc?: string,
): PlatformModule => ({
  name,
  to: `/platform/${id}/m/${key}`,
  moduleKey: key,
  icon,
  desc,
  category,
});

export const platforms: Record<PlatformId, PlatformDefinition> = {
  // ============== EXECUTIVE / COMMAND ==============
  ceo: {
    id: "ceo",
    name: "Chief Executive Officer",
    eyebrow: "Director Platform",
    mission: "Group strategy, board KPIs, governance, and global advisory.",
    icon: Crown,
    gradient: "from-blue-500 to-blue-600",
    modules: [
      welcome("ceo"),
      // Command & Monitoring
      mod("ceo", "ceo-dashboard", "CEO Dashboard", Crown, "Command & Monitoring", "Role-targeted executive cockpit"),
      
      mod("ceo", "duty-roster", "Duty Roster Board", ClipboardList, "Command & Monitoring", "Live SOC duty roster, shift coverage, and readiness posture"),
      mod("ceo", "control-room", "Control Room", Radio, "Command & Monitoring"),
      mod("ceo", "war-room", "Crisis Management Centre", ShieldAlert, "Command & Monitoring"),
      mod("ceo", "strategic-advisory", "Strategic Advisory", Globe, "Command & Monitoring"),
      mod("ceo", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("ceo", "map", "Operational Map", MapPin, "Command & Monitoring"),
      // Dispatch & Response
      mod("ceo", "incidents", "Incident Command Centre", AlertTriangle, "Dispatch & Response", "Unified incident command + cases — SOP, evidence, escalation, AI brief"),
      mod("ceo", "alarms", "Alarm & Mobile Response", Siren, "Dispatch & Response"),
      mod("ceo", "auto-dispatch", "Auto-Dispatch Rules", Zap, "Dispatch & Response"),
      mod("ceo", "mdt-management", "MDT Management", Radio, "Dispatch & Response"),
      mod("ceo", "shift-handover", "Shift Handover", ClipboardCheck, "Dispatch & Response"),
      // Field Oversight
      mod("ceo", "supervision-patrol", "Patrol Suite", ShieldHalf, "Field Oversight"),
      mod("ceo", "deployment-board", "Deployment Board", ClipboardList, "Field Oversight"),
      mod("ceo", "patrol-intelligence", "Patrol Intelligence", Activity, "Field Oversight"),
      mod("ceo", "dob", "Digital Occurrence Book", FileText, "Field Oversight"),
      mod("ceo", "access", "Access Control", DoorOpen, "Field Oversight"),
      // Surveillance
      mod("ceo", "cctv", "CCTV & Video", Camera, "Surveillance"),
      mod("ceo", "bodycam", "Body Cam", Video, "Surveillance"),
      mod("ceo", "loss-control", "Loss Control", Search, "Surveillance"),
      // Specialised Units
      mod("ceo", "technical-security", "Technical Security", Wrench, "Specialised Units"),
      mod("ceo", "k9", "K9 Management", Dog, "Specialised Units"),
      mod("ceo", "escort", "Escort & VIP", Shield, "Specialised Units"),
      mod("ceo", "investigations", "Investigations", Search, "Specialised Units"),
      mod("ceo", "cit", "Cash-in-Transit", Banknote, "Specialised Units"),
      mod("ceo", "courier", "Courier Operations", Truck, "Specialised Units"),
      mod("ceo", "event-security", "Event Security", Calendar, "Specialised Units"),
      // Workforce
      mod("ceo", "staff", "HR Suite", Users, "Workforce"),
      mod("ceo", "field-officers", "Field Officers", UsersRound, "Workforce"),
      mod("ceo", "training", "Training Management", GraduationCap, "Workforce"),
      mod("ceo", "training-drills", "Training Drills", ShieldAlert, "Workforce"),
      mod("ceo", "equipment", "Equipment Issuance", Package, "Workforce"),
      mod("ceo", "leave", "Leave Management", Calendar, "Workforce"),
      // Commercial
      mod("ceo", "clients", "Client Management", Building2, "Commercial"),
      mod("ceo", "billing", "Billing & Revenue", Wallet, "Commercial"),
      mod("ceo", "invoices", "Invoices", Receipt, "Commercial"),
      mod("ceo", "expenses", "Expenses", Coins, "Commercial"),
      mod("ceo", "payroll-runs", "Payroll Runs", Banknote, "Commercial"),
      mod("ceo", "payslips", "Payslips", Receipt, "Commercial"),
      mod("ceo", "statutory-returns", "Statutory Returns", FileText, "Commercial"),
      mod("ceo", "fleet", "Fleet Management", Truck, "Commercial"),
      mod("ceo", "tenants", "Tenants", Building2, "Commercial"),
      // Compliance & Governance
      mod("ceo", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("ceo", "compliance-register", "Compliance Register", ClipboardCheck, "Compliance & Governance"),
      mod("ceo", "policy-library", "Policy Library", FileText, "Compliance & Governance"),
      mod("ceo", "approvals-inbox", "Approvals Inbox", ClipboardCheck, "Compliance & Governance"),
      mod("ceo", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      // Records & Continuity
      mod("ceo", "documents", "Documents", FileText, "Records & Continuity"),
      mod("ceo", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("ceo", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("ceo", "comms", "Communications", MessageSquareIcon, "Records & Continuity"),
      // System
      mod("ceo", "settings", "Settings", Settings, "System"),
      mod("ceo", "system-settings", "System Settings", Settings, "System"),
    ],
    kpis: [
      { label: "Group Revenue (MTD)", value: "—" },
      { label: "Active Clients", value: "—" },
      { label: "Open Advisories", value: "—" },
      { label: "Compliance Posture", value: "—" },
    ],
    quickActions: [
      { label: "View Strategic Advisory", to: "/platform/ceo/m/strategic-advisory" },
      { label: "Open CEO Dashboard", to: "/platform/ceo/m/ceo-dashboard" },
    ],
  },

  coo: {
    id: "coo",
    name: "Chief Operations Officer",
    eyebrow: "Director Platform",
    mission: "Live operations command across response, dispatch and incidents.",
    icon: Briefcase,
    gradient: "from-cyan-500 to-cyan-600",
    modules: [
      welcome("coo"),
      mod("coo", "control-room", "Control Room Command Centre", Monitor, "Command & Monitoring", "Unified live ops cockpit — alarms, incidents, dispatch, CCTV, patrol & comms"),
      mod("coo", "duty-roster", "Duty Roster Board", ClipboardList, "Command & Monitoring", "Live SOC duty roster, shift coverage, and readiness posture"),
      mod("coo", "war-room", "Crisis Management Centre", ShieldAlert, "Command & Monitoring"),
      mod("coo", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("coo", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("coo", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("coo", "incidents", "Incident Command Centre", ShieldAlert, "Dispatch & Response", "Unified incident response — severity, timeline, evidence, escalation"),
      mod("coo", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("coo", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("coo", "auto-dispatch", "Auto-Dispatch", Activity, "Dispatch & Response"),
      mod("coo", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("coo", "deployment-board", "Deployment Board", ClipboardList, "Field Oversight", "Posts, fill rate, relief"),
      mod("coo", "field-officers", "Field Officers", Users, "Field Oversight"),
      mod("coo", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("coo", "cctv", "CCTV", Camera, "Surveillance"),
      mod("coo", "bodycam", "Body Cams", Video, "Surveillance"),
      mod("coo", "k9", "K9", Dog, "Specialised Units"),
      mod("coo", "escort", "Escort", ShieldHalf, "Specialised Units"),
      mod("coo", "courier", "Courier Ops", Truck, "Specialised Units"),
      mod("coo", "investigations", "Investigations", Search, "Specialised Units"),
      mod("coo", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("coo", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("coo", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("coo", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("coo", "training-drills", "Training Drills", GraduationCap, "Workforce"),
    ],
    kpis: [
      { label: "Active Incidents", value: "—" },
      { label: "SLA Breaches Today", value: "—" },
      { label: "Officers On-Shift", value: "—" },
      { label: "Dispatch Queue", value: "—" },
    ],
    quickActions: [
      { label: "Open Control Room", to: "/platform/coo/m/control-room" },
      { label: "Review Incidents", to: "/platform/coo/m/incidents" },
    ],
  },

  gm: {
    id: "gm",
    name: "General Manager",
    eyebrow: "Management Platform",
    mission: "Commercial, workforce, compliance, and delivery oversight.",
    icon: Building2,
    gradient: "from-violet-500 to-violet-600",
    modules: [
      welcome("gm"),
      mod("gm", "gm-dashboard", "GM Dashboard", Building2, "Command & Monitoring", "General Manager command view"),
      mod("gm", "executive-dashboard", "Executive Dashboard", BarChart3, "Command & Monitoring"),
      mod("gm", "duty-roster", "Duty Roster Board", ClipboardList, "Command & Monitoring", "Live SOC duty roster, shift coverage, and readiness posture"),
      // No Control Dashboard — removed to avoid /control-room duplicate
      mod("gm", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("gm", "clients", "Clients", Building2, "Commercial"),
      mod("gm", "billing", "Billing", Wallet, "Commercial"),
      mod("gm", "staff", "Staff", Users, "Workforce"),
      mod("gm", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("gm", "field-officers", "Field Officers", ClipboardCheck, "Workforce"),
      mod("gm", "leave", "Leave", Calendar, "Workforce"),
      mod("gm", "training", "Training", GraduationCap, "Workforce"),
      mod("gm", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("gm", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("gm", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("gm", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      mod("gm", "documents", "Documents", FileText, "Records & Continuity"),
    ],
    kpis: [
      { label: "Active Contracts", value: "—" },
      { label: "Gross Margin", value: "—" },
      { label: "Open Complaints", value: "—" },
      { label: "Training Compliance", value: "—" },
    ],
    quickActions: [
      { label: "Open Clients", to: "/platform/gm/m/clients" },
      { label: "Review Billing", to: "/platform/gm/m/billing" },
    ],
  },

  "control-room": {
    id: "control-room",
    name: "Control Room",
    eyebrow: "Operations Platform",
    mission: "Live monitoring, dispatch, and 24/7 incident coordination.",
    icon: Monitor,
    gradient: "from-slate-500 to-slate-600",
    modules: [
      welcome("control-room"),
      mod("control-room", "control-room", "Control Room Command Centre", Monitor, "Command & Monitoring", "Unified live ops cockpit — alarms, incidents, dispatch, CCTV, patrol & comms"),
      mod("control-room", "duty-roster", "Duty Roster Board", ClipboardList, "Command & Monitoring", "Live SOC duty roster, shift coverage, and readiness posture"),
      mod("control-room", "war-room", "Crisis Management Centre", ShieldAlert, "Command & Monitoring"),
      mod("control-room", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("control-room", "mdt-management", "MDT Management Console", Monitor, "Dispatch & Response", "Dispatcher oversight + Officer MDT terminal"),
      mod("control-room", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("control-room", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("control-room", "incidents", "Incident Command Centre", ShieldAlert, "Dispatch & Response", "Unified incident response — severity, timeline, evidence, escalation"),
      mod("control-room", "auto-dispatch", "Auto-Dispatch", Activity, "Dispatch & Response"),
      mod("control-room", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("control-room", "deployment-board", "Deployment Board", ClipboardList, "Field Oversight"),
      mod("control-room", "field-officers", "Field Officers", Users, "Field Oversight"),
      mod("control-room", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("control-room", "cctv", "CCTV", Camera, "Surveillance"),
      mod("control-room", "bodycam", "Body Cams", Video, "Surveillance"),
      mod("control-room", "access", "Access Control", DoorOpen, "Surveillance"),
      mod("control-room", "k9", "K9", Dog, "Specialised Units"),
      mod("control-room", "escort", "Escort", ShieldHalf, "Specialised Units"),
      mod("control-room", "courier", "Courier Ops", Truck, "Specialised Units"),
      mod("control-room", "investigations", "Investigations", Search, "Specialised Units"),
      mod("control-room", "technical-security", "Technical Security", Settings, "Specialised Units"),
      mod("control-room", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("control-room", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("control-room", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("control-room", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("control-room", "training-drills", "Training Drills", GraduationCap, "Workforce"),
    ],
    kpis: [
      { label: "Live Alarms", value: "—" },
      { label: "MDT Units Online", value: "—" },
      { label: "Queued Calls", value: "—" },
      { label: "SOS Active", value: "—" },
    ],
    quickActions: [
      { label: "Open Live Map", to: "/platform/control-room/m/map" },
      { label: "Open Alarms", to: "/platform/control-room/m/alarms" },
    ],
  },

  // ============== DELIVERY / WORKFORCE ==============
  "contract-manager": {
    id: "contract-manager",
    name: "Contract / Project Manager",
    eyebrow: "Delivery Platform",
    mission: "Steer contracts and projects through milestones, scope and burn.",
    icon: ClipboardList,
    gradient: "from-sky-500 to-sky-600",
    modules: [
      welcome("contract-manager"),
      mod("contract-manager", "clients", "Clients & Contracts", Building2, "Commercial"),
      mod("contract-manager", "billing", "Billing (Project)", Wallet, "Commercial"),
      mod("contract-manager", "staff", "Assigned Staff", Users, "Workforce"),
      mod("contract-manager", "field-officers", "Field Officers", ClipboardCheck, "Workforce"),
      mod("contract-manager", "incidents", "Project Incidents", AlertTriangle, "Dispatch & Response"),
      mod("contract-manager", "documents", "Project Documents", FileText, "Records & Continuity"),
      mod("contract-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Active Contracts", value: "—" },
      { label: "Milestones Due", value: "—" },
      { label: "Project Burn", value: "—" },
      { label: "Scope Changes", value: "—" },
    ],
    quickActions: [
      { label: "Open Clients", to: "/platform/contract-manager/m/clients" },
      { label: "Open Documents", to: "/platform/contract-manager/m/documents" },
    ],
  },

  "guard-force-admin": {
    id: "guard-force-admin",
    name: "Guard Force Admin",
    eyebrow: "Workforce Platform",
    mission: "Roster posts, manage discipline, and keep every site fully manned.",
    icon: ShieldHalf,
    gradient: "from-rose-500 to-rose-600",
    modules: [
      welcome("guard-force-admin"),
      mod("guard-force-admin", "guard-force-admin-dashboard", "Guard Force Dashboard", ShieldHalf, "Command & Monitoring", "Workforce cockpit"),
      mod("guard-force-admin", "field-officers", "Field Officers", ClipboardCheck, "Workforce"),
      mod("guard-force-admin", "staff-scheduling", "Staff Scheduling", Calendar, "Workforce"),
      mod("guard-force-admin", "leave", "Leave", Calendar, "Workforce"),
      mod("guard-force-admin", "training-drills", "Training Drills", GraduationCap, "Workforce"),
      mod("guard-force-admin", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("guard-force-admin", "equipment", "Equipment Issuance", Package, "Records & Continuity"),
    ],
    kpis: [
      { label: "Posts Filled", value: "—" },
      { label: "No-Shows Today", value: "—" },
      { label: "Open Discipline", value: "—" },
      { label: "Cert. Expiring 30d", value: "—" },
    ],
    quickActions: [
      { label: "Open Roster", to: "/platform/guard-force-admin/m/staff-scheduling" },
      { label: "Open Field Officers", to: "/platform/guard-force-admin/m/field-officers" },
    ],
  },

  // ============== HR ==============
  "hr-manager": {
    id: "hr-manager",
    name: "HR Manager",
    eyebrow: "Strategic HR Platform",
    mission: "Workforce strategy, capability, and compliance across Black Hawk SOC-OS.",
    icon: UserCog,
    gradient: "from-pink-500 to-pink-600",
    modules: [
      welcome("hr-manager"),
      mod("hr-manager", "hr-dashboard", "HR Dashboard", UserCog, "Command & Monitoring", "Strategic HR cockpit"),
      mod("hr-manager", "staff", "Employee Directory", Users, "Workforce", "Profiles & records"),
      mod("hr-manager", "hr-recruitment", "Recruitment", Briefcase, "Workforce", "Candidates & pipeline"),
      mod("hr-manager", "hr-onboarding", "Onboarding", ClipboardList, "Workforce", "New-hire checklists"),
      mod("hr-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce", "Shift rosters"),
      mod("hr-manager", "hr-attendance", "Attendance", ClipboardCheck, "Workforce", "Live check-in log"),
      mod("hr-manager", "leave", "Leave", Calendar, "Workforce", "Requests & balances"),
      mod("hr-manager", "training", "Training", GraduationCap, "Workforce", "Programs & sessions"),
      mod("hr-manager", "hr-performance", "Performance", BarChart3, "Workforce", "Appraisals & ratings"),
      mod("hr-manager", "hr-disciplinary", "Disciplinary", ShieldAlert, "Workforce", "Cases & grievances"),
      mod("hr-manager", "payroll-runs", "Payroll", Banknote, "Commercial", "Payroll runs & payslips"),
      mod("hr-manager", "payslips", "Payslips", Receipt, "Commercial", "Issued payslips"),
      mod("hr-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance", "Statutory posture"),
      mod("hr-manager", "documents", "Documents", FileText, "Records & Continuity", "HR records"),
      mod("hr-manager", "equipment", "Equipment Issuance", Package, "Records & Continuity", "Uniforms & kit"),
      mod("hr-manager", "analytics-dashboard", "HR Analytics", BarChart3, "Command & Monitoring", "Workforce insights"),
    ],
    kpis: [
      { label: "Headcount", value: "—" },
      { label: "Attrition (90d)", value: "—" },
      { label: "Training Complete", value: "—" },
      { label: "Open Requisitions", value: "—" },
    ],
    quickActions: [
      { label: "Open Staff", to: "/platform/hr-manager/m/staff" },
      { label: "Open Training", to: "/platform/hr-manager/m/training" },
    ],
  },

  "hr-officer": {
    id: "hr-officer",
    name: "HR Officer",
    eyebrow: "Officer Platform",
    mission: "Day-to-day HR transactions: leave, onboarding, queries, documents.",
    icon: UsersRound,
    gradient: "from-fuchsia-500 to-fuchsia-600",
    modules: [
      welcome("hr-officer"),
      mod("hr-officer", "staff", "Staff", Users, "Workforce"),
      mod("hr-officer", "leave", "Leave Processing", Calendar, "Workforce"),
      mod("hr-officer", "training", "Training Enrolments", GraduationCap, "Workforce"),
      mod("hr-officer", "field-officers", "Field Officers", ClipboardCheck, "Workforce"),
      mod("hr-officer", "equipment", "Equipment Issuance", Package, "Records & Continuity"),
      mod("hr-officer", "documents", "Documents", FileText, "Records & Continuity"),
    ],
    kpis: [
      { label: "Leave Requests Today", value: "—" },
      { label: "Onboarding Pipeline", value: "—" },
      { label: "Document Expiries", value: "—" },
      { label: "Open HR Queries", value: "—" },
    ],
    quickActions: [
      { label: "Process Leave", to: "/platform/hr-officer/m/leave" },
      { label: "Open Staff", to: "/platform/hr-officer/m/staff" },
    ],
  },

  // ============== FINANCE ==============
  "finance-manager": {
    id: "finance-manager",
    name: "Finance Manager",
    eyebrow: "Finance Platform",
    mission: "Steer revenue, working capital, and profitability for Black Hawk SOC-OS.",
    icon: Wallet,
    gradient: "from-emerald-500 to-emerald-600",
    modules: [
      welcome("finance-manager"),
      mod("finance-manager", "finance-dashboard", "Finance Dashboard", Wallet, "Command & Monitoring", "Finance cockpit"),
      mod("finance-manager", "billing", "Billing & Invoicing", Wallet, "Commercial"),
      mod("finance-manager", "invoices", "Invoices", Receipt, "Commercial"),
      mod("finance-manager", "expenses", "Expenses", Wallet, "Commercial"),
      mod("finance-manager", "approvals-inbox", "Approvals", ClipboardCheck, "Compliance & Governance"),
      mod("finance-manager", "tenants", "Tenants", Building2, "Commercial"),
      mod("finance-manager", "loss-control", "Loss Control", AlertTriangle, "Compliance & Governance"),
      mod("finance-manager", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      mod("finance-manager", "documents", "Documents", FileText, "Records & Continuity"),
    ],
    kpis: [
      { label: "Revenue MTD", value: "—" },
      { label: "AR > 60d", value: "—" },
      { label: "Cash Position", value: "—" },
      { label: "Profit Margin", value: "—" },
    ],
    quickActions: [
      { label: "Open Billing", to: "/platform/finance-manager/m/billing" },
      { label: "Open Loss Control", to: "/platform/finance-manager/m/loss-control" },
    ],
  },

  "finance-officer": {
    id: "finance-officer",
    name: "Finance Officer",
    eyebrow: "Officer Platform",
    mission: "Run invoicing, receipts, expenses and bank reconciliation cleanly.",
    icon: Receipt,
    gradient: "from-green-500 to-green-600",
    modules: [
      welcome("finance-officer"),
      mod("finance-officer", "billing", "Billing & Invoicing", Wallet, "Commercial"),
      mod("finance-officer", "invoices", "Invoices", Receipt, "Commercial"),
      mod("finance-officer", "expenses", "Expenses", Wallet, "Commercial"),
      mod("finance-officer", "clients", "Clients", Building2, "Commercial"),
      mod("finance-officer", "documents", "Documents", FileText, "Records & Continuity"),
      mod("finance-officer", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Invoices To Issue", value: "—" },
      { label: "Receipts To Allocate", value: "—" },
      { label: "Expense Approvals", value: "—" },
      { label: "Bank Items Pending", value: "—" },
    ],
    quickActions: [
      { label: "Open Billing", to: "/platform/finance-officer/m/billing" },
      { label: "Open Clients", to: "/platform/finance-officer/m/clients" },
    ],
  },

  "payroll-officer": {
    id: "payroll-officer",
    name: "Payroll Officer",
    eyebrow: "Officer Platform",
    mission: "Run accurate, statutorily compliant payroll for every officer.",
    icon: Banknote,
    gradient: "from-lime-500 to-lime-600",
    modules: [
      welcome("payroll-officer"),
      mod("payroll-officer", "payroll-runs", "Payroll Runs", Banknote, "Commercial"),
      mod("payroll-officer", "payslips", "Payslips", Receipt, "Commercial"),
      mod("payroll-officer", "statutory-returns", "Statutory Returns", ShieldCheck, "Compliance & Governance"),
      mod("payroll-officer", "staff", "Staff", Users, "Workforce"),
      mod("payroll-officer", "leave", "Leave", Calendar, "Workforce"),
      mod("payroll-officer", "billing", "Billing", Wallet, "Commercial"),
      mod("payroll-officer", "documents", "Documents", FileText, "Records & Continuity"),
      mod("payroll-officer", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Cycle Progress", value: "—" },
      { label: "Payslips Ready", value: "—" },
      { label: "PAYE Due", value: "—" },
      { label: "NHIF / NSSF / NITA", value: "—" },
    ],
    quickActions: [
      { label: "Open Staff", to: "/platform/payroll-officer/m/staff" },
      { label: "Open Billing", to: "/platform/payroll-officer/m/billing" },
    ],
  },

  // ============== OPS / ADMIN / BRANCH ==============
  "ops-manager": {
    id: "ops-manager",
    name: "Operations Manager",
    eyebrow: "Operations Platform",
    mission: "Orchestrate field deployment, dispatch, surveillance and resource allocation across all live operations.",
    icon: Activity,
    gradient: "from-orange-500 to-orange-600",
    modules: [
      welcome("ops-manager"),
      mod("ops-manager", "ops-manager-dashboard", "Ops Dashboard", Activity, "Command & Monitoring", "Operations cockpit"),
      mod("ops-manager", "deployment-board", "Deployment Board", ClipboardList, "Field Oversight"),
      mod("ops-manager", "control-room", "Control Room Command Centre", Monitor, "Command & Monitoring", "Unified live ops cockpit"),
      // control-dashboard removed – use /control-room instead
      mod("ops-manager", "war-room", "Crisis Management Centre", ShieldAlert, "Command & Monitoring"),
      mod("ops-manager", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("ops-manager", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("ops-manager", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("ops-manager", "incidents", "Incident Command Centre", ShieldAlert, "Dispatch & Response", "Unified incident response — severity, timeline, evidence, escalation"),
      mod("ops-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("ops-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("ops-manager", "auto-dispatch", "Auto-Dispatch", Activity, "Dispatch & Response"),
      mod("ops-manager", "field-officers", "Field Officers", Users, "Field Oversight"),
      mod("ops-manager", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("ops-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("ops-manager", "cctv", "CCTV", Camera, "Surveillance"),
      mod("ops-manager", "bodycam", "Body Cams", Video, "Surveillance"),
      mod("ops-manager", "access", "Access Control", DoorOpen, "Surveillance"),
      mod("ops-manager", "k9", "K9", Dog, "Specialised Units"),
      mod("ops-manager", "escort", "Escort", ShieldHalf, "Specialised Units"),
      mod("ops-manager", "courier", "Courier Ops", Truck, "Specialised Units"),
      mod("ops-manager", "investigations", "Investigations", Search, "Specialised Units"),
      mod("ops-manager", "event-security", "Event Security", Calendar, "Specialised Units"),
      mod("ops-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("ops-manager", "training-drills", "Training Drills", GraduationCap, "Workforce"),
      mod("ops-manager", "equipment", "Equipment Issuance", Package, "Workforce"),
      mod("ops-manager", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("ops-manager", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("ops-manager", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("ops-manager", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("ops-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("ops-manager", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Units Deployed", value: "—" },
      { label: "Open Incidents", value: "—" },
      { label: "Dispatch Queue", value: "—" },
      { label: "SLA Compliance", value: "—" },
    ],
    quickActions: [
      { label: "Open Control Room", to: "/platform/ops-manager/m/control-room" },
      { label: "Open Field Officers", to: "/platform/ops-manager/m/field-officers" },
    ],
  },

  "admin-manager": {
    id: "admin-manager",
    name: "Admin Manager",
    eyebrow: "Administration Platform",
    mission: "Office administration, procurement, facilities and supplier governance.",
    icon: Briefcase,
    gradient: "from-stone-500 to-stone-600",
    modules: [
      welcome("admin-manager"),
      mod("admin-manager", "admin-dashboard", "Admin Dashboard", Briefcase, "Command & Monitoring", "Administration cockpit"),
      mod("admin-manager", "equipment", "Equipment & Inventory", Package, "Records & Continuity"),
      mod("admin-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("admin-manager", "documents", "Documents", FileText, "Records & Continuity"),
      mod("admin-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("admin-manager", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Open POs", value: "—" },
      { label: "Stock Alerts", value: "—" },
      { label: "Supplier Issues", value: "—" },
      { label: "Facility Tickets", value: "—" },
    ],
    quickActions: [
      { label: "Open Equipment", to: "/platform/admin-manager/m/equipment" },
      { label: "Open Documents", to: "/platform/admin-manager/m/documents" },
    ],
  },

  "admin-officer": {
    id: "admin-officer",
    name: "Admin Officer",
    eyebrow: "Officer Platform",
    mission: "Day-to-day office admin, supplies, correspondence and front office.",
    icon: FileTextIcon,
    gradient: "from-zinc-500 to-zinc-600",
    modules: [
      welcome("admin-officer"),
      mod("admin-officer", "equipment", "Equipment Issuance", Package, "Records & Continuity"),
      mod("admin-officer", "documents", "Documents", FileText, "Records & Continuity"),
      mod("admin-officer", "staff", "Staff Directory", Users, "Workforce"),
    ],
    kpis: [
      { label: "Pending Requests", value: "—" },
      { label: "Stationery Stock", value: "—" },
      { label: "Visitors Today", value: "—" },
      { label: "Items To Issue", value: "—" },
    ],
    quickActions: [
      { label: "Open Equipment", to: "/platform/admin-officer/m/equipment" },
      { label: "Open Documents", to: "/platform/admin-officer/m/documents" },
    ],
  },

  "branch-manager": {
    id: "branch-manager",
    name: "Branch Manager",
    eyebrow: "Branch Platform",
    mission: "Run a single branch end-to-end — clients, workforce, operations, P&L and compliance.",
    icon: MapPin,
    gradient: "from-amber-500 to-amber-600",
    modules: [
      welcome("branch-manager"),
      mod("branch-manager", "gm-dashboard", "Branch Dashboard", Building2, "Command & Monitoring", "Branch performance cockpit"),
      mod("branch-manager", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      // control-dashboard removed – use /control-room instead
      mod("branch-manager", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("branch-manager", "clients", "Branch Clients", Building2, "Commercial"),
      mod("branch-manager", "billing", "Billing", Wallet, "Commercial"),
      mod("branch-manager", "incidents", "Branch Incidents", AlertTriangle, "Dispatch & Response"),
      mod("branch-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("branch-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("branch-manager", "field-officers", "Field Officers", ClipboardCheck, "Field Oversight"),
      mod("branch-manager", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("branch-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("branch-manager", "cctv", "CCTV", Camera, "Surveillance"),
      mod("branch-manager", "bodycam", "Body Cams", Video, "Surveillance"),
      mod("branch-manager", "staff", "Branch Staff", Users, "Workforce"),
      mod("branch-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("branch-manager", "leave", "Leave", Calendar, "Workforce"),
      mod("branch-manager", "training", "Training", GraduationCap, "Workforce"),
      mod("branch-manager", "equipment", "Equipment Issuance", Package, "Workforce"),
      mod("branch-manager", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("branch-manager", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("branch-manager", "documents", "Documents", FileText, "Records & Continuity"),
      mod("branch-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("branch-manager", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Branch Revenue (MTD)", value: "—" },
      { label: "Active Sites", value: "—" },
      { label: "Officers Deployed", value: "—" },
      { label: "Open Incidents", value: "—" },
    ],
    quickActions: [
      { label: "Open Clients", to: "/platform/branch-manager/m/clients" },
      { label: "Open Incidents", to: "/platform/branch-manager/m/incidents" },
    ],
  },

  "regional-manager": {
    id: "regional-manager",
    name: "Regional Manager",
    eyebrow: "Regional Platform",
    mission: "Oversee multiple branches — regional KPIs, escalations, workforce and growth.",
    icon: Globe,
    gradient: "from-indigo-500 to-indigo-600",
    modules: [
      welcome("regional-manager"),
      mod("regional-manager", "executive-dashboard", "Executive Dashboard", BarChart3, "Command & Monitoring"),
      mod("regional-manager", "gm-dashboard", "Regional Dashboard", Building2, "Command & Monitoring"),
      // control-dashboard removed – use /control-room instead
      mod("regional-manager", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("regional-manager", "strategic-advisory", "Strategic Advisory", Globe, "Command & Monitoring"),
      mod("regional-manager", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("regional-manager", "clients", "Clients (Region)", Building2, "Commercial"),
      mod("regional-manager", "billing", "Billing", Wallet, "Commercial"),
      mod("regional-manager", "tenants", "Branches", Building2, "Commercial"),
      mod("regional-manager", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("regional-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("regional-manager", "field-officers", "Field Officers", ClipboardCheck, "Field Oversight"),
      mod("regional-manager", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("regional-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("regional-manager", "staff", "Staff (Region)", Users, "Workforce"),
      mod("regional-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("regional-manager", "training", "Training", GraduationCap, "Workforce"),
      mod("regional-manager", "leave", "Leave", Calendar, "Workforce"),
      mod("regional-manager", "documents", "Documents", FileText, "Records & Continuity"),
      mod("regional-manager", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("regional-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("regional-manager", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Region Revenue", value: "—" },
      { label: "Branches", value: "—" },
      { label: "Open Escalations", value: "—" },
      { label: "Compliance Posture", value: "—" },
    ],
    quickActions: [
      { label: "Open Executive", to: "/platform/regional-manager/m/executive-dashboard" },
      { label: "Open Clients", to: "/platform/regional-manager/m/clients" },
    ],
  },

  // ============== CIT ==============
  "cit-manager": {
    id: "cit-manager",
    name: "Cash & In-Transit Manager",
    eyebrow: "CIT Platform",
    mission: "Run vault, route risk, crew assignments, dispatch, surveillance and CIT compliance end-to-end.",
    icon: Coins,
    gradient: "from-yellow-500 to-yellow-600",
    modules: [
      welcome("cit-manager"),
      mod("cit-manager", "cit-dashboard", "CIT Dashboard", Coins, "Command & Monitoring", "Cash & In-Transit cockpit"),
      // control-dashboard removed – use /control-room instead
      mod("cit-manager", "map", "Live Route Map", Globe, "Command & Monitoring"),
      mod("cit-manager", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("cit-manager", "cit", "CIT Operations", Coins, "Dispatch & Response"),
      mod("cit-manager", "auto-dispatch", "Auto-Dispatch", Activity, "Dispatch & Response"),
      mod("cit-manager", "incidents", "CIT Incidents", AlertTriangle, "Dispatch & Response"),
      mod("cit-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("cit-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("cit-manager", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("cit-manager", "field-officers", "Crews", Users, "Field Oversight"),
      mod("cit-manager", "fleet", "Armoured Fleet", Truck, "Field Oversight"),
      mod("cit-manager", "gps-patrol", "GPS Tracking", MapPin, "Field Oversight"),
      mod("cit-manager", "guard-monitoring", "Crew Monitoring", ClipboardCheck, "Field Oversight"),
      mod("cit-manager", "cctv", "CCTV", Camera, "Surveillance"),
      mod("cit-manager", "bodycam", "Body Cams", Video, "Surveillance"),
      mod("cit-manager", "escort", "Armed Escort", ShieldHalf, "Specialised Units"),
      mod("cit-manager", "courier", "Courier Ops", Truck, "Specialised Units"),
      mod("cit-manager", "investigations", "Investigations", Search, "Specialised Units"),
      mod("cit-manager", "staff-scheduling", "Crew Scheduling", Calendar, "Workforce"),
      mod("cit-manager", "training-drills", "Training Drills", GraduationCap, "Workforce"),
      mod("cit-manager", "equipment", "Equipment & Weapons", Package, "Workforce"),
      mod("cit-manager", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("cit-manager", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("cit-manager", "documents", "Manifests & Records", FileText, "Records & Continuity"),
      mod("cit-manager", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("cit-manager", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("cit-manager", "billing", "Billing", Wallet, "Commercial"),
      mod("cit-manager", "clients", "Clients", Building2, "Commercial"),
      mod("cit-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("cit-manager", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      mod("cit-manager", "loss-control", "Loss Control", AlertTriangle, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Active Runs", value: "—" },
      { label: "Vault Balance", value: "—" },
      { label: "High-Risk Routes", value: "—" },
      { label: "Crews On Duty", value: "—" },
    ],
    quickActions: [
      { label: "Open CIT Operations", to: "/platform/cit-manager/m/cit" },
      { label: "Open Crews", to: "/platform/cit-manager/m/field-officers" },
    ],
  },

  "cit-officer": {
    id: "cit-officer",
    name: "Cash & In-Transit Officer",
    eyebrow: "Officer Platform",
    mission: "Execute runs cleanly: manifests, custody handovers, route checkpoints and live comms.",
    icon: Boxes,
    gradient: "from-amber-600 to-amber-700",
    modules: [
      welcome("cit-officer"),
      mod("cit-officer", "cit", "My Runs", Coins, "Dispatch & Response"),
      mod("cit-officer", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("cit-officer", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("cit-officer", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("cit-officer", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("cit-officer", "map", "Route Map", Globe, "Command & Monitoring"),
      mod("cit-officer", "gps-patrol", "GPS Tracking", MapPin, "Field Oversight"),
      mod("cit-officer", "patrol-checkpoints", "Checkpoints", ClipboardList, "Field Oversight"),
      mod("cit-officer", "fleet", "Vehicle", Truck, "Field Oversight"),
      mod("cit-officer", "bodycam", "Body Cam", Video, "Surveillance"),
      mod("cit-officer", "documents", "Manifests", FileText, "Records & Continuity"),
      mod("cit-officer", "dob", "Occurrence Book", FileText, "Records & Continuity"),
      mod("cit-officer", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("cit-officer", "sop-library", "SOPs", FileText, "Records & Continuity"),
      mod("cit-officer", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("cit-officer", "equipment", "Equipment", Package, "Workforce"),
      mod("cit-officer", "leave", "Leave", Calendar, "Workforce"),
      mod("cit-officer", "training", "Training", GraduationCap, "Workforce"),
    ],
    kpis: [
      { label: "Runs Today", value: "—" },
      { label: "Pending Handovers", value: "—" },
      { label: "Open Discrepancies", value: "—" },
      { label: "Route Alerts", value: "—" },
    ],
    quickActions: [
      { label: "Open My Runs", to: "/platform/cit-officer/m/cit" },
      { label: "Open Manifests", to: "/platform/cit-officer/m/documents" },
    ],
  },

  // ============== COURIER / LAST-MILE ==============
  "courier-manager": {
    id: "courier-manager",
    name: "Courier Manager",
    eyebrow: "Last-Mile Platform",
    mission: "Own the last-mile: dispatch SLAs, rider performance, route economics and on-time delivery.",
    icon: Truck,
    gradient: "from-teal-500 to-teal-600",
    modules: [
      welcome("courier-manager"),
      mod("courier-manager", "courier-cockpit", "Courier Cockpit", BarChart3, "Command & Monitoring", "Live deliveries, on-time %, rider utilisation"),
      mod("courier-manager", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("courier-manager", "map", "Live Delivery Map", Globe, "Command & Monitoring"),
      mod("courier-manager", "courier", "Courier Operations", Truck, "Dispatch & Response", "Deliveries, riders, dispatch board"),
      mod("courier-manager", "auto-dispatch", "Auto-Dispatch", Activity, "Dispatch & Response"),
      mod("courier-manager", "incidents", "Delivery Incidents", AlertTriangle, "Dispatch & Response"),
      mod("courier-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("courier-manager", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("courier-manager", "courier-riders", "Riders & Drivers", Users, "Field Oversight", "Courier roster from courier_riders"),
      mod("courier-manager", "courier-dispatch", "Dispatch Board", Activity, "Field Oversight", "Live courier_deliveries assignment"),
      mod("courier-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("courier-manager", "gps-patrol", "GPS Tracking", MapPin, "Field Oversight"),
      mod("courier-manager", "bodycam", "Body Cams", Video, "Surveillance"),
      mod("courier-manager", "staff-scheduling", "Rider Scheduling", Calendar, "Workforce"),
      mod("courier-manager", "training-drills", "Training Drills", GraduationCap, "Workforce"),
      mod("courier-manager", "equipment", "Equipment", Package, "Workforce"),
      mod("courier-manager", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("courier-manager", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("courier-manager", "documents", "Waybills & Records", FileText, "Records & Continuity"),
      mod("courier-manager", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("courier-manager", "billing", "Billing", Wallet, "Commercial"),
      mod("courier-manager", "clients", "Clients", Building2, "Commercial"),
      mod("courier-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("courier-manager", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Deliveries Today", value: "—" },
      { label: "On-Time %", value: "—" },
      { label: "Riders Active", value: "—" },
      { label: "Open Incidents", value: "—" },
    ],
    quickActions: [
      { label: "Open Courier Ops", to: "/platform/courier-manager/m/courier" },
      { label: "Open Riders", to: "/platform/courier-manager/m/courier-riders" },
    ],
  },

  "courier-dispatcher": {
    id: "courier-dispatcher",
    name: "Courier Dispatcher",
    eyebrow: "Operations Platform",
    mission: "Run the dispatch board live: accept jobs, assign riders, route, and clear the queue.",
    icon: Activity,
    gradient: "from-teal-600 to-cyan-600",
    modules: [
      welcome("courier-dispatcher"),
      mod("courier-dispatcher", "courier-cockpit", "Cockpit", BarChart3, "Command & Monitoring", "Live queue, SLAs and rider load"),
      mod("courier-dispatcher", "courier-dispatch", "Dispatch Board", Truck, "Dispatch & Response", "Assign riders to live courier_deliveries"),
      mod("courier-dispatcher", "courier", "Courier Operations", Truck, "Dispatch & Response"),
      mod("courier-dispatcher", "auto-dispatch", "Auto-Dispatch Rules", Activity, "Dispatch & Response"),
      mod("courier-dispatcher", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("courier-dispatcher", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("courier-dispatcher", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("courier-dispatcher", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("courier-dispatcher", "gps-patrol", "GPS Tracking", MapPin, "Field Oversight"),
      mod("courier-dispatcher", "courier-riders", "Riders Pool", Users, "Field Oversight"),
      mod("courier-dispatcher", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("courier-dispatcher", "dob", "Occurrence Book", FileText, "Records & Continuity"),
      mod("courier-dispatcher", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("courier-dispatcher", "sop-library", "SOPs", FileText, "Records & Continuity"),
    ],
    kpis: [
      { label: "Queued Jobs", value: "—" },
      { label: "In-Transit", value: "—" },
      { label: "Late SLA", value: "—" },
      { label: "Available Riders", value: "—" },
    ],
    quickActions: [
      { label: "Open Dispatch Board", to: "/platform/courier-dispatcher/m/courier-dispatch" },
      { label: "Open Live Map", to: "/platform/courier-dispatcher/m/map" },
    ],
  },

  "courier-officer": {
    id: "courier-officer",
    name: "Courier Officer",
    eyebrow: "Officer Platform",
    mission: "Supervise riders on the ground: deliveries QA, exceptions, proof-of-delivery and incidents.",
    icon: ClipboardList,
    gradient: "from-cyan-600 to-teal-700",
    modules: [
      welcome("courier-officer"),
      mod("courier-officer", "courier-cockpit", "Cockpit", BarChart3, "Command & Monitoring", "My deliveries snapshot & exceptions"),
      mod("courier-officer", "courier", "My Deliveries", Truck, "Dispatch & Response"),
      mod("courier-officer", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("courier-officer", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("courier-officer", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("courier-officer", "map", "Route Map", Globe, "Command & Monitoring"),
      mod("courier-officer", "gps-patrol", "GPS Tracking", MapPin, "Field Oversight"),
      mod("courier-officer", "fleet", "Vehicle", Truck, "Field Oversight"),
      mod("courier-officer", "bodycam", "Body Cam", Video, "Surveillance"),
      mod("courier-officer", "documents", "Waybills", FileText, "Records & Continuity"),
      mod("courier-officer", "dob", "Occurrence Book", FileText, "Records & Continuity"),
      mod("courier-officer", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("courier-officer", "sop-library", "SOPs", FileText, "Records & Continuity"),
      mod("courier-officer", "equipment", "Equipment", Package, "Workforce"),
      mod("courier-officer", "leave", "Leave", Calendar, "Workforce"),
    ],
    kpis: [
      { label: "Deliveries Today", value: "—" },
      { label: "Pending PoD", value: "—" },
      { label: "Exceptions", value: "—" },
      { label: "On-Time %", value: "—" },
    ],
    quickActions: [
      { label: "Open My Deliveries", to: "/platform/courier-officer/m/courier" },
      { label: "Open Waybills", to: "/platform/courier-officer/m/documents" },
    ],
  },
  // ============== CUSTOMER SERVICE ==============
  "customer-service-manager": {
    id: "customer-service-manager",
    name: "Customer Service Manager",
    eyebrow: "Management Platform",
    mission: "Manage all client support tickets, complaints, officer team, and escalation configuration.",
    icon: MessageSquareIcon,
    gradient: "from-violet-500 to-purple-600",
    modules: [
      welcome("customer-service-manager"),
      mod("customer-service-manager", "cs-manager-dashboard", "CS Dashboard", MessageSquareIcon, "Customer Service", "Customer service command view"),
      mod("customer-service-manager", "cs-tickets", "All Tickets", ClipboardList, "Customer Service", "View and manage all support tickets"),
      mod("customer-service-manager", "cs-complaints", "Complaints", AlertTriangle, "Customer Service", "Complaint escalation and management"),
      mod("customer-service-manager", "cs-reports", "Reports & Analytics", BarChart3, "Customer Service", "CS performance metrics and trends"),
      mod("customer-service-manager", "cs-team", "Team Management", Users, "Customer Service", "CS officer assignments and access"),
      mod("customer-service-manager", "cs-config", "Configuration", Settings, "System", "Ticket categories and escalation rules"),
      mod("customer-service-manager", "clients", "Client Records", Building2, "Commercial", "Client information"),
    ],
    kpis: [
      { label: "Open Tickets", value: "—" },
      { label: "Avg Resolution Time", value: "—" },
      { label: "SLA Breaches", value: "—" },
      { label: "Open Complaints", value: "—" },
    ],
    quickActions: [
      { label: "View All Tickets", to: "/platform/customer-service-manager/m/cs-tickets" },
      { label: "View Complaints", to: "/platform/customer-service-manager/m/cs-complaints" },
    ],
  },

  "customer-service-officer": {
    id: "customer-service-officer",
    name: "Customer Service Officer",
    eyebrow: "Officer Platform",
    mission: "Handle assigned client support tickets — update status, add notes, and view client records.",
    icon: MessageSquareIcon,
    gradient: "from-violet-400 to-violet-500",
    modules: [
      welcome("customer-service-officer"),
      mod("customer-service-officer", "cs-officer-dashboard", "My Dashboard", MessageSquareIcon, "Customer Service", "My tickets overview"),
      mod("customer-service-officer", "cs-tickets", "My Tickets", ClipboardList, "Customer Service", "View and update assigned tickets"),
      mod("customer-service-officer", "clients", "Client Info", Building2, "Commercial", "Client information"),
    ],
    kpis: [
      { label: "My Open Tickets", value: "—" },
      { label: "Resolved Today", value: "—" },
      { label: "Pending Client", value: "—" },
      { label: "Avg Response Time", value: "—" },
    ],
    quickActions: [
      { label: "My Tickets", to: "/platform/customer-service-officer/m/cs-tickets" },
    ],
  },

  compliance: {
    id: "compliance",
    name: "Compliance & Governance",
    eyebrow: "Governance Platform",
    mission: "Audit trails, policy, regulator readiness and risk register oversight.",
    icon: ShieldCheck,
    gradient: "from-teal-500 to-teal-600",
    modules: [
      welcome("compliance"),
      mod("compliance", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("compliance", "compliance-register", "Controls Register", ShieldCheck, "Compliance & Governance"),
      mod("compliance", "policy-library", "Policy Library", FileText, "Compliance & Governance"),
      mod("compliance", "approvals-inbox", "Approvals", ClipboardCheck, "Compliance & Governance"),
      mod("compliance", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      mod("compliance", "loss-control", "Loss Control", AlertTriangle, "Compliance & Governance"),
      mod("compliance", "training", "Training Compliance", GraduationCap, "Workforce"),
      mod("compliance", "documents", "Documents", FileText, "Records & Continuity"),
    ],
    kpis: [
      { label: "Open Audits", value: "—" },
      { label: "Policy Breaches", value: "—" },
      { label: "Cert. Expiring 30d", value: "—" },
      { label: "Risk Register Items", value: "—" },
    ],
    quickActions: [
      { label: "Open Compliance", to: "/platform/compliance/m/compliance" },
      { label: "Open Audit Log", to: "/platform/compliance/m/audit-log" },
    ],
  },

  "system-admin": {
    id: "system-admin",
    name: "System Administrator",
    eyebrow: "System Platform · Master Access",
    mission: "Master control: every module, every designation, every permission. Build, configure and govern the entire Black Hawk platform from here.",
    icon: Shield,
    gradient: "from-red-500 to-red-600",
    modules: [
      welcome("system-admin"),
      mod("system-admin", "settings", "Settings", Settings, "System"),
      mod("system-admin", "system-settings", "System Configuration", Settings, "System"),
      mod("system-admin", "tenants", "Tenants", Building2, "System"),
      mod("system-admin", "approvals-inbox", "Approvals", ClipboardCheck, "Compliance & Governance"),
      mod("system-admin", "compliance-register", "Controls Register", ShieldCheck, "Compliance & Governance"),
      mod("system-admin", "policy-library", "Policy Library", FileText, "Compliance & Governance"),
      mod("system-admin", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      mod("system-admin", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("system-admin", "executive-dashboard", "Executive Dashboard", BarChart3, "Command & Monitoring"),
      mod("system-admin", "control-room", "Control Room Command Centre", Monitor, "Command & Monitoring", "Unified live ops cockpit"),
      // control-dashboard removed – use /control-room instead
      mod("system-admin", "war-room", "Crisis Management Centre", ShieldAlert, "Command & Monitoring"),
      mod("system-admin", "strategic-advisory", "Strategic Advisory", Globe, "Command & Monitoring"),
      mod("system-admin", "analytics", "Analytics", BarChart3, "Command & Monitoring"),
      mod("system-admin", "analytics-dashboard", "Analytics Dashboard", BarChart3, "Command & Monitoring"),
      mod("system-admin", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("system-admin", "mdt", "MDT", Radio, "Dispatch & Response"),
      mod("system-admin", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("system-admin", "auto-dispatch", "Auto-Dispatch", Activity, "Dispatch & Response"),
      mod("system-admin", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("system-admin", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("system-admin", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("system-admin", "field-officers", "Field Officers", ClipboardCheck, "Field Oversight"),
      mod("system-admin", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("system-admin", "cctv", "CCTV", Camera, "Surveillance"),
      mod("system-admin", "bodycam", "Body Cams", Video, "Surveillance"),
      mod("system-admin", "loss-control", "Loss Control", AlertTriangle, "Surveillance"),
      mod("system-admin", "technical-security", "Technical Security", Settings, "Surveillance"),
      mod("system-admin", "access", "Access Control", DoorOpen, "Surveillance"),
      mod("system-admin", "k9", "K9", Dog, "Specialised Units"),
      mod("system-admin", "escort", "Escort", ShieldHalf, "Specialised Units"),
      mod("system-admin", "investigations", "Investigations", Search, "Specialised Units"),
      mod("system-admin", "courier", "Courier Ops", Truck, "Specialised Units"),
      mod("system-admin", "cit", "Cash & In-Transit", Coins, "Specialised Units"),
      mod("system-admin", "event-security", "Event Security", Calendar, "Specialised Units"),
      mod("system-admin", "staff", "Staff Management", Users, "Workforce"),
      mod("system-admin", "staff-scheduling", "Staff Scheduling", Calendar, "Workforce"),
      mod("system-admin", "leave", "Leave", Calendar, "Workforce"),
      mod("system-admin", "training", "Training", GraduationCap, "Workforce"),
      mod("system-admin", "training-drills", "Training Drills", GraduationCap, "Workforce"),
      mod("system-admin", "equipment", "Equipment Issuance", Package, "Workforce"),
      mod("system-admin", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("system-admin", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("system-admin", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("system-admin", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("system-admin", "documents", "Documents", FileText, "Records & Continuity"),
      mod("system-admin", "clients", "Clients", Building2, "Commercial"),
      mod("system-admin", "billing", "Billing & Invoicing", Wallet, "Commercial"),
    ],
    kpis: [
      { label: "Active Users", value: "—" },
      { label: "Failed Logins 24h", value: "—" },
      { label: "System Health", value: "—" },
      { label: "Pending Provisioning", value: "—" },
    ],
    quickActions: [
      { label: "Open Settings", to: "/platform/system-admin/m/settings" },
      { label: "Open Tenants", to: "/platform/system-admin/m/tenants" },
    ],
  },

  // ============== EXECUTIVE / DIRECTOR PLATFORMS (added) ==============
  "country-director": {
    id: "country-director",
    name: "Country Director / Managing Director",
    eyebrow: "Executive Platform",
    mission: "Nationwide corporate strategy, profitability and group governance.",
    icon: Crown,
    gradient: "from-blue-600 to-indigo-700",
    modules: [
      welcome("country-director"),
      // Command & Monitoring
      mod("country-director", "ceo-dashboard", "Country Cockpit", Crown, "Command & Monitoring"),
      mod("country-director", "executive-dashboard", "Executive Dashboard", BarChart3, "Command & Monitoring"),
      mod("country-director", "control-dashboard", "Control Dashboard", Monitor, "Command & Monitoring"),
      mod("country-director", "control-room", "Control Room", Radio, "Command & Monitoring"),
      mod("country-director", "war-room", "Crisis Management Centre", ShieldAlert, "Command & Monitoring"),
      mod("country-director", "strategic-advisory", "Strategic Advisory", Globe, "Command & Monitoring"),
      mod("country-director", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("country-director", "map", "Operational Map", MapPin, "Command & Monitoring"),
      // Dispatch & Response
      mod("country-director", "incidents", "Incident Command Centre", AlertTriangle, "Dispatch & Response", "Unified incident command + cases — SOP, evidence, escalation, AI brief"),
      mod("country-director", "alarms", "Alarm & Mobile Response", Siren, "Dispatch & Response"),
      mod("country-director", "auto-dispatch", "Auto-Dispatch Rules", Zap, "Dispatch & Response"),
      mod("country-director", "mdt-management", "MDT Management", Radio, "Dispatch & Response"),
      mod("country-director", "shift-handover", "Shift Handover", ClipboardCheck, "Dispatch & Response"),
      // Field Oversight
      mod("country-director", "supervision-patrol", "Patrol Suite", ShieldHalf, "Field Oversight"),
      mod("country-director", "deployment-board", "Deployment Board", ClipboardList, "Field Oversight"),
      mod("country-director", "patrol-intelligence", "Patrol Intelligence", Activity, "Field Oversight"),
      mod("country-director", "dob", "Digital Occurrence Book", FileText, "Field Oversight"),
      mod("country-director", "access", "Access Control", DoorOpen, "Field Oversight"),
      // Surveillance
      mod("country-director", "cctv", "CCTV & Video", Camera, "Surveillance"),
      mod("country-director", "bodycam", "Body Cam", Video, "Surveillance"),
      mod("country-director", "loss-control", "Loss Control", Search, "Surveillance"),
      // Specialised Units
      mod("country-director", "technical-security", "Technical Security", Wrench, "Specialised Units"),
      mod("country-director", "k9", "K9 Management", Dog, "Specialised Units"),
      mod("country-director", "escort", "Escort & VIP", Shield, "Specialised Units"),
      mod("country-director", "investigations", "Investigations", Search, "Specialised Units"),
      mod("country-director", "cit", "Cash-in-Transit", Banknote, "Specialised Units"),
      mod("country-director", "courier", "Courier Operations", Truck, "Specialised Units"),
      mod("country-director", "event-security", "Event Security", Calendar, "Specialised Units"),
      // Workforce
      mod("country-director", "staff", "HR Suite", Users, "Workforce"),
      mod("country-director", "field-officers", "Field Officers", UsersRound, "Workforce"),
      mod("country-director", "training", "Training Management", GraduationCap, "Workforce"),
      mod("country-director", "training-drills", "Training Drills", ShieldAlert, "Workforce"),
      mod("country-director", "equipment", "Equipment Issuance", Package, "Workforce"),
      mod("country-director", "leave", "Leave Management", Calendar, "Workforce"),
      // Commercial
      mod("country-director", "tenants", "Branches", Building2, "Commercial"),
      mod("country-director", "clients", "Client Management", Building2, "Commercial"),
      mod("country-director", "billing", "Group Revenue", Wallet, "Commercial"),
      mod("country-director", "invoices", "Invoices", Receipt, "Commercial"),
      mod("country-director", "expenses", "Expenses", Coins, "Commercial"),
      mod("country-director", "payroll-runs", "Payroll Runs", Banknote, "Commercial"),
      mod("country-director", "payslips", "Payslips", Receipt, "Commercial"),
      mod("country-director", "statutory-returns", "Statutory Returns", FileText, "Commercial"),
      mod("country-director", "fleet", "Fleet Management", Truck, "Commercial"),
      // Compliance & Governance
      mod("country-director", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("country-director", "compliance-register", "Compliance Register", ClipboardCheck, "Compliance & Governance"),
      mod("country-director", "policy-library", "Policy Library", FileText, "Compliance & Governance"),
      mod("country-director", "approvals-inbox", "Approvals Inbox", ClipboardCheck, "Compliance & Governance"),
      mod("country-director", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      // Records & Continuity
      mod("country-director", "documents", "Documents", FileText, "Records & Continuity"),
      mod("country-director", "sop-library", "SOP Library", FileText, "Records & Continuity"),
      mod("country-director", "emergency-plans", "Emergency Plans", ShieldAlert, "Records & Continuity"),
      mod("country-director", "comms", "Communications", MessageSquareIcon, "Records & Continuity"),
      // System
      mod("country-director", "settings", "Settings", Settings, "System"),
      mod("country-director", "system-settings", "System Settings", Settings, "System"),
    ],
    kpis: [
      { label: "Group Revenue (MTD)", value: "—" },
      { label: "Active Branches", value: "—" },
      { label: "Open Escalations", value: "—" },
      { label: "Country Compliance", value: "—" },
    ],
    quickActions: [
      { label: "Open Executive", to: "/platform/country-director/m/executive-dashboard" },
      { label: "Open Strategic Advisory", to: "/platform/country-director/m/strategic-advisory" },
    ],
  },

  "risk-director": {
    id: "risk-director",
    name: "Director of Risk, Insurance & Welfare",
    eyebrow: "Risk Platform",
    mission: "Enterprise risk, corporate liabilities, insurance and employee welfare oversight.",
    icon: ShieldCheck,
    gradient: "from-red-500 to-rose-600",
    modules: [
      welcome("risk-director"),
      mod("risk-director", "executive-dashboard", "Risk Dashboard", BarChart3, "Command & Monitoring"),
      mod("risk-director", "strategic-advisory", "Risk Advisory", Globe, "Command & Monitoring"),
      mod("risk-director", "incidents", "Incident Register", AlertTriangle, "Dispatch & Response"),
      mod("risk-director", "investigations", "Investigations", Search, "Compliance & Governance"),
      mod("risk-director", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("risk-director", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
      mod("risk-director", "documents", "Policies & Insurance", FileText, "Records & Continuity"),
      mod("risk-director", "leave", "Welfare & Leave", Calendar, "Workforce"),
      mod("risk-director", "training", "Welfare Training", GraduationCap, "Workforce"),
      mod("risk-director", "staff", "Staff Register", Users, "Workforce"),
    ],
    kpis: [
      { label: "Open Claims", value: "—" },
      { label: "Risk Incidents (30d)", value: "—" },
      { label: "Welfare Cases", value: "—" },
      { label: "Policy Renewals Due", value: "—" },
    ],
    quickActions: [
      { label: "Open Investigations", to: "/platform/risk-director/m/investigations" },
      { label: "Open Compliance", to: "/platform/risk-director/m/compliance" },
    ],
  },

  "finance-director": {
    id: "finance-director",
    name: "Finance Director",
    eyebrow: "Finance Platform",
    mission: "Fiscal health, budgeting, multicurrency reporting and commercial operations.",
    icon: Wallet,
    gradient: "from-emerald-600 to-green-700",
    modules: [
      welcome("finance-director"),
      mod("finance-director", "executive-dashboard", "Finance Executive Dashboard", BarChart3, "Command & Monitoring"),
      mod("finance-director", "analytics-dashboard", "Analytics", BarChart3, "Command & Monitoring"),
      mod("finance-director", "billing", "Billing & Revenue", Wallet, "Commercial"),
      mod("finance-director", "invoices", "Invoices", Receipt, "Commercial"),
      mod("finance-director", "payroll-runs", "Payroll Runs", Banknote, "Commercial"),
      mod("finance-director", "payslips", "Payslips", FileText, "Commercial"),
      mod("finance-director", "statutory-returns", "Statutory Returns", FileText, "Compliance & Governance"),
      mod("finance-director", "clients", "Clients (AR)", Building2, "Commercial"),
      mod("finance-director", "tenants", "Branches", Building2, "Commercial"),
      mod("finance-director", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("finance-director", "audit-log", "Audit Log", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Group Revenue (MTD)", value: "—" },
      { label: "Outstanding AR", value: "—" },
      { label: "Payroll Cost (MTD)", value: "—" },
      { label: "Statutory Due", value: "—" },
    ],
    quickActions: [
      { label: "Open Billing", to: "/platform/finance-director/m/billing" },
      { label: "Open Payroll Runs", to: "/platform/finance-director/m/payroll-runs" },
    ],
  },

  "regional-ops-manager": {
    id: "regional-ops-manager",
    name: "Regional Operations Manager",
    eyebrow: "Operations Platform",
    mission: "Coordinate multi-branch security delivery across distinct territories.",
    icon: Globe,
    gradient: "from-orange-600 to-red-600",
    modules: [
      welcome("regional-ops-manager"),
      mod("regional-ops-manager", "executive-dashboard", "Regional Ops Dashboard", BarChart3, "Command & Monitoring"),
      mod("regional-ops-manager", "control-dashboard", "Control Dashboard", Monitor, "Command & Monitoring"),
      mod("regional-ops-manager", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("regional-ops-manager", "incidents", "Incidents (Region)", AlertTriangle, "Dispatch & Response"),
      mod("regional-ops-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("regional-ops-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("regional-ops-manager", "field-officers", "Field Officers", ClipboardCheck, "Field Oversight"),
      mod("regional-ops-manager", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("regional-ops-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("regional-ops-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("regional-ops-manager", "tenants", "Branches", Building2, "Commercial"),
      mod("regional-ops-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Branches", value: "—" },
      { label: "Officers Deployed", value: "—" },
      { label: "Open Incidents", value: "—" },
      { label: "SLA Breaches", value: "—" },
    ],
    quickActions: [
      { label: "Open Live Map", to: "/platform/regional-ops-manager/m/map" },
      { label: "Open Incidents", to: "/platform/regional-ops-manager/m/incidents" },
    ],
  },

  "branch-ops-manager": {
    id: "branch-ops-manager",
    name: "Branch Operations Manager",
    eyebrow: "Branch Ops Platform",
    mission: "Site deployments, county-level logistics and personnel assets.",
    icon: MapPin,
    gradient: "from-amber-600 to-orange-700",
    modules: [
      welcome("branch-ops-manager"),
      mod("branch-ops-manager", "gm-dashboard", "Branch Ops Dashboard", Building2, "Command & Monitoring"),
      mod("branch-ops-manager", "control-dashboard", "Control Dashboard", Monitor, "Command & Monitoring"),
      mod("branch-ops-manager", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("branch-ops-manager", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("branch-ops-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("branch-ops-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("branch-ops-manager", "field-officers", "Field Officers", ClipboardCheck, "Field Oversight"),
      mod("branch-ops-manager", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("branch-ops-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("branch-ops-manager", "staff", "Branch Staff", Users, "Workforce"),
      mod("branch-ops-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("branch-ops-manager", "equipment", "Equipment Issuance", Package, "Workforce"),
      mod("branch-ops-manager", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("branch-ops-manager", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
    ],
    kpis: [
      { label: "Sites Active", value: "—" },
      { label: "Officers On-Duty", value: "—" },
      { label: "Open Incidents", value: "—" },
      { label: "Vehicles Available", value: "—" },
    ],
    quickActions: [
      { label: "Open Deployment Board", to: "/platform/branch-ops-manager/m/staff-scheduling" },
      { label: "Open Incidents", to: "/platform/branch-ops-manager/m/incidents" },
    ],
  },

  "asst-snr-ops-manager": {
    id: "asst-snr-ops-manager",
    name: "Assistant Senior Operations Manager",
    eyebrow: "Operations Platform",
    mission: "Support orchestration of high-profile assignments and ground resources.",
    icon: Briefcase,
    gradient: "from-orange-400 to-amber-500",
    modules: [
      welcome("asst-snr-ops-manager"),
      mod("asst-snr-ops-manager", "control-dashboard", "Operations Dashboard", Monitor, "Command & Monitoring"),
      mod("asst-snr-ops-manager", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("asst-snr-ops-manager", "incidents", "Incidents", AlertTriangle, "Dispatch & Response"),
      mod("asst-snr-ops-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("asst-snr-ops-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("asst-snr-ops-manager", "field-officers", "Field Officers", ClipboardCheck, "Field Oversight"),
      mod("asst-snr-ops-manager", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("asst-snr-ops-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("asst-snr-ops-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("asst-snr-ops-manager", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("asst-snr-ops-manager", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
    ],
    kpis: [
      { label: "Open Assignments", value: "—" },
      { label: "VIP Missions", value: "—" },
      { label: "Open Incidents", value: "—" },
      { label: "SLA Breaches", value: "—" },
    ],
    quickActions: [
      { label: "Open Operations", to: "/platform/asst-snr-ops-manager/m/control-dashboard" },
      { label: "Open Incidents", to: "/platform/asst-snr-ops-manager/m/incidents" },
    ],
  },

  "area-manager": {
    id: "area-manager",
    name: "Area Manager",
    eyebrow: "Area Platform",
    mission: "Own service delivery across an area cluster — live oversight of sites, officers, incidents, patrols, fleet and clients.",
    icon: MapPin,
    gradient: "from-yellow-600 to-orange-600",
    modules: [
      welcome("area-manager"),
      // Command & Monitoring — area-wide situational awareness
      mod("area-manager", "gm-dashboard", "Area Dashboard", Building2, "Command & Monitoring"),
      mod("area-manager", "control-dashboard", "Ops Dashboard", Monitor, "Command & Monitoring"),
      mod("area-manager", "map", "Live Map", Globe, "Command & Monitoring"),
      mod("area-manager", "analytics-dashboard", "Area Analytics", BarChart3, "Command & Monitoring"),
      // Dispatch & Response — every channel a supervisor needs
      mod("area-manager", "incidents", "Area Incidents", AlertTriangle, "Dispatch & Response"),
      mod("area-manager", "alarms", "Alarm & Mobile Response", Siren, "Dispatch & Response"),
      mod("area-manager", "comms", "Communications", Radio, "Dispatch & Response"),
      mod("area-manager", "war-room", "Crisis Room", ShieldAlert, "Dispatch & Response"),
      // Surveillance
      mod("area-manager", "cctv", "CCTV & Video", Camera, "Surveillance"),
      mod("area-manager", "loss-control", "Loss Control", TrendingDown, "Surveillance"),
      // Field Oversight — same coverage as Branch / ASOM platforms
      mod("area-manager", "field-officers", "Field Officers", ClipboardCheck, "Field Oversight"),
      mod("area-manager", "supervision-patrol", "Patrol Suite", ClipboardCheck, "Field Oversight", "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence"),
      mod("area-manager", "mdt-management", "MDT Console", Tablet, "Field Oversight"),
      mod("area-manager", "fleet", "Fleet", Truck, "Field Oversight"),
      mod("area-manager", "k9", "K9 Units", Dog, "Field Oversight"),
      // Workforce
      mod("area-manager", "staff", "Area Staff", Users, "Workforce"),
      mod("area-manager", "staff-scheduling", "Scheduling", Calendar, "Workforce"),
      mod("area-manager", "equipment", "Equipment Issuance", Package, "Workforce"),
      mod("area-manager", "training", "Training", GraduationCap, "Workforce"),
      // Records & Continuity
      mod("area-manager", "dob", "Daily Occurrence Book", FileText, "Records & Continuity"),
      mod("area-manager", "shift-handover", "Shift Handover", Calendar, "Records & Continuity"),
      mod("area-manager", "approvals-inbox", "Approvals Inbox", ClipboardCheck, "Records & Continuity"),
      // Commercial
      mod("area-manager", "clients", "Area Clients", Building2, "Commercial"),
      mod("area-manager", "event-security", "Event Security", CalendarDays, "Commercial"),
      // Compliance & Governance
      mod("area-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("area-manager", "documents", "Documents", FileText, "Compliance & Governance"),
    ],
    kpis: [
      { label: "Sites in Area", value: "—" },
      { label: "Officers On-Duty", value: "—" },
      { label: "Open Incidents", value: "—" },
      { label: "Patrol Compliance", value: "—" },
      { label: "Active Alarms", value: "—" },
      { label: "SLA Breaches", value: "—" },
    ],
    quickActions: [
      { label: "Open Ops Dashboard", to: "/platform/area-manager/m/control-dashboard" },
      { label: "Open Incidents", to: "/platform/area-manager/m/incidents" },
      { label: "Open Patrol Suite", to: "/platform/area-manager/m/supervision-patrol" },
      { label: "Open Approvals Inbox", to: "/platform/area-manager/m/approvals-inbox" },
    ],
  },

  "facilities-ops-manager": {
    id: "facilities-ops-manager",
    name: "Manager, Facilities & Operations",
    eyebrow: "Facilities Platform",
    mission: "Physical facility security alongside company real estate assets.",
    icon: Building2,
    gradient: "from-stone-600 to-zinc-700",
    modules: [
      welcome("facilities-ops-manager"),
      mod("facilities-ops-manager", "control-dashboard", "Facilities Dashboard", Monitor, "Command & Monitoring"),
      mod("facilities-ops-manager", "map", "Asset Map", Globe, "Command & Monitoring"),
      mod("facilities-ops-manager", "cctv", "CCTV", Camera, "Surveillance"),
      mod("facilities-ops-manager", "alarms", "Alarms", Siren, "Dispatch & Response"),
      mod("facilities-ops-manager", "incidents", "Facility Incidents", AlertTriangle, "Dispatch & Response"),
      mod("facilities-ops-manager", "workorders", "Work Orders", Wrench, "Field Oversight"),
      mod("facilities-ops-manager", "equipment", "Equipment & Assets", Package, "Workforce"),
      mod("facilities-ops-manager", "documents", "Facility Documents", FileText, "Records & Continuity"),
      mod("facilities-ops-manager", "compliance", "Compliance", ShieldCheck, "Compliance & Governance"),
      mod("facilities-ops-manager", "staff", "Facilities Staff", Users, "Workforce"),
    ],
    kpis: [
      { label: "Facilities Managed", value: "—" },
      { label: "Open Work Orders", value: "—" },
      { label: "Asset Items", value: "—" },
      { label: "Compliance Score", value: "—" },
    ],
    quickActions: [
      { label: "Open Work Orders", to: "/platform/facilities-ops-manager/m/workorders" },
      { label: "Open CCTV", to: "/platform/facilities-ops-manager/m/cctv" },
    ],
  },
};

export const NEW_PLATFORM_IDS: PlatformId[] = [
  "contract-manager", "guard-force-admin",
  "hr-manager", "hr-officer",
  "finance-manager", "finance-officer", "payroll-officer",
  "ops-manager", "admin-manager", "admin-officer",
  "branch-manager", "regional-manager",
  "cit-manager", "cit-officer",
  "compliance", "system-admin",
  "country-director", "risk-director", "finance-director",
  "regional-ops-manager", "branch-ops-manager",
  "asst-snr-ops-manager", "area-manager", "facilities-ops-manager",
  "customer-service-manager", "customer-service-officer",
];

/** Canonical category display order for the sidebar grouping. */
export const CATEGORY_ORDER: ModuleCategory[] = [
  "Overview",
  "Command & Monitoring",
  "Dispatch & Response",
  "Field Oversight",
  "Surveillance",
  "Specialised Units",
  "Workforce",
  "Commercial",
  "Records & Continuity",
  "Compliance & Governance",
  "Customer Service",
  "System",
];
