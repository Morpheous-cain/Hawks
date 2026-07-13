import {
  Clock, Car, Radio, Camera, Wrench, Dog, Users,
  Search, Truck, Calendar, Shield, MapPin, FileText,
  AlertTriangle, Bell, ClipboardList, ClipboardCheck, Monitor, GraduationCap,
  Map, BookOpen, Heart, Timer, Key, Package, TrendingUp,
} from "lucide-react";
import React from "react";

export interface RankModule {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

// ponytail: only these module ids render for the guard rank. Add ids back to
// this set (or return true unconditionally) to re-enable the rest later.
export const GUARD_VISIBLE_MODULES = new Set<string>([
  "clock",
  "pre_shift_brief",
  "welfare_check",
  "hq_connect",
  "field_ob",
  "incidents",
  "bodycam",
]);

export const isModuleVisible = (id: string, rank: string): boolean =>
  rank === "guard" ? GUARD_VISIBLE_MODULES.has(id) : true;

// Each rank has its own specific sidebar modules
export const rankSidebarConfig: Record<string, RankModule[]> = {
  guard: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "beat_map", name: "Beat Map", icon: Map, color: "text-blue-400" },
    { id: "pre_shift_brief", name: "Pre-Shift Brief", icon: BookOpen, color: "text-cyan-500" },
    { id: "threat_watch", name: "Threat Watch", icon: AlertTriangle, color: "text-amber-500" },
    { id: "welfare_check", name: "Welfare Check", icon: Heart, color: "text-emerald-500" },
    { id: "lone_worker", name: "Lone-Worker Timer", icon: Timer, color: "text-orange-500" },
    { id: "visitor_log", name: "Visitor Log", icon: Users, color: "text-indigo-500" },
    { id: "vehicle_inspect", name: "Vehicle Inspect", icon: Truck, color: "text-cyan-500" },
    { id: "key_custody", name: "Key & Asset", icon: Key, color: "text-amber-500" },
    { id: "parcel_log", name: "Parcel Log", icon: Package, color: "text-teal-500" },
    { id: "evidence_vault", name: "Evidence Vault", icon: Camera, color: "text-red-500" },
    { id: "my_performance", name: "My Performance", icon: TrendingUp, color: "text-emerald-500" },
    { id: "my_schedule", name: "My Schedule", icon: Calendar, color: "text-purple-500" },
    { id: "drills", name: "Drills", icon: GraduationCap, color: "text-pink-500" },
    { id: "hq_connect", name: "HQ Connect", icon: Radio, color: "text-cyan-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-red-500" },
    { id: "incidents", name: "Report Incident", icon: AlertTriangle, color: "text-orange-500" },
    { id: "field_ob", name: "Field O.B", icon: FileText, color: "text-purple-500" },
  ],
  supervisor: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "live_team_map", name: "Live Team Map", icon: Map, color: "text-blue-400" },
    { id: "attendance_board", name: "Attendance Board", icon: Users, color: "text-cyan-500" },
    { id: "patrol_performance", name: "Patrol Performance", icon: TrendingUp, color: "text-emerald-500" },
    { id: "welfare_oversight", name: "Welfare Oversight", icon: Heart, color: "text-amber-500" },
    { id: "incident_triage", name: "Incident Triage", icon: AlertTriangle, color: "text-red-500" },
    { id: "broadcast_composer", name: "Broadcast", icon: Radio, color: "text-orange-500" },
    { id: "site_audit", name: "Site Audit", icon: ClipboardList, color: "text-indigo-500" },
    { id: "team", name: "Team Management", icon: Users, color: "text-purple-500" },
    { id: "patrol", name: "Patrol Monitor", icon: MapPin, color: "text-green-500" },
    { id: "fleet_status", name: "Fleet Status", icon: Car, color: "text-cyan-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-red-500" },
    { id: "incidents", name: "Incident Reports", icon: AlertTriangle, color: "text-amber-500" },
    { id: "management_ob", name: "Management O.B", icon: FileText, color: "text-indigo-500" },
    { id: "tasks", name: "Task Assignment", icon: ClipboardList, color: "text-cyan-500" },
  ],
  response: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "mdt", name: "MDT Console", icon: Car, color: "text-cyan-500" },
    { id: "alarms", name: "Alarm Response", icon: Bell, color: "text-red-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-pink-500" },
    { id: "incidents", name: "Report Incident", icon: AlertTriangle, color: "text-amber-500" },
    { id: "field_ob", name: "Field O.B", icon: FileText, color: "text-purple-500" },
    { id: "navigation", name: "Navigation", icon: MapPin, color: "text-green-500" },
  ],
  technician: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "workorders", name: "Work Orders", icon: ClipboardList, color: "text-cyan-500" },
    { id: "maintenance", name: "Maintenance", icon: Wrench, color: "text-emerald-500" },
    { id: "equipment", name: "Equipment", icon: Wrench, color: "text-orange-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-red-500" },
    { id: "field_ob", name: "Field O.B", icon: FileText, color: "text-purple-500" },
    { id: "reports", name: "Service Reports", icon: FileText, color: "text-indigo-500" },
  ],
  k9: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "k9ops", name: "K9 Operations", icon: Dog, color: "text-amber-500" },
    { id: "patrol", name: "Patrol Routes", icon: MapPin, color: "text-green-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-red-500" },
    { id: "health", name: "K9 Health Log", icon: ClipboardList, color: "text-pink-500" },
    { id: "incidents", name: "Report Incident", icon: AlertTriangle, color: "text-orange-500" },
    { id: "field_ob", name: "Field O.B", icon: FileText, color: "text-purple-500" },
  ],
  escort: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "missions", name: "Active Missions", icon: Shield, color: "text-emerald-500" },
    { id: "navigation", name: "Route Navigation", icon: MapPin, color: "text-green-500" },
    { id: "comms", name: "Communications", icon: Radio, color: "text-orange-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-red-500" },
    { id: "incidents", name: "Report Incident", icon: AlertTriangle, color: "text-amber-500" },
    { id: "field_ob", name: "Field O.B", icon: FileText, color: "text-purple-500" },
  ],
  investigator: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "cases", name: "Active Cases", icon: Search, color: "text-indigo-500" },
    { id: "evidence", name: "Evidence", icon: Camera, color: "text-red-500" },
    { id: "interviews", name: "Interviews", icon: Users, color: "text-purple-500" },
    { id: "reports", name: "Case Reports", icon: FileText, color: "text-cyan-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-pink-500" },
    { id: "management_ob", name: "Management O.B", icon: FileText, color: "text-indigo-500" },
  ],
  courier: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "deliveries", name: "Deliveries", icon: Truck, color: "text-teal-500" },
    { id: "navigation", name: "Navigation", icon: MapPin, color: "text-green-500" },
    { id: "pickup", name: "Pickup Queue", icon: ClipboardList, color: "text-orange-500" },
    { id: "history", name: "Delivery History", icon: FileText, color: "text-purple-500" },
    { id: "field_ob", name: "Field O.B", icon: FileText, color: "text-indigo-500" },
  ],
  events: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "assignment", name: "My Assignment", icon: Calendar, color: "text-pink-500" },
    { id: "zones", name: "Zone Map", icon: MapPin, color: "text-green-500" },
    { id: "bodycam", name: "Body Cam", icon: Camera, color: "text-red-500" },
    { id: "incidents", name: "Report Incident", icon: AlertTriangle, color: "text-orange-500" },
    { id: "comms", name: "Team Comms", icon: Radio, color: "text-purple-500" },
    { id: "field_ob", name: "Field O.B", icon: FileText, color: "text-indigo-500" },
  ],
  control_operator: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "monitoring", name: "Live Monitoring", icon: Camera, color: "text-cyan-500" },
    { id: "dispatch", name: "Dispatch Control", icon: Radio, color: "text-orange-500" }, // Full dispatch control
    { id: "alarms", name: "Alarm Panel", icon: Bell, color: "text-red-500" },
    { id: "incidents", name: "Incidents", icon: AlertTriangle, color: "text-amber-500" },
    { id: "comms", name: "Communications", icon: Radio, color: "text-purple-500" },
    { id: "control_ob", name: "Control O.B", icon: FileText, color: "text-indigo-500" },
  ],
  operations_officer: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "dispatch", name: "Dispatch Control", icon: Radio, color: "text-orange-500" }, // Full dispatch control
    { id: "resources", name: "Resource Status", icon: Users, color: "text-purple-500" },
    { id: "incidents", name: "Incident Management", icon: AlertTriangle, color: "text-red-500" },
    { id: "patrol", name: "Patrol Monitor", icon: MapPin, color: "text-green-500" },
    { id: "reports", name: "Operations Reports", icon: FileText, color: "text-cyan-500" },
    { id: "operations_ob", name: "Operations O.B", icon: FileText, color: "text-indigo-500" },
  ],
  training_officer: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "sessions", name: "Training Sessions", icon: Calendar, color: "text-pink-500" },
    { id: "assessments", name: "Assessments", icon: ClipboardList, color: "text-cyan-500" },
    { id: "certifications", name: "Certifications", icon: FileText, color: "text-emerald-500" },
    { id: "trainees", name: "Trainees", icon: Users, color: "text-purple-500" },
    { id: "materials", name: "Training Materials", icon: FileText, color: "text-orange-500" },
    { id: "management_ob", name: "Management O.B", icon: FileText, color: "text-indigo-500" },
  ],
  deployment_officer: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "deployment_board", name: "Deployment Board", icon: ClipboardList, color: "text-orange-500" },
    { id: "attendance_board", name: "Attendance Board", icon: Users, color: "text-cyan-500" },
    { id: "staff_scheduling", name: "Shift Scheduling", icon: Calendar, color: "text-purple-500" },
    { id: "equipment", name: "Equipment Issuance", icon: Package, color: "text-amber-500" },
    { id: "field_officers", name: "Field Officers", icon: Users, color: "text-indigo-500" },
    { id: "management_ob", name: "Deployment O.B", icon: FileText, color: "text-violet-500" },
  ],
  field_ops_officer: [
    { id: "clock", name: "Clock In/Out", icon: Clock, color: "text-blue-500" },
    { id: "live_team_map", name: "Live Team Map", icon: Map, color: "text-blue-400" },
    { id: "field_officers", name: "Field Officers", icon: Users, color: "text-purple-500" },
    { id: "supervision_patrol", name: "Site Supervision", icon: ClipboardCheck, color: "text-emerald-500" },
    { id: "incidents", name: "Incident Triage", icon: AlertTriangle, color: "text-red-500" },
    { id: "comms", name: "Communications", icon: Radio, color: "text-orange-500" },
    { id: "patrol", name: "Patrol Monitor", icon: MapPin, color: "text-green-500" },
    { id: "management_ob", name: "Field Ops O.B", icon: FileText, color: "text-indigo-500" },
  ],
};

