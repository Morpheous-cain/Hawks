import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { toast } from "sonner";
import logo from "@/assets/black-hawk-logo.png";
import { IncidentCreateDialog } from "@/components/control-room/IncidentCreateDialog";
import { BroadcastDialog } from "@/components/control-room/BroadcastDialog";
import { RadioCallDialog } from "@/components/control-room/RadioCallDialog";
import { RequestBackupDialog } from "@/components/control-room/RequestBackupDialog";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/utils/auditLog";
import OfficerProfileDialog, { type OfficerProfile } from "@/components/duty-roster/OfficerProfileDialog";
import FullRosterDialog, { type RosterRow } from "@/components/duty-roster/FullRosterDialog";
import RosterEntryDialog from "@/components/duty-roster/RosterEntryDialog";
import KenyaMap, { type KenyaPin } from "@/components/duty-roster/KenyaMap";
import KpiDrillDownDrawer, { type KpiDrillDownConfig } from "@/components/duty-roster/KpiDrillDownDrawer";
import LiveAuditTrail from "@/components/duty-roster/LiveAuditTrail";
import IncidentSlaPanel from "@/components/duty-roster/IncidentSlaPanel";
import ShiftRotationPanel from "@/components/duty-roster/ShiftRotationPanel";
import { getShiftInfo, formatCountdown, type ShiftCode } from "@/components/duty-roster/shiftClock";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield, AlertTriangle, Radio, Users, MapPin, Activity, Server,
  Wifi, Camera, HardDrive, Database, ShieldAlert, Siren, Truck, Car,
  Dog, Bike, PhoneCall, Megaphone, Bell, Clock, ChevronRight, Settings,
  LayoutDashboard, Eye, Brain, FileText, BarChart3, Network, Calendar,
  CheckCircle2, XCircle, TrendingUp, Zap, UserCheck, Headphones, Phone,
  Play, Mic, MessageSquare, PlusCircle, Send, AlertOctagon, ClipboardList,
  UserPlus, Pencil, Trash2, Plus,
} from "lucide-react";

// ===== Mock command staff (replace with real staff feed) =====
// ===== Seed data — promoted to state inside the component =====
const INITIAL_commandStaff: RosterRow[] = [
  { role: "Duty Officer", call: "ALPHA-1", name: "Sgt. Kevin Mwangi", phone: "+254 722 001 001", location: "SOC HQ", accent: "cyan", shift: "19:00 – 07:00", status: "ON DUTY" },
  { role: "Night Manager", call: "ALPHA-9", name: "Ms. Grace Otieno", phone: "+254 722 001 009", location: "SOC HQ", accent: "emerald", shift: "19:00 – 07:00", status: "ON DUTY" },
  { role: "Duty Incident Manager", call: "ALPHA-3", name: "Insp. Brian Odhiambo", phone: "+254 722 001 003", location: "Incident Command", accent: "amber", shift: "19:00 – 07:00", status: "ON DUTY" },
  { role: "Operations Manager", call: "ALPHA-6", name: "Chief. Daniel Kariuki", phone: "+254 722 001 006", location: "Operations Centre", accent: "violet", shift: "19:00 – 07:00", status: "ON DUTY" },
  { role: "Deployment Officer", call: "BRAVO-2", name: "Mr. James Mutua", phone: "+254 722 001 011", location: "Deployment Desk", accent: "blue", shift: "19:00 – 07:00", status: "ON DUTY" },
  { role: "Control Room Supervisor", call: "CONTROL-1", name: "Ms. Lydia Achieng", phone: "+254 722 001 199", location: "Control Room", accent: "rose", shift: "19:00 – 07:00", status: "ON DUTY" },
];

const INITIAL_EXTRA_ROSTER: RosterRow[] = [
  { role: "Dispatch Officer", call: "BRAVO-1", name: "Cpl. Peter Njoroge", phone: "+254 722 001 020", location: "Dispatch Desk", shift: "19:00 – 07:00", status: "ON DUTY", accent: "blue" },
  { role: "Communications Officer", call: "COMMS-1", name: "Cpl. Mary Wanjiku", phone: "+254 722 001 021", location: "Comms Centre", shift: "19:00 – 07:00", status: "ON DUTY", accent: "cyan" },
  { role: "CCTV Surveillance Analyst", call: "MON-2", name: "Mr. Allan Kiptoo", phone: "+254 722 001 022", location: "Control Room", shift: "19:00 – 07:00", status: "ON DUTY", accent: "emerald" },
  { role: "Intelligence Analyst", call: "INTEL-1", name: "Mr. Collins Obiero", phone: "+254 722 001 023", location: "Intel Desk", shift: "19:00 – 07:00", status: "ON DUTY", accent: "violet" },
];

const INITIAL_radioChannels = [
  { name: "Command", code: "CMD-1", active: 8, tone: "cyan" },
  { name: "Dispatch", code: "DSP-2", active: 14, tone: "blue" },
  { name: "Patrol North", code: "PTR-N", active: 9, tone: "emerald" },
  { name: "Patrol South", code: "PTR-S", active: 7, tone: "emerald" },
  { name: "Emergency", code: "EMG-911", active: 3, tone: "rose" },
  { name: "K9 Unit", code: "K9-1", active: 2, tone: "amber" },
];

