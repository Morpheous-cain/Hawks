import {
  Activity, AlertTriangle, Bell, Camera, Car, ClipboardList, Dog, FileText,
  GraduationCap, Heart, Map, Package, Phone, Radio, Search, Shield, Truck,
  Users, Wrench, MapPin, BookOpen, CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ───────── Types ───────── */

export interface CockpitKpi {
  label: string;
  table: string;            // Supabase table to count from
  filter?: Record<string, any>;        // .eq filters
  inFilter?: { col: string; values: string[] };
  inFilters?: { col: string; values: string[] }[]; // multiple .in() filters
  sinceField?: string;      // count rows >= today
  icon: LucideIcon;
  tone: "info" | "warning" | "danger" | "success";
}

export interface QueueSource {
  table: string;
  kind: "incident" | "dispatch" | "alarm" | "case" | "delivery" | "mission" | "workorder" | "training";
  titleField: string;
  subtitleField?: string;
  timeField: string;
  severityField?: string;       // optional column to read severity
  defaultSeverity?: "critical" | "high" | "medium" | "low";
  status?: { col: string; values: string[] };
  scopeIn?: { col: string; values: string[] }; // designation-scoped filter
  scopeEq?: Record<string, any>;               // designation-scoped equality
  module: string;               // module id to open on click
}

export interface QuickTool { id: string; label: string; icon: LucideIcon; }

export interface RankCockpitProfile {
  rank: string;
  title: string;             // display title
  missionLine: string;       // contextual subtitle
  accent: string;            // tailwind text accent class
  panelType: "map" | "cases" | "deliveries" | "missions" | "workorders" | "monitoring" | "training";
  panelTitle: string;
  panelIcon: LucideIcon;
  kpis: CockpitKpi[];
  queueSources: QueueSource[];
  pulseTable: string;        // table to render in the pulse strip
  pulseLabel: string;
  pulseFields: { primary: string; secondary?: string; statusField?: string };
  pulseScopeIn?: { col: string; values: string[] };
  pulseScopeEq?: Record<string, any>;
  quickTools: QuickTool[];
  primaryHubModule?: string; // optional "open full hub" target
}

/* ───────── Profiles for the 10 ranks ───────── */

export const rankCockpitProfiles: Record<string, RankCockpitProfile> = {

  /* 1 ─ Response Officer (MDT/QRF) */
  response_officer: {
    rank: "response_officer",
    title: "Response Officer Cockpit",
    missionLine: "QRF · Alarm response · Mobile patrol",
    accent: "text-red-400",
    panelType: "map",
    panelTitle: "Live Response Map",
    panelIcon: Map,
    kpis: [
      { label: "Active Alarms",       table: "alarms",            filter: { status: "triggered" }, icon: Bell,           tone: "danger"  },
      { label: "QRF Dispatch",        table: "dispatch_requests", inFilters: [{ col: "status", values: ["pending","dispatched","en_route"] }, { col: "dispatch_type", values: ["alarm_response","qrf","mobile_patrol","emergency"] }], icon: Radio, tone: "warning" },
      { label: "Response Calls · Today", table: "incidents",      sinceField: "created_at", inFilter: { col: "incident_type", values: ["armed_robbery","break_in","panic","alarm","intrusion","trespass","assault"] }, icon: AlertTriangle, tone: "danger" },
      { label: "SOS · Active",        table: "sos_alerts",        filter: { status: "active" }, icon: Shield, tone: "danger" },
    ],
    queueSources: [
      { table: "alarms",            kind: "alarm",    titleField: "alarm_number",   subtitleField: "location", timeField: "created_at",   severityField: "severity", defaultSeverity: "high",   status: { col: "status", values: ["triggered","acknowledged"] }, module: "alarms" },
      { table: "dispatch_requests", kind: "dispatch", titleField: "request_number", subtitleField: "location", timeField: "created_at",   severityField: "priority", defaultSeverity: "medium", status: { col: "status", values: ["pending","dispatched","en_route"] }, scopeIn: { col: "dispatch_type", values: ["alarm_response","qrf","mobile_patrol","emergency"] }, module: "mdt" },
      { table: "incidents",         kind: "incident", titleField: "incident_type",  subtitleField: "location", timeField: "created_at",   severityField: "severity", defaultSeverity: "medium", status: { col: "status", values: ["reported","in_progress"] }, scopeIn: { col: "incident_type", values: ["armed_robbery","break_in","panic","alarm","intrusion","trespass","assault"] }, module: "incidents" },
    ],
    pulseTable: "alarms", pulseLabel: "Recent Alarms", pulseFields: { primary: "alarm_number", secondary: "location", statusField: "status" },
    quickTools: [
      { id: "mdt", label: "MDT", icon: Radio }, { id: "alarms", label: "Alarms", icon: Bell },
      { id: "navigation", label: "Navigate", icon: MapPin }, { id: "bodycam", label: "Body Cam", icon: Camera },
      { id: "incidents", label: "Report", icon: AlertTriangle }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "mdt",
  },

  /* 2 ─ Technician (TIMU) */
  technician: {
    rank: "technician",
    title: "Technician Cockpit",
    missionLine: "CCTV · Alarms · Maintenance · Installations",
    accent: "text-amber-400",
    panelType: "workorders",
    panelTitle: "Active Work Orders",
    panelIcon: Wrench,
    kpis: [
      { label: "Open Work Orders", table: "technical_work_orders", inFilter: { col: "status", values: ["open","in_progress"] }, icon: Wrench, tone: "warning" },
      { label: "Equipment Items",  table: "technical_equipment",   icon: Package, tone: "info" },
      { label: "Tech Faults · Today", table: "incidents",          sinceField: "created_at", inFilter: { col: "incident_type", values: ["equipment_fault","cctv_fault","alarm_fault","maintenance","power_failure","sensor_fault"] }, icon: AlertTriangle, tone: "danger" },
      { label: "Sites Covered",    table: "clients",               icon: Map, tone: "success" },
    ],
    queueSources: [
      { table: "technical_work_orders", kind: "workorder", titleField: "work_order_number", subtitleField: "description", timeField: "created_at", severityField: "priority", defaultSeverity: "medium", status: { col: "status", values: ["open","in_progress"] }, module: "workorders" },
      { table: "incidents",             kind: "incident",  titleField: "incident_type",     subtitleField: "location",    timeField: "created_at", severityField: "severity", defaultSeverity: "medium", status: { col: "status", values: ["reported","in_progress"] }, scopeIn: { col: "incident_type", values: ["equipment_fault","cctv_fault","alarm_fault","maintenance","power_failure","sensor_fault"] }, module: "incidents" },
    ],
    pulseTable: "technical_equipment", pulseLabel: "Equipment Inventory", pulseFields: { primary: "equipment_id", secondary: "equipment_type", statusField: "status" },
    quickTools: [
      { id: "workorders", label: "Work Orders", icon: Wrench }, { id: "maintenance", label: "Maintenance", icon: Activity },
      { id: "equipment", label: "Equipment", icon: Package }, { id: "reports", label: "Service Reports", icon: FileText },
      { id: "bodycam", label: "Body Cam", icon: Camera }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "workorders",
  },

  /* 3 ─ K9 Handler */
  k9_handler: {
    rank: "k9_handler",
    title: "K9 Handler Cockpit",
    missionLine: "K9 unit operations · Specialised patrol",
    accent: "text-emerald-400",
    panelType: "missions",
    panelTitle: "Active K9 Operations",
    panelIcon: Dog,
    kpis: [
      { label: "Active Deployments", table: "dispatch_requests", inFilters: [{ col: "status", values: ["pending","dispatched","en_route"] }, { col: "dispatch_type", values: ["k9","k9_deployment","k9_search","k9_patrol"] }], icon: Dog, tone: "warning" },
      { label: "K9 Patrols · Today", table: "patrols",           sinceField: "created_at", inFilter: { col: "patrol_type", values: ["k9","k9_patrol","canine"] }, icon: MapPin, tone: "info" },
      { label: "K9 Incidents · Today", table: "incidents",       sinceField: "created_at", inFilter: { col: "incident_type", values: ["k9_search","k9_apprehension","narcotics","explosives_search"] }, icon: AlertTriangle, tone: "danger" },
      { label: "K9 Handlers On Duty", table: "staff",            filter: { status: "active", duty_category: "k9" }, icon: Users, tone: "success" },
    ],
    queueSources: [
      { table: "dispatch_requests", kind: "dispatch", titleField: "request_number", subtitleField: "location", timeField: "created_at", severityField: "priority", defaultSeverity: "high", status: { col: "status", values: ["pending","dispatched"] }, scopeIn: { col: "dispatch_type", values: ["k9","k9_deployment","k9_search","k9_patrol"] }, module: "k9ops" },
      { table: "incidents",         kind: "incident", titleField: "incident_type",  subtitleField: "location", timeField: "created_at", severityField: "severity", defaultSeverity: "medium", status: { col: "status", values: ["reported","in_progress"] }, scopeIn: { col: "incident_type", values: ["k9_search","k9_apprehension","narcotics","explosives_search"] }, module: "incidents" },
    ],
    pulseTable: "patrols", pulseLabel: "K9 Patrol Activity", pulseFields: { primary: "patrol_id", secondary: "client_name", statusField: "status" }, pulseScopeIn: { col: "patrol_type", values: ["k9","k9_patrol","canine"] },
    quickTools: [
      { id: "k9ops", label: "K9 Ops", icon: Dog }, { id: "health", label: "K9 Health", icon: Heart },
      { id: "bodycam", label: "Body Cam", icon: Camera }, { id: "incidents", label: "Report", icon: AlertTriangle },
      { id: "field_ob", label: "O.B", icon: BookOpen }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "k9ops",
  },

  /* 4 ─ Escort Officer */
  escort_officer: {
    rank: "escort_officer",
    title: "Escort Officer Cockpit",
    missionLine: "VIP protection · Escort missions",
    accent: "text-violet-400",
    panelType: "missions",
    panelTitle: "Active Escort Missions",
    panelIcon: Shield,
    kpis: [
      { label: "Active Missions", table: "dispatch_requests", inFilters: [{ col: "status", values: ["pending","dispatched","en_route"] }, { col: "dispatch_type", values: ["escort","vip","vip_escort","convoy","cash_in_transit"] }], icon: Shield, tone: "warning" },
      { label: "Threats · Today",   table: "incidents",         sinceField: "created_at", inFilter: { col: "incident_type", values: ["threat","ambush","tail","suspicious_vehicle","attack"] }, icon: AlertTriangle, tone: "danger" },
      { label: "Escorts On Duty", table: "staff",             filter: { status: "active", duty_category: "escort" }, icon: Users, tone: "success" },
      { label: "SOS Active",      table: "sos_alerts",        filter: { status: "active" }, icon: Bell, tone: "danger" },
    ],
    queueSources: [
      { table: "dispatch_requests", kind: "mission", titleField: "request_number", subtitleField: "location", timeField: "created_at", severityField: "priority", defaultSeverity: "high", status: { col: "status", values: ["pending","dispatched","en_route"] }, scopeIn: { col: "dispatch_type", values: ["escort","vip","vip_escort","convoy","cash_in_transit"] }, module: "missions" },
    ],
    pulseTable: "dispatch_requests", pulseLabel: "Mission Roster", pulseFields: { primary: "request_number", secondary: "location", statusField: "status" }, pulseScopeIn: { col: "dispatch_type", values: ["escort","vip","vip_escort","convoy","cash_in_transit"] },
    quickTools: [
      { id: "missions", label: "Missions", icon: Shield }, { id: "navigation", label: "Navigate", icon: MapPin },
      { id: "comms", label: "Comms", icon: Radio }, { id: "bodycam", label: "Body Cam", icon: Camera },
      { id: "incidents", label: "Report", icon: AlertTriangle }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "missions",
  },

  /* 5 ─ Investigator */
  investigator: {
    rank: "investigator",
    title: "Investigator Cockpit",
    missionLine: "Case management · Evidence collection",
    accent: "text-indigo-400",
    panelType: "cases",
    panelTitle: "Active Cases",
    panelIcon: Search,
    kpis: [
      { label: "Open Cases",      table: "incidents",        inFilters: [{ col: "status", values: ["reported","in_progress","under_investigation"] }, { col: "severity", values: ["high","critical","medium"] }], icon: Search, tone: "warning" },
      { label: "Evidence Items",  table: "body_cam_clips",   icon: Camera, tone: "info" },
      { label: "New Cases · Today", table: "incidents",      sinceField: "created_at", inFilter: { col: "severity", values: ["high","critical","medium"] }, icon: AlertTriangle, tone: "danger" },
      { label: "Closed Cases",    table: "incidents",        filter: { status: "closed" }, icon: CheckCircle2, tone: "success" },
    ],
    queueSources: [
      { table: "incidents", kind: "case", titleField: "incident_type", subtitleField: "location", timeField: "created_at", severityField: "severity", defaultSeverity: "medium", status: { col: "status", values: ["reported","in_progress","under_investigation"] }, scopeIn: { col: "severity", values: ["high","critical","medium"] }, module: "cases" },
    ],
    pulseTable: "body_cam_clips", pulseLabel: "Recent Evidence", pulseFields: { primary: "evidence_id", secondary: "incident_type", statusField: "status" },
    quickTools: [
      { id: "cases", label: "Cases", icon: Search }, { id: "evidence", label: "Evidence", icon: Camera },
      { id: "interviews", label: "Interviews", icon: FileText }, { id: "bodycam", label: "Body Cam", icon: Camera },
      { id: "field_ob", label: "O.B", icon: BookOpen }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "cases",
  },

  /* 6 ─ Rider / Driver (Courier) */
  rider_driver: {
    rank: "rider_driver",
    title: "Rider · Driver Cockpit",
    missionLine: "Delivery assignments · Live tracking",
    accent: "text-orange-400",
    panelType: "deliveries",
    panelTitle: "Active Deliveries",
    panelIcon: Truck,
    kpis: [
      { label: "Open Deliveries", table: "dispatch_requests", inFilters: [{ col: "status", values: ["pending","dispatched","en_route"] }, { col: "dispatch_type", values: ["delivery","courier","parcel","logistics"] }], icon: Truck, tone: "warning" },
      { label: "Completed · Today", table: "dispatch_requests", filter: { status: "completed" }, sinceField: "created_at", inFilter: { col: "dispatch_type", values: ["delivery","courier","parcel","logistics"] }, icon: CheckCircle2, tone: "success" },
      { label: "Pickup Pending",  table: "dispatch_requests", filter: { status: "pending" }, inFilter: { col: "dispatch_type", values: ["delivery","courier","parcel","logistics"] },  icon: Package, tone: "info" },
      { label: "Route Incidents", table: "incidents",         sinceField: "created_at", inFilter: { col: "incident_type", values: ["traffic","accident","theft","robbery","mechanical"] }, icon: AlertTriangle, tone: "danger" },
    ],
    queueSources: [
      { table: "dispatch_requests", kind: "delivery", titleField: "request_number", subtitleField: "location", timeField: "created_at", severityField: "priority", defaultSeverity: "medium", status: { col: "status", values: ["pending","dispatched","en_route"] }, scopeIn: { col: "dispatch_type", values: ["delivery","courier","parcel","logistics"] }, module: "deliveries" },
    ],
    pulseTable: "dispatch_requests", pulseLabel: "Delivery Pipeline", pulseFields: { primary: "request_number", secondary: "location", statusField: "status" }, pulseScopeIn: { col: "dispatch_type", values: ["delivery","courier","parcel","logistics"] },
    quickTools: [
      { id: "deliveries", label: "Deliveries", icon: Truck }, { id: "pickup", label: "Pickup", icon: Package },
      { id: "history", label: "History", icon: FileText }, { id: "navigation", label: "Navigate", icon: MapPin },
      { id: "incidents", label: "Report", icon: AlertTriangle }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "deliveries",
  },

  /* 7 ─ Event Security */
  event_security: {
    rank: "event_security",
    title: "Event Security Cockpit",
    missionLine: "Event assignments · Crowd control",
    accent: "text-pink-400",
    panelType: "missions",
    panelTitle: "Event Operations",
    panelIcon: Users,
    kpis: [
      { label: "Active Events", table: "dispatch_requests", inFilters: [{ col: "status", values: ["pending","dispatched","en_route"] }, { col: "dispatch_type", values: ["event","event_security","crowd_control","concert","sports"] }], icon: Users, tone: "warning" },
      { label: "Event Incidents · Today", table: "incidents", sinceField: "created_at", inFilter: { col: "incident_type", values: ["crowd_surge","stampede","fight","disorder","unauthorized_entry","ejection"] }, icon: AlertTriangle, tone: "danger" },
      { label: "Event Officers", table: "staff",         filter: { status: "active", duty_category: "events" }, icon: Shield, tone: "info" },
      { label: "Crowd Alerts",  table: "alarms",            sinceField: "created_at", icon: Bell, tone: "warning" },
    ],
    queueSources: [
      { table: "dispatch_requests", kind: "mission",  titleField: "request_number", subtitleField: "location", timeField: "created_at", severityField: "priority", defaultSeverity: "medium", status: { col: "status", values: ["pending","dispatched","en_route"] }, scopeIn: { col: "dispatch_type", values: ["event","event_security","crowd_control","concert","sports"] }, module: "assignment" },
      { table: "incidents",         kind: "incident", titleField: "incident_type",  subtitleField: "location", timeField: "created_at", severityField: "severity", defaultSeverity: "medium", status: { col: "status", values: ["reported","in_progress"] }, scopeIn: { col: "incident_type", values: ["crowd_surge","stampede","fight","disorder","unauthorized_entry","ejection"] }, module: "incidents" },
    ],
    pulseTable: "staff", pulseLabel: "Officers On Site", pulseFields: { primary: "full_name", secondary: "current_site", statusField: "status" }, pulseScopeEq: { duty_category: "events" },
    quickTools: [
      { id: "assignment", label: "Assignment", icon: ClipboardList }, { id: "zones", label: "Zones", icon: Map },
      { id: "comms", label: "Comms", icon: Radio }, { id: "bodycam", label: "Body Cam", icon: Camera },
      { id: "incidents", label: "Report", icon: AlertTriangle }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "assignment",
  },

  /* 8 ─ Control Room Operator */
  control_room: {
    rank: "control_room",
    title: "Control Room Cockpit",
    missionLine: "Monitoring · Dispatch · Incident coordination",
    accent: "text-sky-400",
    panelType: "monitoring",
    panelTitle: "Live Operations Feed",
    panelIcon: Activity,
    kpis: [
      { label: "Active Incidents", table: "incidents",         inFilter: { col: "status", values: ["reported","in_progress"] }, icon: AlertTriangle, tone: "danger" },
      { label: "Open Dispatch",    table: "dispatch_requests", inFilter: { col: "status", values: ["pending","dispatched","en_route"] }, icon: Radio, tone: "warning" },
      { label: "Active Alarms",    table: "alarms",            filter: { status: "triggered" }, icon: Bell, tone: "danger" },
      { label: "On Duty",          table: "staff",             filter: { status: "active" }, icon: Users, tone: "success" },
    ],
    queueSources: [
      { table: "sos_alerts",        kind: "incident", titleField: "alert_number",   subtitleField: "location", timeField: "triggered_at", defaultSeverity: "critical", status: { col: "status", values: ["active"] }, module: "incidents" },
      { table: "alarms",            kind: "alarm",    titleField: "alarm_number",   subtitleField: "location", timeField: "created_at",   severityField: "severity", defaultSeverity: "high",   status: { col: "status", values: ["triggered"] }, module: "monitoring" },
      { table: "incidents",         kind: "incident", titleField: "incident_type",  subtitleField: "location", timeField: "created_at",   severityField: "severity", defaultSeverity: "medium", status: { col: "status", values: ["reported","in_progress"] }, module: "incidents" },
      { table: "dispatch_requests", kind: "dispatch", titleField: "request_number", subtitleField: "location", timeField: "created_at",   severityField: "priority", defaultSeverity: "medium", status: { col: "status", values: ["pending","dispatched"] }, module: "dispatch" },
    ],
    pulseTable: "staff", pulseLabel: "Field Roster", pulseFields: { primary: "full_name", secondary: "current_site", statusField: "status" },
    quickTools: [
      { id: "monitoring", label: "Monitor", icon: Camera }, { id: "dispatch", label: "Dispatch", icon: Radio },
      { id: "incidents", label: "Incidents", icon: AlertTriangle }, { id: "control_ob", label: "Control O.B", icon: BookOpen },
      { id: "comms", label: "Comms", icon: Phone }, { id: "hq_connect", label: "HQ", icon: Radio },
    ],
    primaryHubModule: "monitoring",
  },

  /* 9 ─ Operations Officer */
  operations_officer: {
    rank: "operations_officer",
    title: "Operations Officer Cockpit",
    missionLine: "Field operations · Dispatch · Resource coordination",
    accent: "text-cyan-400",
    panelType: "map",
    panelTitle: "Operations Overview",
    panelIcon: Map,
    kpis: [
      { label: "Open Dispatch",    table: "dispatch_requests", inFilter: { col: "status", values: ["pending","dispatched","en_route"] }, icon: Radio, tone: "warning" },
      { label: "Active Resources", table: "staff",             filter: { status: "active" }, icon: Users, tone: "info" },
      { label: "Incidents · Today",table: "incidents",         sinceField: "created_at", icon: AlertTriangle, tone: "danger" },
      { label: "Vehicles Active",  table: "vehicles",          filter: { status: "active" }, icon: Car, tone: "success" },
    ],
    queueSources: [
      { table: "dispatch_requests", kind: "dispatch", titleField: "request_number", subtitleField: "location", timeField: "created_at", severityField: "priority", defaultSeverity: "medium", status: { col: "status", values: ["pending","dispatched","en_route"] }, module: "dispatch" },
      { table: "incidents",         kind: "incident", titleField: "incident_type",  subtitleField: "location", timeField: "created_at", severityField: "severity", defaultSeverity: "medium", status: { col: "status", values: ["reported","in_progress"] }, module: "incidents" },
    ],
    pulseTable: "staff", pulseLabel: "Resource Roster", pulseFields: { primary: "full_name", secondary: "current_site", statusField: "status" },
    quickTools: [
      { id: "dispatch", label: "Dispatch", icon: Radio }, { id: "resources", label: "Resources", icon: Users },
      { id: "operations_ob", label: "Ops O.B", icon: BookOpen }, { id: "incidents", label: "Incidents", icon: AlertTriangle },
      { id: "comms", label: "Comms", icon: Phone }, { id: "hq_connect", label: "HQ", icon: Radio },
    ],
    primaryHubModule: "dispatch",
  },

  /* 10 ─ Training Officer */
  training_officer: {
    rank: "training_officer",
    title: "Training Officer Cockpit",
    missionLine: "Training delivery · Assessments · Certifications",
    accent: "text-fuchsia-400",
    panelType: "training",
    panelTitle: "Active Training Sessions",
    panelIcon: GraduationCap,
    kpis: [
      { label: "Active Sessions",  table: "training_sessions",       inFilter: { col: "status", values: ["scheduled","in_progress"] }, icon: GraduationCap, tone: "warning" },
      { label: "Trainees",         table: "staff",                   filter: { status: "active" }, icon: Users, tone: "info" },
      { label: "Certifications",   table: "staff_certifications",    filter: { status: "active" }, icon: CheckCircle2, tone: "success" },
      { label: "Expiring · 30d",   table: "staff_certifications",    icon: AlertTriangle, tone: "danger" },
    ],
    queueSources: [
      { table: "training_sessions", kind: "training", titleField: "session_id", subtitleField: "course_name", timeField: "created_at", defaultSeverity: "medium", status: { col: "status", values: ["scheduled","in_progress"] }, module: "sessions" },
    ],
    pulseTable: "staff_certifications", pulseLabel: "Certification Tracker", pulseFields: { primary: "certification_type", secondary: "expiry_date", statusField: "status" },
    quickTools: [
      { id: "sessions", label: "Sessions", icon: GraduationCap }, { id: "assessments", label: "Assessments", icon: ClipboardList },
      { id: "certifications", label: "Certs", icon: CheckCircle2 }, { id: "trainees", label: "Trainees", icon: Users },
      { id: "materials", label: "Materials", icon: BookOpen }, { id: "hq_connect", label: "HQ", icon: Phone },
    ],
    primaryHubModule: "sessions",
  },
};

export const getCockpitProfile = (rank: string): RankCockpitProfile | null =>
  rankCockpitProfiles[rank] ?? null;
