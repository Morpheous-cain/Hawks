import {
  Shield, Activity, AlertTriangle, Clock, Users, Radio, Camera, MapPin,
  Bell, Wrench, ClipboardList, Truck, Search, Calendar, FileText, Dog,
  QrCode, Footprints, Heart, Timer, Package, Key, BookOpen, Zap, Phone,
  TrendingUp, Map, Headphones, GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashKpi {
  id: string;
  label: string;
  source: string; // key in useFieldKpis output
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  unit?: string;
}

export interface DashAction {
  id: string;            // module id matching FieldApp moduleComponents
  label: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "danger" | "warning" | "success";
  hint?: string;
}

export interface RankDashboardConfig {
  kpis: DashKpi[];
  primaryActions: DashAction[];
  secondaryActions: DashAction[];
  threatSource?: "site" | "global";
}

/* ------------------------------------------------------------------ */
/*  Per-rank dashboard composition                                    */
/* ------------------------------------------------------------------ */

const COMMON_FOOTER: DashAction[] = [
  { id: "field_ob",   label: "Occurrence Book", icon: BookOpen, hint: "Daily log" },
  { id: "hq_connect", label: "HQ Connect",      icon: Radio,    tone: "primary" },
  { id: "bodycam",    label: "Body Cam",        icon: Camera,   tone: "danger", hint: "Quick record" },
  { id: "incidents",  label: "Report Incident", icon: AlertTriangle, tone: "warning" },
];

export const rankDashboardConfig: Record<string, RankDashboardConfig> = {
  guard: {
    kpis: [
      { id: "shift",      label: "On Shift",       source: "shift",        icon: Clock,        tone: "info" },
      { id: "checkpoints",label: "Checkpoints",    source: "checkpointsToday", icon: QrCode,   tone: "success", unit: "today" },
      { id: "myInc",      label: "My Incidents",   source: "myIncidents",  icon: AlertTriangle, tone: "warning" },
      { id: "welfare",    label: "Welfare",        source: "welfareStatus", icon: Heart,       tone: "success" },
    ],
    primaryActions: [
      { id: "clock",            label: "Clock In/Out",      icon: Clock,        tone: "primary" },
      { id: "beat_map",         label: "Beat Map",          icon: Map,          tone: "primary", hint: "Live GPS" },
      { id: "pre_shift_brief",  label: "Pre-Shift Brief",   icon: BookOpen,     hint: "AI-summarised" },
      { id: "threat_watch",     label: "Threat Watch",      icon: AlertTriangle, tone: "warning" },
      { id: "welfare_check",    label: "Welfare Check",     icon: Heart,        tone: "success" },
      { id: "lone_worker",      label: "Lone-Worker Timer", icon: Timer },
      { id: "visitor_log",      label: "Visitor Log",       icon: Users },
      { id: "vehicle_inspect",  label: "Vehicle Inspect",   icon: Truck },
      { id: "key_custody",      label: "Key & Asset",       icon: Key },
      { id: "parcel_log",       label: "Parcel Log",        icon: Package },
      { id: "evidence_vault",   label: "Evidence Vault",    icon: Camera, tone: "danger" },
      { id: "my_performance",   label: "My Performance",    icon: TrendingUp, tone: "success" },
      { id: "my_schedule",      label: "My Schedule",       icon: Calendar },
      { id: "drills",           label: "Drills",            icon: GraduationCap, hint: "Daily training" },
    ],
    secondaryActions: COMMON_FOOTER,
    threatSource: "site",
  },

  supervisor: {
    kpis: [
      { id: "team",        label: "Team On Duty",   source: "onDuty",      icon: Users,         tone: "info" },
      { id: "openDisp",    label: "Open Dispatch",  source: "openDispatch", icon: Radio,        tone: "warning" },
      { id: "incToday",    label: "Incidents Today", source: "incidentsToday", icon: AlertTriangle, tone: "danger" },
      { id: "alarmsToday", label: "Alarms Today",    source: "alarmsToday",   icon: Bell,         tone: "warning" },
    ],
    primaryActions: [
      { id: "clock",                label: "Clock In/Out",       icon: Clock, tone: "primary" },
      { id: "live_team_map",        label: "Live Team Map",      icon: Map, tone: "primary" },
      { id: "attendance_board",     label: "Attendance Board",   icon: Users, hint: "Today" },
      { id: "patrol_performance",   label: "Patrol Performance", icon: TrendingUp, tone: "success" },
      { id: "welfare_oversight",    label: "Welfare Oversight",  icon: Heart, tone: "warning" },
      { id: "incident_triage",      label: "Incident Triage",    icon: AlertTriangle, tone: "danger" },
      { id: "broadcast_composer",   label: "Broadcast",          icon: Radio },
      { id: "site_audit",           label: "Site Audit",         icon: ClipboardList },
      { id: "team",                 label: "Team Mgmt",          icon: Users },
      { id: "patrol",               label: "Patrol Monitor",     icon: MapPin },
      { id: "fleet_status",         label: "Fleet Status",       icon: Truck },
      { id: "tasks",                label: "Task Assignment",    icon: ClipboardList },
      { id: "management_ob",        label: "Management O.B",     icon: FileText },
    ],
    secondaryActions: [
      { id: "hq_connect", label: "HQ Connect", icon: Radio, tone: "primary" },
      { id: "bodycam",    label: "Body Cam",   icon: Camera, tone: "danger" },
      { id: "incidents",  label: "Incident Reports", icon: AlertTriangle, tone: "warning" },
    ],
    threatSource: "global",
  },

  /* ---------- Defaults for the other 10 ranks (Phase 3+ deepens these) -- */
};

/** Fallback config so unfamiliar ranks still render a sensible dashboard. */
export const fallbackDashboard: RankDashboardConfig = {
  kpis: [
    { id: "shift",   label: "On Shift",       source: "shift",         icon: Clock, tone: "info" },
    { id: "openDisp",label: "Open Dispatch",  source: "openDispatch",  icon: Radio, tone: "warning" },
    { id: "incToday",label: "Incidents Today", source: "incidentsToday", icon: AlertTriangle, tone: "danger" },
    { id: "onDuty",  label: "On Duty",        source: "onDuty",        icon: Users, tone: "success" },
  ],
  primaryActions: [
    { id: "clock",      label: "Clock In/Out",    icon: Clock,        tone: "primary" },
    { id: "hq_connect", label: "HQ Connect",      icon: Radio,        tone: "primary" },
    { id: "incidents",  label: "Report Incident", icon: AlertTriangle, tone: "warning" },
    { id: "bodycam",    label: "Body Cam",        icon: Camera,        tone: "danger" },
    { id: "field_ob",   label: "Occurrence Book", icon: BookOpen },
  ],
  secondaryActions: [],
};

export const getRankDashboard = (rank: string): RankDashboardConfig =>
  rankDashboardConfig[rank] ?? fallbackDashboard;