const NAV_ITEMS = [
  { label: "Command Board", icon: LayoutDashboard, to: "/duty-roster", active: true },
  { label: "Incidents", icon: AlertTriangle, to: "/incidents" },
  { label: "Live Monitoring", icon: Eye, to: "/cctv" },
  { label: "Threat Intelligence", icon: Brain, to: "/strategic-advisory" },
  { label: "Deployment", icon: Truck, to: "/deployment-board" },
  { label: "Units", icon: Users, to: "/field-officers" },
  { label: "Communications", icon: Radio, to: "/comms" },
  { label: "Map Overview", icon: MapPin, to: "/map" },
  { label: "Reports & Analytics", icon: BarChart3, to: "/analytics" },
  { label: "Logs", icon: FileText, to: "/audit-log" },
  { label: "System Health", icon: Server, to: "/settings?tab=health" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

const accentMap: Record<string, { ring: string; text: string; glow: string; bar: string }> = {
  cyan: { ring: "ring-cyan-400/40", text: "text-cyan-300", glow: "shadow-[0_0_24px_-6px_rgba(34,211,238,.55)]", bar: "from-cyan-400 to-blue-500" },
  emerald: { ring: "ring-emerald-400/40", text: "text-emerald-300", glow: "shadow-[0_0_24px_-6px_rgba(52,211,153,.55)]", bar: "from-emerald-400 to-teal-500" },
  amber: { ring: "ring-amber-400/40", text: "text-amber-300", glow: "shadow-[0_0_24px_-6px_rgba(251,191,36,.55)]", bar: "from-amber-400 to-orange-500" },
  violet: { ring: "ring-violet-400/40", text: "text-violet-300", glow: "shadow-[0_0_24px_-6px_rgba(167,139,250,.55)]", bar: "from-violet-400 to-fuchsia-500" },
  blue: { ring: "ring-blue-400/40", text: "text-blue-300", glow: "shadow-[0_0_24px_-6px_rgba(96,165,250,.55)]", bar: "from-blue-400 to-indigo-500" },
  rose: { ring: "ring-rose-400/40", text: "text-rose-300", glow: "shadow-[0_0_24px_-6px_rgba(251,113,133,.55)]", bar: "from-rose-400 to-pink-500" },
};

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(-2).join("").toUpperCase();

const Panel = ({ title, icon: Icon, action, children, className = "" }: any) => (
  <Card className={`relative overflow-hidden border-white/5 bg-[#0B1220]/80 backdrop-blur-xl ${className}`}>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
    <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-cyan-300" />}
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-200">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-2.5">{children}</div>
  </Card>
);

const Stat = ({ label, value, tone = "slate" }: any) => {
  const tones: Record<string, string> = {
    slate: "text-slate-100",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-400",
    blue: "text-blue-300",
    violet: "text-violet-300",
  };
  return (
    <div className="rounded border border-white/5 bg-black/30 px-2 py-1">
      <div className="text-[9px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-0.5 text-base font-bold tabular-nums ${tones[tone]}`}>{value}</div>
    </div>
  );
};

const HealthBar = ({ label, value, icon: Icon }: any) => {
  const tone = value >= 95 ? "emerald" : value >= 80 ? "amber" : "rose";
  const colorMap: Record<string, string> = { emerald: "bg-emerald-400", amber: "bg-amber-400", rose: "bg-rose-500" };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-300"><Icon className="h-3.5 w-3.5" />{label}</span>
        <span className="tabular-nums font-semibold text-slate-100">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${colorMap[tone]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

export default function DutyRosterBoard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [showIncident, setShowIncident] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showRadio, setShowRadio] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [activeChannel, setActiveChannel] = useState("CMD-1");
  const [profileOfficer, setProfileOfficer] = useState<OfficerProfile | null>(null);
  const [showFullRoster, setShowFullRoster] = useState(false);
  const [drillKpi, setDrillKpi] = useState<KpiDrillDownConfig | null>(null);
  const pttStart = useRef<number | null>(null);

  // ===== Editable roster + channel state =====
  const [fullRoster, setFullRoster] = useState<RosterRow[]>([...INITIAL_commandStaff, ...INITIAL_EXTRA_ROSTER]);
  const commandStaff = useMemo(
    () => fullRoster.filter((r) => INITIAL_commandStaff.some((c) => c.call === r.call)).slice(0, 6).length
      ? fullRoster.slice(0, 6)
      : INITIAL_commandStaff,
    [fullRoster]
  );
  const [radioChannels, setRadioChannels] = useState(INITIAL_radioChannels);
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RosterRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RosterRow | null>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelCode, setNewChannelCode] = useState("");

  const openAddRoster = () => { setEditingEntry(null); setRosterDialogOpen(true); };
  const openEditRoster = (r: RosterRow) => { setEditingEntry(r); setRosterDialogOpen(true); };

  const handleSaveRoster = (entry: RosterRow, originalCall?: string) => {
    setFullRoster((prev) => {
      if (originalCall) {
        return prev.map((r) => (r.call === originalCall ? entry : r));
      }
      if (prev.some((r) => r.call === entry.call)) {
        toast.error("Call sign already exists", { description: `${entry.call} is in use.` });
        return prev;
      }
      return [...prev, entry];
    });
    logAudit({
      module: "duty_roster",
      action: originalCall ? "roster_entry_updated" : "roster_entry_added",
      
      recordId: entry.call,
      changes: entry as any,
    });
    toast.success(originalCall ? "Roster entry updated" : "Personnel added to roster", {
      description: `${entry.name} · ${entry.call}`,
    });
  };

  const handleDeleteRoster = (r: RosterRow) => {
    setFullRoster((prev) => prev.filter((x) => x.call !== r.call));
    logAudit({
      module: "duty_roster",
      action: "roster_entry_removed",
      
      recordId: r.call,
      changes: r as any,
    });
    toast.success("Removed from roster", { description: `${r.name} · ${r.call}` });
  };

  const addChannel = () => {
    const name = newChannelName.trim();
    const code = newChannelCode.trim().toUpperCase();
    if (!name || !code) return;
    if (radioChannels.some((c) => c.code === code)) {
      toast.error("Channel code already exists");
      return;
    }
    setRadioChannels((prev) => [...prev, { name, code, active: 0, tone: "cyan" }]);
    logAudit({ module: "duty_roster", action: "radio_channel_added", recordId: code });
    toast.success("Channel added", { description: `${name} · ${code}` });
    setNewChannelName(""); setNewChannelCode("");
  };

  const removeChannel = (code: string) => {
    setRadioChannels((prev) => prev.filter((c) => c.code !== code));
    if (activeChannel === code) setActiveChannel("CMD-1");
    logAudit({ module: "duty_roster", action: "radio_channel_removed", recordId: code });
    toast.success(`Channel ${code} removed`);
  };


  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Real-time refresh on incidents/alarms/sos/patrols
  useEffect(() => {
    const ch = supabase
      .channel("duty-roster-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => setNow(new Date()))
      .on("postgres_changes", { event: "*", schema: "public", table: "alarm_activations" }, () => setNow(new Date()))
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => setNow(new Date()))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ===== Automatic shift rotation (Day 06:00 / Night 18:00 · 15-min pre-shift) =====
  const shiftInfo = useMemo(() => getShiftInfo(now), [now]);
  const lastShiftRef = useRef<ShiftCode>(shiftInfo.current);
  const preWarnedRef = useRef<string | null>(null);

  useEffect(() => {
    // Shift handover transition
    if (shiftInfo.current !== lastShiftRef.current) {
      const from = lastShiftRef.current;
      const to = shiftInfo.current;
      lastShiftRef.current = to;
      const window = shiftInfo.currentWindow;
      toast.success(`Shift rotated → ${shiftInfo.currentLabel}`, {
        description: `${window} · roster automatically updated.`,
      });
      // Rotate roster: officers tagged for new window go ON DUTY, others STANDBY/OFF
      setFullRoster((prev) => prev.map((r) => {
        const win = (r.shift || "").replace(/\s/g, "");
        const matches = win.includes(window.replace(/\s/g, ""));
        return { ...r, status: matches ? "ON DUTY" : (r.status === "ON LEAVE" ? "ON LEAVE" : "OFF DUTY") };
      }));
      logAudit({
        module: "duty_roster",
        action: "shift_auto_rotated",
        changes: { from, to, window } as any,
      });
    }
    // 15-min pre-shift one-shot toast
    const stamp = shiftInfo.nextStart.toISOString();
    if (shiftInfo.preShiftActive && preWarnedRef.current !== stamp) {
      preWarnedRef.current = stamp;
      toast.warning(`Handover in ${Math.ceil(shiftInfo.preShiftRemainingSec / 60)} min`, {
        description: `Prepare for ${shiftInfo.nextLabel} (${shiftInfo.nextWindow}).`,
        duration: 8000,
      });
      logAudit({
        module: "duty_roster",
        action: "shift_pre_handover_alert",
        changes: { next: shiftInfo.nextShift, at: stamp } as any,
      });
    }
  }, [shiftInfo]);

  const handleStartHandover = () => {
    toast.info("Handover protocol initiated", { description: "Outgoing supervisor to log notes & open issues." });
    logAudit({ module: "duty_roster", action: "shift_handover_started" });
    navigate("/shift-handover");
  };
  const handleBroadcastShift = () => {
    setShowBroadcast(true);
    logAudit({ module: "duty_roster", action: "shift_broadcast_opened" });
  };
  const handleForceRotate = () => {
    // Simulated force-flip for drills — just toggle status grouping
    setFullRoster((prev) => prev.map((r) => ({
      ...r,
      status: r.status === "ON DUTY" ? "STANDBY" : "ON DUTY",
    })));
    toast.success("Force-rotation applied (drill mode)");
    logAudit({ module: "duty_roster", action: "shift_force_rotated" });
  };




  const { metrics } = useDashboardMetrics(useMemo(() => [
    { key: "incidentsOpen", table: "incidents", filter: (q: any) => q.in("status", ["open", "in_progress"]) },
    { key: "incidentsCritical", table: "incidents", filter: (q: any) => q.eq("severity", "critical").in("status", ["open", "in_progress"]) },
    { key: "incidentsHigh", table: "incidents", filter: (q: any) => q.eq("severity", "high").in("status", ["open", "in_progress"]) },
    { key: "incidentsMedium", table: "incidents", filter: (q: any) => q.eq("severity", "medium").in("status", ["open", "in_progress"]) },
    { key: "incidentsLow", table: "incidents", filter: (q: any) => q.eq("severity", "low").in("status", ["open", "in_progress"]) },
    { key: "alarmsActive", table: "alarm_activations", filter: (q: any) => q.in("status", ["active", "responding"]) },
    { key: "sosActive", table: "sos_alerts", filter: (q: any) => q.in("status", ["active", "acknowledged"]) },
    { key: "patrolsActive", table: "patrols", filter: (q: any) => q.eq("status", "active") },
    { key: "staff", table: "staff" },
  ], []));

  const totalPersonnel = metrics.staff || 248;
  const sites = 142;
  const guardsOnDuty = 186;
  const unitsDeployed = 31;
  const activeIncidents = metrics.incidentsOpen ?? 7;
  const alerts = (metrics.alarmsActive ?? 4) + (metrics.sosActive ?? 1);

  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).toUpperCase();

  const handlePanic = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("sos_alerts").insert({
        triggered_by: user?.id ?? null,
        location_description: "Duty Roster Board · Manual panic trigger",
        status: "active",
        alert_type: "panic",
      } as any);
      if (error) throw error;
      await logAudit({ module: "duty_roster", action: "panic_alert" });
      toast.error("PANIC ALERT broadcast", { description: "All response units notified." });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to trigger panic");
    }
  };

  const handleRollCall = async () => {
    await logAudit({ module: "duty_roster", action: "roll_call_initiated" });
    toast.success("Roll Call initiated", { description: "All on-duty officers prompted to check in." });
  };

  const handleDeploy = async () => {
    await logAudit({ module: "duty_roster", action: "deploy_unit" });
    navigate("/courier");
  };

  const handleViewProfile = (officer: OfficerProfile) => {
    setProfileOfficer(officer);
  };

  const togglePTT = (pressed: boolean) => {
    if (pressed) {
      pttStart.current = Date.now();
      setPttActive(true);
      toast.info(`PTT open · ${activeChannel}`, { description: "Hold to transmit." });
    } else {
      const ms = pttStart.current ? Date.now() - pttStart.current : 0;
      setPttActive(false);
      pttStart.current = null;
      if (ms > 300) {
        supabase.from("comms_records").insert({
          type: "ptt",
          message_summary: `[PTT · ${activeChannel}] ${(ms / 1000).toFixed(1)}s transmission`,
          timestamp: new Date().toISOString(),
        } as any);
        toast.success(`PTT closed · ${(ms / 1000).toFixed(1)}s logged`);
      }
    }
  };


  const KPI_TILES: (KpiDrillDownConfig & { i: any })[] = [
    {
      key: "incidents", label: "Incidents", value: activeIncidents, tone: "rose", i: AlertTriangle, to: "/incidents",
      description: "Open and in-progress incidents across all regions in real time.",
      trend: { value: "-12% vs 24h", direction: "down" },
      breakdown: [
        { label: "Critical", value: metrics.incidentsCritical ?? 2, tone: "rose" },
        { label: "High", value: metrics.incidentsHigh ?? 5, tone: "amber" },
        { label: "Medium", value: metrics.incidentsMedium ?? 11, tone: "blue" },
        { label: "Low", value: metrics.incidentsLow ?? 8, tone: "emerald" },
      ],
      recentItems: [
        { id: "BH-INC-2041", title: "Armed intrusion · Westlands Tower", meta: "ALPHA-3 · 7m elapsed", tone: "rose" },
        { id: "BH-INC-2040", title: "Perimeter breach · Karen Estate", meta: "BRAVO-2 · 14m elapsed", tone: "amber" },
        { id: "BH-INC-2039", title: "Medical · Site #44", meta: "K9-2 · 32m elapsed", tone: "blue" },
      ],
    },
    {
      key: "alerts", label: "Alerts", value: alerts, tone: "amber", i: Bell, to: "/alarms",
      description: "Active alarms and SOS triggers awaiting acknowledgement or response.",
      trend: { value: "+3 last hour", direction: "up" },
      breakdown: [
        { label: "Alarms", value: metrics.alarmsActive ?? 4, tone: "amber" },
        { label: "SOS", value: metrics.sosActive ?? 1, tone: "rose" },
        { label: "Acknowledged", value: 9, tone: "emerald" },
        { label: "False +", value: 2, tone: "slate" },
      ],
    },
    {
      key: "units", label: "Units", value: unitsDeployed, tone: "blue", i: Truck, to: "/deployment-board",
      description: "Vehicles and response teams currently deployed in the field.",
      breakdown: [
        { label: "Patrol", value: 22, tone: "blue" },
        { label: "Response", value: 12, tone: "rose" },
        { label: "K9", value: 4, tone: "amber" },
        { label: "Available", value: 9, tone: "emerald" },
      ],
    },
    {
      key: "onduty", label: "On Duty", value: guardsOnDuty, tone: "emerald", i: UserCheck, to: "/field-officers",
      description: "Personnel currently checked in across all sites and posts.",
      trend: { value: "100% roll-call", direction: "down" },
      breakdown: [
        { label: "Officers", value: 142, tone: "emerald" },
        { label: "Supervisors", value: 18, tone: "violet" },
        { label: "Command", value: 12, tone: "cyan" },
        { label: "Tactical", value: 14, tone: "rose" },
      ],
    },
    {
      key: "sites", label: "Sites", value: sites, tone: "cyan", i: MapPin, to: "/clients",
      description: "Client sites under active protection right now.",
      breakdown: [
        { label: "Premium", value: 38, tone: "amber" },
        { label: "Standard", value: 84, tone: "cyan" },
        { label: "Periodic", value: 20, tone: "blue" },
        { label: "On Alert", value: 7, tone: "rose" },
      ],
    },
  ];

  const QUICK_ACTIONS = [
    { l: "Create Incident", i: PlusCircle, t: "rose", onClick: () => setShowIncident(true) },
    { l: "Deploy Unit", i: Truck, t: "blue", onClick: handleDeploy },
    { l: "Panic Alert", i: Siren, t: "rose", onClick: handlePanic },
    { l: "Roll Call", i: UserCheck, t: "emerald", onClick: handleRollCall },
    { l: "Message All", i: Send, t: "cyan", onClick: () => setShowBroadcast(true) },
    { l: "Open Situation Room", i: ShieldAlert, t: "amber", onClick: () => navigate("/war-room") },
    { l: "Open Command Channel", i: Radio, t: "violet", onClick: () => setShowRadio(true) },
  ];


  return (
    <div className="min-h-screen bg-[#05080F] text-slate-200 -mx-4 -my-6 md:-mx-8 md:-my-8">
      <div className="flex">
        {/* ===== Main ===== */}
        <main className="min-w-0 flex-1 space-y-2.5 p-3 md:p-4 pb-16">
          {/* Module title + KPI strip on one row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-3 py-1.5">
              <ClipboardList className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">Duty Roster Board</span>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <div className="rounded border border-white/10 bg-black/40 px-2 py-1 text-center">
                <div className="text-[8px] uppercase tracking-wider text-slate-500">{date}</div>
                <div className="font-mono text-xs font-bold tabular-nums text-cyan-300">{time} <span className="text-[9px] text-slate-500">EAT</span></div>
              </div>
              {KPI_TILES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setDrillKpi(c)}
                  className="min-w-[68px] rounded border border-white/10 bg-black/40 px-2 py-1 text-center transition hover:border-cyan-400/40 hover:bg-cyan-500/5"
                >
                  <div className="flex items-center justify-center gap-1 text-[8px] uppercase tracking-wider text-slate-500">
                    <c.i className="h-2.5 w-2.5" />{c.label}
                  </div>
                  <div className={`font-mono text-sm font-bold tabular-nums text-${c.tone}-300`}>{c.value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Shift banner — live auto-rotating */}
          <div className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-1.5 backdrop-blur transition-colors ${
            shiftInfo.preShiftActive
              ? "border-rose-500/40 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-rose-500/10"
              : shiftInfo.current === "DAY"
                ? "border-amber-400/20 bg-gradient-to-r from-amber-500/5 via-transparent to-cyan-500/5"
                : "border-indigo-400/20 bg-gradient-to-r from-indigo-500/10 via-transparent to-violet-500/5"
          }`}>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Users className="h-3.5 w-3.5 text-cyan-300" />
              <span className="font-semibold uppercase tracking-wider text-slate-300">On Duty Assignments</span>
              <span className="text-slate-500">·</span>
              <Clock className="h-3 w-3 text-slate-400" />
              <span className="text-slate-400">Shift:</span>
              <span className={`font-semibold ${shiftInfo.current === "DAY" ? "text-amber-300" : "text-indigo-300"}`}>
                {shiftInfo.currentLabel}
              </span>
              <span className="font-mono text-slate-500">{shiftInfo.currentWindow}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Next handover:</span>
              <span className={`font-mono font-bold tabular-nums ${shiftInfo.preShiftActive ? "text-rose-300 animate-pulse" : "text-cyan-300"}`}>
                {formatCountdown(shiftInfo.preShiftRemainingSec)}
              </span>
              {shiftInfo.preShiftActive && (
                <Badge className="animate-pulse border border-rose-500/40 bg-rose-500/15 text-[9px] text-rose-300">
                  PRE-SHIFT · {shiftInfo.nextLabel}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={openAddRoster}
                className="h-6 gap-1 bg-cyan-500/15 px-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/25"
              >
                <UserPlus className="h-3 w-3" /> Add Personnel
              </Button>
              <Link to="/staff?view=org" className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300 hover:text-cyan-200">
                View Organisation Chart →
              </Link>
            </div>
          </div>

          {/* Shift Transition Center */}
          <ShiftRotationPanel
            shift={shiftInfo}
            roster={fullRoster}
            onStartHandover={handleStartHandover}
            onBroadcastShift={handleBroadcastShift}
            onForceRotate={handleForceRotate}
          />


          {/* ===== Command Team Cards — compact ===== */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {commandStaff.map((p) => {
              const a = accentMap[p.accent];
              return (
                <Card key={p.call} className={`relative overflow-hidden border-white/5 bg-[#0B1220]/80 p-2.5 backdrop-blur-xl ${a.glow}`}>
                  <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.bar}`} />
                  <div className={`text-center text-[9px] font-bold uppercase tracking-[0.15em] ${a.text}`}>{p.role}</div>
                  <div className="my-1.5 flex justify-center">
                    <Avatar className={`h-10 w-10 ring-2 ${a.ring}`}>
                      <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-slate-200">
                        {initials(p.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-bold tracking-wider ${a.text}`}>{p.call}</div>
                    <div className="truncate text-[10px] font-medium text-slate-200">{p.name}</div>
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-slate-400">
                    <Phone className="h-2.5 w-2.5" />{p.phone}
                  </div>
                  <div className="mt-1 flex justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-300">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" /> ON DUTY
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewProfile(p)}
                      className={`h-7 border-white/10 bg-white/[0.02] px-1 text-[9px] ${a.text} hover:bg-white/5`}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditRoster(p)}
                      className="h-7 border-amber-500/30 px-1 text-[9px] text-amber-300 hover:bg-amber-500/10"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(p)}
                      className="h-7 border-rose-500/30 px-1 text-[9px] text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ===== Row 1: Personnel · Deployment · Incidents ===== */}
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            <Panel title="Personnel Summary" icon={Users}>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Total Personnel" value={totalPersonnel} tone="cyan" />
                <Stat label="Command Staff" value={12} tone="violet" />
                <Stat label="Operations" value={84} tone="blue" />
                <Stat label="Response Teams" value={36} tone="rose" />
                <Stat label="Intelligence" value={9} tone="emerald" />
                <Stat label="Technical" value={18} tone="amber" />
              </div>
            </Panel>

            <Panel title="Kenya Deployment Map" icon={MapPin}>
              <KenyaMap
                mode="deployment"
                height={210}
                pins={[
                  { id: "nrb", name: "Nairobi", x: 220, y: 196, units: 84 },
                  { id: "mom", name: "Mombasa", x: 304, y: 280, units: 32 },
                  { id: "ksm", name: "Kisumu", x: 96, y: 180, units: 22 },
                  { id: "nak", name: "Nakuru", x: 174, y: 170, units: 28 },
                  { id: "eld", name: "Eldoret", x: 132, y: 140, units: 16 },
                  { id: "grs", name: "Garissa", x: 282, y: 196, units: 12 },
                ]}
                onPinClick={(p) => toast.info(`${p.name} · ${p.units} units deployed`)}
              />
              <div className="mt-1 grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="flex justify-between rounded border border-white/5 bg-black/30 px-2 py-1">
                  <span className="text-slate-400">Vehicles</span><span className="font-mono text-blue-300">22</span>
                </div>
                <div className="flex justify-between rounded border border-white/5 bg-black/30 px-2 py-1">
                  <span className="text-slate-400">Response</span><span className="font-mono text-rose-300">12</span>
                </div>
              </div>
            </Panel>

            <Panel title="Active Incidents · SLA Timers" icon={AlertTriangle} action={
              <Badge className="border border-rose-500/30 bg-rose-500/10 text-[9px] text-rose-300">LIVE</Badge>
            }>
              <IncidentSlaPanel />
            </Panel>
          </div>

          {/* ===== Row 2: Threat · Units · Comms ===== */}
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            <Panel title="Threat Intelligence" icon={Brain}>
              <div className="mb-2 flex items-center justify-between rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">National Threat Level</span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-300">ELEVATED · 62%</span>
              </div>
              <KenyaMap
                mode="threat"
                height={180}
                pins={[
                  { id: "nrb", name: "Nairobi", x: 220, y: 196, level: "high" },
                  { id: "mom", name: "Mombasa", x: 304, y: 280, level: "medium" },
                  { id: "ksm", name: "Kisumu", x: 96, y: 180, level: "low" },
                  { id: "nak", name: "Nakuru", x: 174, y: 170, level: "medium" },
                  { id: "grs", name: "Garissa", x: 282, y: 196, level: "critical" },
                ]}
                onPinClick={(p) => toast.warning(`${p.name} threat: ${p.level?.toUpperCase()}`)}
              />
            </Panel>

            <Panel title="Units Status" icon={Activity}>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { l: "Patrol Units", v: 22, i: Car, t: "blue" },
                  { l: "Response", v: 12, i: Truck, t: "rose" },
                  { l: "Supervisors", v: 8, i: ShieldAlert, t: "violet" },
                  { l: "K9 Teams", v: 4, i: Dog, t: "amber" },
                  { l: "Motorcycles", v: 6, i: Bike, t: "emerald" },
                  { l: "Available", v: 9, i: CheckCircle2, t: "cyan" },
                ].map((u) => (
                  <div key={u.l} className="flex items-center justify-between rounded-md border border-white/5 bg-black/30 px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <u.i className={`h-4 w-4 text-${u.t}-300`} />
                      <span className="text-slate-300">{u.l}</span>
                    </div>
                    <span className={`font-mono text-base font-bold text-${u.t}-300`}>{u.v}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Communications Centre" icon={Radio} action={
              <Badge className={`border ${pttActive ? "border-rose-500/50 bg-rose-500/15 text-rose-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"} text-[9px]`}>
                {pttActive ? "TX LIVE" : activeChannel}
              </Badge>
            }>
              <button
                onMouseDown={() => togglePTT(true)}
                onMouseUp={() => togglePTT(false)}
                onMouseLeave={() => pttActive && togglePTT(false)}
                onTouchStart={() => togglePTT(true)}
                onTouchEnd={() => togglePTT(false)}
                className={`mb-2 flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition select-none ${
                  pttActive
                    ? "border-rose-500/60 bg-rose-500/20 text-rose-200 shadow-[0_0_24px_-4px_rgba(244,63,94,.7)]"
                    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                }`}
              >
                <Mic className="h-4 w-4" /> {pttActive ? "Transmitting…" : "Hold to Talk"}
              </button>
              <div className="mb-2 flex items-center justify-between rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <Headphones className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-slate-300">Online Operators</span>
                </div>
                <span className="font-mono text-base font-bold text-emerald-300">14</span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1.5 pr-2">
                  {radioChannels.map((c) => {
                    const selected = activeChannel === c.code;
                    return (
                      <div
                        key={c.code}
                        className={`group flex items-center justify-between rounded-md border px-2.5 py-1.5 transition ${
                          selected ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/5 bg-black/30 hover:border-cyan-400/30 hover:bg-cyan-500/5"
                        }`}
                      >
                        <button
                          onClick={() => { setActiveChannel(c.code); toast.info(`Channel ${c.name} selected`); }}
                          className="flex flex-1 items-center justify-between text-left"
                        >
                          <div>
                            <div className={`text-xs font-semibold text-${c.tone}-300`}>{c.name}</div>
                            <div className="font-mono text-[10px] text-slate-500">{c.code}</div>
                          </div>
                          <span className="text-[10px] text-slate-400">{c.active} live</span>
                        </button>
                        <button
                          onClick={() => removeChannel(c.code)}
                          className="ml-2 rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                          title="Remove channel"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="mt-2 flex items-center gap-1 rounded-md border border-white/5 bg-black/30 px-1.5 py-1">
                <input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Channel name"
                  className="flex-1 min-w-0 bg-transparent px-1 text-[11px] text-slate-200 placeholder:text-slate-500 outline-none"
                />
                <input
                  value={newChannelCode}
                  onChange={(e) => setNewChannelCode(e.target.value)}
                  placeholder="CODE"
                  className="w-16 bg-transparent px-1 font-mono text-[11px] uppercase text-cyan-300 placeholder:text-slate-500 outline-none"
                />
                <Button
                  size="sm"
                  onClick={addChannel}
                  className="h-6 bg-cyan-500/20 px-2 text-[10px] text-cyan-200 hover:bg-cyan-500/30"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </Panel>
          </div>

          {/* ===== Row 3: Roster table + Incident status + Alerts ===== */}
          <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-3">
            <Panel
              title="On Duty Personnel"
              icon={UserCheck}
              className="xl:col-span-2"
              action={
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={openAddRoster}
                    className="h-6 gap-1 bg-cyan-500/15 px-2 text-[10px] uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/25"
                  >
                    <UserPlus className="h-3 w-3" /> Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFullRoster(true)}
                    className="h-6 border-cyan-500/30 bg-cyan-500/5 text-[10px] uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/10"
                  >
                    Full Roster →
                  </Button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-2 py-2 font-semibold">#</th>
                      <th className="px-2 py-2 font-semibold">Role</th>
                      <th className="px-2 py-2 font-semibold">Name</th>
                      <th className="px-2 py-2 font-semibold">Call Sign</th>
                      <th className="px-2 py-2 font-semibold">Location</th>
                      <th className="px-2 py-2 font-semibold">Shift</th>
                      <th className="px-2 py-2 font-semibold">Status</th>
                      <th className="px-2 py-2 font-semibold">Contact</th>
                      <th className="px-2 py-2 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullRoster.map((r, i) => {
                      const a = accentMap[r.accent] ?? accentMap.cyan;
                      return (
                        <tr
                          key={r.call + i}
                          onClick={() => handleViewProfile(r)}
                          className="cursor-pointer border-b border-white/[0.03] transition hover:bg-white/[0.02]"
                        >
                          <td className="px-2 py-2 text-slate-500">{i + 1}</td>
                          <td className="px-2 py-2 text-slate-200">{r.role}</td>
                          <td className="px-2 py-2 font-medium text-slate-100">{r.name}</td>
                          <td className={`px-2 py-2 font-mono font-bold ${a.text}`}>{r.call}</td>
                          <td className="px-2 py-2 text-slate-400">{r.location}</td>
                          <td className="px-2 py-2 text-slate-400">{r.shift}</td>
                          <td className="px-2 py-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ON DUTY
                            </span>
                          </td>
                          <td className="px-2 py-2 font-mono text-slate-400">{r.phone}</td>
                          <td className="px-2 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleViewProfile(r); }}
                                className="h-6 border-cyan-500/30 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/10"
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); openEditRoster(r); }}
                                className="h-6 border-amber-500/30 px-2 text-[10px] text-amber-300 hover:bg-amber-500/10"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(r); }}
                                className="h-6 border-rose-500/30 px-2 text-[10px] text-rose-300 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="space-y-3">
              <Panel title="Incident Status" icon={AlertOctagon}>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Total Incidents" value={metrics.incidentsOpen ?? 26} tone="cyan" />
                  <Stat label="Resolved Today" value={19} tone="emerald" />
                  <Stat label="Avg Response" value="4.3m" tone="amber" />
                  <Stat label="Pending Actions" value={5} tone="rose" />
                </div>
              </Panel>
              <Panel title="Alerts Summary" icon={Bell}>
                <div className="space-y-1.5 text-xs">
                  {[
                    { l: "Total Alerts", v: 38, t: "cyan" },
                    { l: "Critical", v: 2, t: "rose" },
                    { l: "High", v: 7, t: "amber" },
                    { l: "Medium", v: 18, t: "blue" },
                    { l: "Low", v: 9, t: "emerald" },
                    { l: "False Positives", v: 2, t: "slate" },
                  ].map((a) => (
                    <div key={a.l} className="flex items-center justify-between rounded border border-white/5 bg-black/30 px-2.5 py-1.5">
                      <span className="text-slate-300">{a.l}</span>
                      <span className={`font-mono text-sm font-bold text-${a.t}-300`}>{a.v}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          {/* ===== Row 4: Activity feed · System health · Analytics ===== */}
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            <Panel title="Live Audit Trail" icon={Activity} action={
              <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-300">REALTIME</Badge>
            }>
              <LiveAuditTrail />
            </Panel>

            <Panel title="System Health" icon={Server}>
              <div className="space-y-3">
                <HealthBar label="Server Health" value={98} icon={Server} />
                <HealthBar label="Network Health" value={96} icon={Wifi} />
                <HealthBar label="Camera Health" value={92} icon={Camera} />
                <HealthBar label="Database Health" value={99} icon={Database} />
                <HealthBar label="Storage Health" value={84} icon={HardDrive} />
              </div>
            </Panel>

            <Panel title="Reports & Analytics" icon={BarChart3}>
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                  <span>Incident Trend · 7d</span>
                  <span className="flex items-center gap-1 text-emerald-300"><TrendingUp className="h-3 w-3" />-12%</span>
                </div>
                <div className="flex h-16 items-end gap-1">
                  {[40, 55, 38, 72, 48, 60, 35].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/30 to-cyan-400" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <Separator className="my-2 bg-white/5" />
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-400">Avg Response</span><span className="font-semibold text-cyan-300">4m 18s</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Top Category</span><span className="text-slate-200">Perimeter Breach</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Best Region</span><span className="text-emerald-300">East · 100% SLA</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Worst Region</span><span className="text-amber-300">South · 91% SLA</span></div>
              </div>
            </Panel>
          </div>

          <div className="h-20" />
        </main>
      </div>

      {/* ===== Quick Actions Bar (sticky bottom) ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#05080F]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-2 px-4 py-2.5">
          {QUICK_ACTIONS.map((a) => (
            <Button
              key={a.l}
              size="sm"
              onClick={a.onClick}
              className={`h-8 gap-1.5 border border-${a.t}-500/30 bg-${a.t}-500/10 text-[11px] font-semibold text-${a.t}-200 hover:bg-${a.t}-500/20`}
            >
              <a.i className="h-3.5 w-3.5" />
              {a.l}
            </Button>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <IncidentCreateDialog open={showIncident} onOpenChange={setShowIncident} onSuccess={() => setNow(new Date())} />
      <BroadcastDialog open={showBroadcast} onOpenChange={setShowBroadcast} />
      <RadioCallDialog open={showRadio} onOpenChange={setShowRadio} />
      <RequestBackupDialog open={showBackup} onOpenChange={setShowBackup} />
      <OfficerProfileDialog open={!!profileOfficer} onOpenChange={(v) => !v && setProfileOfficer(null)} officer={profileOfficer} />
      <FullRosterDialog
        open={showFullRoster}
        onOpenChange={setShowFullRoster}
        roster={fullRoster}
        onViewProfile={(o) => { setShowFullRoster(false); setProfileOfficer(o); }}
        onAdd={openAddRoster}
        onEdit={(r) => openEditRoster(r as RosterRow)}
        onDelete={(r) => handleDeleteRoster(r as RosterRow)}
      />
      <RosterEntryDialog
        open={rosterDialogOpen}
        onOpenChange={setRosterDialogOpen}
        entry={editingEntry}
        onSave={handleSaveRoster}
      />
      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-[#0B1220] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-300">Remove from roster?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will remove <span className="font-semibold text-slate-100">{confirmDelete?.name}</span>{" "}
              ({confirmDelete?.call}) from the current duty roster. The action is logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDelete) handleDeleteRoster(confirmDelete); setConfirmDelete(null); }}
              className="bg-rose-500/80 text-white hover:bg-rose-500"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <KpiDrillDownDrawer open={!!drillKpi} onOpenChange={(v) => !v && setDrillKpi(null)} config={drillKpi} />
    </div>
  );
}
