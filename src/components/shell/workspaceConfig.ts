/**
 * Black Hawk SOC-OS Workspace Navigation
 *
 * Three-layer model:
 *   1. Workspaces (icon rail) — top-level domains: Ops, HR, Admin, Finance, Settings, Profile
 *   2. Sections (contextual sidebar) — collapsible groups of modules within a workspace
 *   3. Modules (sidebar items) — actual route destinations
 *
 * EVERY existing route in App.tsx is mapped here so navigation continues to work.
 * Adding a new module = add one entry; the shell handles the rest.
 */

import {
  // Operations
  Crown, LayoutDashboard, MonitorDot, Radio, ShieldAlert, ClipboardCheck, Zap, Globe,
  Camera, Video, TrendingDown, BookOpen, Bell, CreditCard, QrCode, Tablet,
  Wrench, Dog, Car, Search, Truck, CalendarDays, AlertTriangle, MessageSquare,
  Map, BarChart3, FileText,
  // HR
  Users, UserCog, Calendar, GraduationCap, Package,
  // Admin
  Building2, Settings, ShieldCheck, BookMarked, ScrollText,
  // Workspace icons
  Activity, Briefcase, Cog, User, Wallet, UserPlus, Boxes,
  // Finance/Ops extras
  Receipt, Landmark, FileBarChart, Banknote, Brain, Network, ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface NavModule {
  name: string;
  path: string;
  icon: LucideIcon;
  /** Live count badge key — read from sidebar live counts */
  badgeKey?: "incidents" | "alarms";
  /** Optional short description for ⌘K palette */
  hint?: string;
}

export interface NavSection {
  name: string;
  defaultOpen?: boolean;
  modules: NavModule[];
}

export interface Workspace {
  id: string;
  name: string;
  /** Short eyebrow shown above section list */
  tagline: string;
  icon: LucideIcon;
  sections: NavSection[];
}

// ---------------- OPERATIONS ----------------
const opsWorkspace: Workspace = {
  id: "ops",
  name: "Operations",
  tagline: "Live command & response",
  icon: Activity,
  sections: [
    {
      name: "Overview",
      defaultOpen: true,
      modules: [
        { name: "Executive Dashboard", path: "/executive-dashboard", icon: LayoutDashboard },
        { name: "Duty Roster Board", path: "/duty-roster", icon: ClipboardList, hint: "SOC command-centre duty roster & live posture" },
      ],
    },
    {
      name: "Command Centre",
      defaultOpen: true,
      modules: [
        { name: "Control Room", path: "/control-room", icon: Radio },
        { name: "MDT Management Console", path: "/mdt-management", icon: Tablet, hint: "Dispatcher oversight of every Mobile Data Terminal" },
        { name: "Crisis Management Centre", path: "/war-room", icon: ShieldAlert },
        { name: "Shift Handover", path: "/shift-handover", icon: ClipboardCheck },
        { name: "Auto-Dispatch Rules", path: "/auto-dispatch", icon: Zap },
        { name: "Strategic Advisory", path: "/strategic-advisory", icon: Globe },
      ],
    },
    {
      name: "Surveillance",
      modules: [
        { name: "CCTV & Video", path: "/cctv", icon: Camera },
        { name: "Body Cam", path: "/bodycam", icon: Video },
        { name: "Loss Control", path: "/loss-control", icon: TrendingDown },
      ],
    },
    {
      name: "Field Operations",
      defaultOpen: true,
      modules: [
        { name: "Digital Occurrence Book", path: "/dob", icon: BookOpen },
        { name: "Alarm & Mobile Response", path: "/alarms", icon: Bell, badgeKey: "alarms" },
        { name: "Access Control", path: "/access", icon: CreditCard },
        { name: "Patrol Suite", path: "/supervision-patrol", icon: QrCode, hint: "Supervision, checkpoints, GPS, monitoring, tour reports & intelligence" },
        { name: "Mobile Data Terminal", path: "/mdt", icon: Tablet },
        { name: "Operational Map", path: "/map", icon: Map },
      ],
    },
    {
      name: "Access & Custody",
      defaultOpen: true,
      modules: [
        { name: "Visitor & Access", path: "/visitor-access", icon: UserPlus },
        { name: "Asset & Armoury", path: "/armoury", icon: Boxes },
      ],
    },
    {
      name: "Specialised Units",
      modules: [
        { name: "Technical Security", path: "/technical-security", icon: Wrench },
        { name: "K9 Management", path: "/k9", icon: Dog },
        { name: "Escort & VIP", path: "/escort", icon: Car },
        { name: "Investigations", path: "/investigations", icon: Search },
        { name: "Courier Operations", path: "/courier", icon: Truck },
        { name: "Cash-in-Transit", path: "/cit", icon: Banknote },
        { name: "Event Security", path: "/event-security", icon: CalendarDays },
      ],
    },
    {
      name: "Intelligence & Command",
      modules: [
        { name: "Deployment Board", path: "/deployment-board", icon: Network },
        { name: "Directive Log", path: "/directive-log", icon: ScrollText },
      ],
    },
    {
      name: "Incidents & Comms",
      modules: [
        { name: "Incident Command Centre", path: "/incidents", icon: AlertTriangle, badgeKey: "incidents", hint: "Unified incident response — severity, timeline, evidence, escalation" },
        { name: "Communications", path: "/comms", icon: MessageSquare },
        { name: "Analytics", path: "/analytics-dashboard", icon: BarChart3 },
      ],
    },
  ],
};

// ---------------- HR & PEOPLE ----------------
const hrWorkspace: Workspace = {
  id: "hr",
  name: "HR & People",
  tagline: "Staff, training & scheduling",
  icon: Users,
  sections: [
    {
      name: "HR Suite",
      defaultOpen: true,
      modules: [
        { name: "HR Suite", path: "/hr", icon: Users, hint: "Staff, officers, scheduling, leave, recruitment, onboarding, attendance, performance & disciplinary" },
      ],
    },
    {
      name: "Capability",
      defaultOpen: true,
      modules: [
        { name: "Training Management", path: "/training", icon: GraduationCap },
        { name: "Training Drills", path: "/training-drills", icon: ShieldAlert },
        { name: "Equipment Issuance", path: "/equipment", icon: Package },
      ],
    },
  ],
};

// ---------------- ADMINISTRATION ----------------
const adminWorkspace: Workspace = {
  id: "admin",
  name: "Administration",
  tagline: "Clients, compliance & governance",
  icon: Briefcase,
  sections: [
    {
      name: "Clients",
      defaultOpen: true,
      modules: [
        { name: "Client Management", path: "/clients", icon: Building2 },
      ],
    },
    {
      name: "Fleet & Assets",
      modules: [
        { name: "Fleet Management", path: "/fleet", icon: Car },
      ],
    },
    {
      name: "Knowledge",
      defaultOpen: true,
      modules: [
        { name: "SOP Library", path: "/sop-library", icon: BookOpen },
        { name: "Emergency Plans", path: "/emergency-plans", icon: ShieldAlert },
        { name: "Documents", path: "/documents", icon: FileText },
      ],
    },
    {
      name: "Compliance & Audit",
      modules: [
        { name: "Compliance Centre", path: "/compliance", icon: ShieldCheck },
        { name: "Compliance Register", path: "/compliance-register", icon: ClipboardCheck },
        { name: "Policy Library", path: "/policy-library", icon: BookMarked },
        { name: "Approvals Inbox", path: "/approvals-inbox", icon: ClipboardCheck },
        { name: "Audit Log", path: "/audit-log", icon: FileText },
        { name: "Tenants (SaaS)", path: "/tenants", icon: Building2 },
      ],
    },
  ],
};

// ---------------- FINANCE ----------------
const financeWorkspace: Workspace = {
  id: "finance",
  name: "Finance",
  tagline: "Billing & revenue",
  icon: Wallet,
  sections: [
    {
      name: "Revenue",
      defaultOpen: true,
      modules: [
        { name: "Billing & Invoicing", path: "/billing", icon: CreditCard },
      ],
    },
    {
      name: "Payroll",
      defaultOpen: true,
      modules: [
        { name: "Payroll Runs", path: "/payroll-runs", icon: Banknote },
        { name: "Payslips", path: "/payslips", icon: Receipt },
        { name: "Statutory Returns", path: "/statutory-returns", icon: Landmark },
      ],
    },
    {
      name: "Expenses & Reporting",
      modules: [
        { name: "Expenses", path: "/expenses", icon: Receipt },
        { name: "Financial Reports", path: "/analytics-dashboard", icon: FileBarChart },
      ],
    },
  ],
};

// ---------------- SETTINGS ----------------
const settingsWorkspace: Workspace = {
  id: "settings",
  name: "Settings",
  tagline: "System configuration",
  icon: Cog,
  sections: [
    {
      name: "Configuration",
      defaultOpen: true,
      modules: [
        { name: "Settings", path: "/settings", icon: Settings },
      ],
    },
  ],
};

// ---------------- PROFILE (terminal-only entry — no workspace screen) ----------------
const profileWorkspace: Workspace = {
  id: "profile",
  name: "Profile",
  tagline: "Account & install",
  icon: User,
  sections: [
    {
      name: "Account",
      defaultOpen: true,
      modules: [
        { name: "Install App", path: "/install", icon: Package },
      ],
    },
  ],
};

export const workspaces: Workspace[] = [
  opsWorkspace,
  hrWorkspace,
  adminWorkspace,
  financeWorkspace,
  settingsWorkspace,
  profileWorkspace,
];

/**
 * Resolve which workspace a given pathname belongs to.
 * Falls back to ops (the default workspace).
 */
export function workspaceForPath(pathname: string): Workspace {
  for (const ws of workspaces) {
    for (const section of ws.sections) {
      if (section.modules.some((m) => m.path === pathname)) {
        return ws;
      }
    }
  }
  return opsWorkspace;
}

/**
 * Flat list of every module — used by the ⌘K palette to surface everything.
 */
export const allModules: NavModule[] = workspaces.flatMap((ws) =>
  ws.sections.flatMap((s) => s.modules),
);