export const getRankDisplayName = (rankId: string): string => {
  const names: Record<string, string> = {
    guard: "Guard",
    supervisor: "Supervisor",
    response: "Response Officer",
    technician: "Technician",
    k9: "K9 Handler",
    escort: "Escort Officer",
    investigator: "Investigator",
    courier: "Rider/Driver",
    events: "Event Security",
    control_operator: "Control Room Operator",
    operations_officer: "Operations Officer",
    training_officer: "Training Officer",
    deployment_officer: "Deployment Officer",
    field_ops_officer: "Field Operations Officer",
  };
  return names[rankId] || "Officer";
};

export const getRankColor = (rankId: string): string => {
  const colors: Record<string, string> = {
    guard: "from-blue-500 to-blue-600",
    supervisor: "from-purple-500 to-purple-600",
    response: "from-orange-500 to-orange-600",
    technician: "from-cyan-500 to-cyan-600",
    k9: "from-amber-500 to-amber-600",
    escort: "from-emerald-500 to-emerald-600",
    investigator: "from-indigo-500 to-indigo-600",
    courier: "from-teal-500 to-teal-600",
    events: "from-pink-500 to-pink-600",
    control_operator: "from-slate-500 to-slate-600",
    operations_officer: "from-red-500 to-red-600",
    training_officer: "from-violet-500 to-violet-600",
    deployment_officer: "from-orange-500 to-amber-600",
    field_ops_officer: "from-cyan-600 to-blue-700",
  };
  return colors[rankId] || "from-blue-500 to-blue-600";
};

export const getRankIcon = (rankId: string): React.ElementType => {
  const icons: Record<string, React.ElementType> = {
    guard: Shield,
    supervisor: Users,
    response: Radio,
    technician: Wrench,
    k9: Dog,
    escort: Shield,
    investigator: Search,
    courier: Truck,
    events: Calendar,
    control_operator: Monitor,
    operations_officer: Radio,
    training_officer: GraduationCap,
    deployment_officer: ClipboardList,
    field_ops_officer: MapPin,
  };
  return icons[rankId] || Shield;
};