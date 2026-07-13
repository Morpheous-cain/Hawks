import { useState, useEffect, Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

/**
 * Wave-1 stability guard: any heavy child rendered inside a tab can now crash
 * or suspend without blanking the whole Supervisor dashboard. Each
 * `<TabPanel>` isolates its child via ErrorBoundary + Suspense so one broken
 * widget (PatrolHeatmap, PayrollRunner, ShiftReportGenerator, …) shows an
 * inline error card rather than nuking the route.
 */
const TabFallback = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
    <p className="text-sm font-semibold text-destructive">Couldn't load {label}</p>
    <p className="mt-1 text-xs text-muted-foreground">
      This section failed to render. Try switching tabs or reloading; other tabs are unaffected.
    </p>
  </div>
);
const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);
const TabPanel = ({ label, children }: { label: string; children: ReactNode }) => (
  <ErrorBoundary fallback={<TabFallback label={label} />}>
    <Suspense fallback={<TabLoader />}>{children}</Suspense>
  </ErrorBoundary>
);

import {
  Shield, MapPin, Clock, User, QrCode, CreditCard, CheckCircle,
  AlertTriangle, Users, Activity, Briefcase, Target, FileText,
  Calendar, Map as MapIcon, ChevronDown,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";
import { useNavigate } from "react-router-dom";
import PatrolCheckpointFeed from "@/components/PatrolCheckpointFeed";
import PatrolEntryForm from "@/components/PatrolEntryForm";
import PatrolControlRoomView from "@/components/PatrolControlRoomView";
import OfficerClockScreen from "@/components/patrol/OfficerClockScreen";
import OfficerTimesheet from "@/components/patrol/OfficerTimesheet";
import SupervisorPatrolMap from "@/components/patrol/SupervisorPatrolMap";
import ExceptionQueue from "@/components/patrol/ExceptionQueue";
import PayrollRunner from "@/components/patrol/PayrollRunner";
import ClockModeSettings from "@/components/patrol/ClockModeSettings";
import { SupervisorPlatform } from "@/components/patrol/SupervisorPlatform";
import PatrolComplianceDashboard from "@/components/patrol/PatrolComplianceDashboard";
import ShiftReportGenerator from "@/components/patrol/ShiftReportGenerator";
import PatrolHeatmap from "@/components/patrol/PatrolHeatmap";
import BulkShiftScheduler from "@/components/patrol/BulkShiftScheduler";
import OfflineStatusBar from "@/components/patrol/OfflineStatusBar";

interface Patrol {
  id: string;
  guard_id: string;
  site_name: string;
  start_time: string;
  end_time: string | null;
  status: string;
  notes: string | null;
}

interface ModuleStats {
  activePatrols: number;
  checkpointsVerified: number;
  officersClockedIn: number;
  pendingExceptions: number;
  missedCheckpoints: number;
  avgResponseTime: string;
}

type TabKey =
  | "supervisor" | "checkpoints" | "clock" | "compliance" | "timesheet"
  | "map" | "heatmap" | "scheduling" | "reports" | "exceptions" | "payroll" | "settings";

const TAB_DEFS: { v: TabKey; label: string; Icon: typeof Shield }[] = [
  { v: "supervisor",  label: "Supervisor",  Icon: Briefcase },
  { v: "checkpoints", label: "Checkpoints", Icon: MapPin },
  { v: "clock",       label: "Clock",       Icon: QrCode },
  { v: "compliance",  label: "Compliance",  Icon: Target },
  { v: "timesheet",   label: "Timesheet",   Icon: Clock },
  { v: "map",         label: "Map",         Icon: Activity },
  { v: "heatmap",     label: "Heatmap",     Icon: MapIcon },
  { v: "scheduling",  label: "Schedule",    Icon: Calendar },
  { v: "reports",     label: "Reports",     Icon: FileText },
  { v: "exceptions",  label: "Exceptions",  Icon: AlertTriangle },
  { v: "payroll",     label: "Payroll",     Icon: CreditCard },
  { v: "settings",    label: "Settings",    Icon: Shield },
];

const SupervisionPatrol = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("supervisor");
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePatrolId, setActivePatrolId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showRFIDInput, setShowRFIDInput] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [rfidCardNumber, setRfidCardNumber] = useState("");
  const [stats, setStats] = useState<ModuleStats>({
    activePatrols: 0,
    checkpointsVerified: 0,
    officersClockedIn: 0,
    pendingExceptions: 0,
    missedCheckpoints: 0,
    avgResponseTime: "0:00",
  });

  useEffect(() => {
    fetchPatrols();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: activePatrols } = await supabase
        .from("patrols").select("*", { count: "exact", head: true }).eq("status", "active");

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: checkpointsVerified } = await supabase
        .from("patrol_checkpoints").select("*", { count: "exact", head: true }).gte("scanned_at", today.toISOString());

      const { count: officersClockedIn } = await supabase
        .from("attendance").select("*", { count: "exact", head: true })
        .gte("check_in", today.toISOString()).is("check_out", null);

      const { count: pendingExceptions } = await supabase
        .from("attendance").select("*", { count: "exact", head: true })
        .in("status", ["pending", "rejected", "manual_request"]);

      setStats({
        activePatrols: activePatrols || 0,
        checkpointsVerified: checkpointsVerified || 0,
        officersClockedIn: officersClockedIn || 0,
        pendingExceptions: pendingExceptions || 0,
        missedCheckpoints: 2,
        avgResponseTime: "4:32",
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPatrols = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patrols").select("*").order("start_time", { ascending: false }).limit(20);
      if (error) { console.error(error); toast.error("Failed to load patrols"); }
      else setPatrols(data || []);
    } catch (err) {
      console.error("Patrol fetch error:", err);
    } finally { setLoading(false); }
  };

  const handleScanSuccess = (checkpointId: string) => {
    setShowScanner(false);
    setShowRFIDInput(false);
    setSelectedCheckpointId(checkpointId);
    setShowEntryForm(true);
  };

  const handleEntryFormSuccess = async () => {
    setShowEntryForm(false);
    setSelectedCheckpointId(null);
    toast.success("Patrol entry submitted successfully!");
    await fetchPatrols();
    await fetchStats();
  };

  const handleRFIDScan = async () => {
    if (!rfidCardNumber.trim()) return toast.error("Please enter RFID card number");
    try {
      const { data: staff, error } = await supabase
        .from("staff").select("id, full_name")
        .eq("rfid_card_number", rfidCardNumber.trim()).maybeSingle();
      if (error || !staff) return toast.error("Invalid RFID card number");
      toast.success(`RFID verified for ${staff.full_name}`);
      setShowRFIDInput(false);
      setRfidCardNumber("");
      setShowEntryForm(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify RFID card");
    }
  };

  const statCards = [
    { label: "Active Patrols", value: stats.activePatrols,        Icon: Activity,       tone: "text-primary",       bg: "from-primary/10 to-primary/5 border-primary/20",          iconTone: "text-primary/40" },
    { label: "Checkpoints",    value: stats.checkpointsVerified,  Icon: CheckCircle,    tone: "text-green-600",     bg: "from-green-500/10 to-green-500/5 border-green-500/20",    iconTone: "text-green-500/40" },
    { label: "On Duty",        value: stats.officersClockedIn,    Icon: Users,          tone: "text-blue-600",      bg: "from-blue-500/10 to-blue-500/5 border-blue-500/20",       iconTone: "text-blue-500/40" },
    { label: "Exceptions",     value: stats.pendingExceptions,    Icon: AlertTriangle,  tone: "text-amber-600",     bg: "from-amber-500/10 to-amber-500/5 border-amber-500/20",    iconTone: "text-amber-500/40" },
    { label: "Missed",         value: stats.missedCheckpoints,    Icon: MapPin,         tone: "text-red-600",       bg: "from-red-500/10 to-red-500/5 border-red-500/20",          iconTone: "text-red-500/40" },
    { label: "Avg Response",   value: stats.avgResponseTime,      Icon: Clock,          tone: "text-purple-600",    bg: "from-purple-500/10 to-purple-500/5 border-purple-500/20", iconTone: "text-purple-500/40" },
  ];

  const activeTabDef = TAB_DEFS.find((t) => t.v === tab)!;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Supervision Patrol"
        description="Checkpoint verification, Officer-QR Clock Mode & payroll"
        icon={Shield}
      />

      <main className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-6 max-w-7xl mx-auto">
        {/* Stats — 2-col mobile, scales up */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-3 sm:mb-5">
          {statCards.map(({ label, value, Icon, tone, bg, iconTone }) => (
            <Card key={label} className={`bg-gradient-to-br ${bg}`}>
              <CardContent className="p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">{label}</p>
                    <p className={`text-base sm:text-2xl font-bold leading-tight ${tone}`}>{value}</p>
                  </div>
                  <Icon className={`h-5 w-5 sm:h-7 sm:w-7 shrink-0 ${iconTone}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Offline status */}
        <div className="mb-3 sm:mb-4">
          <OfflineStatusBar />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-4">
          {/* Mobile: dropdown nav. Desktop: pill tabs */}
          <div className="xl:hidden">
            <Select value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <SelectTrigger className="w-full h-11 bg-muted/50">
                <div className="flex items-center gap-2">
                  <activeTabDef.Icon className="h-4 w-4 text-primary" />
                  <SelectValue />
                  {tab === "exceptions" && stats.pendingExceptions > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">
                      {stats.pendingExceptions}
                    </Badge>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {TAB_DEFS.map(({ v, label, Icon }) => (
                  <SelectItem key={v} value={v}>
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      {v === "exceptions" && stats.pendingExceptions > 0 && (
                        <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">
                          {stats.pendingExceptions}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden xl:block overflow-x-auto scrollbar-thin">
            <TabsList className="inline-flex w-max min-w-full bg-muted/50 p-1 h-auto gap-1">
              {TAB_DEFS.map(({ v, label, Icon }) => (
                <TabsTrigger key={v} value={v} className="gap-1.5 text-xs whitespace-nowrap relative px-3 py-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {v === "exceptions" && stats.pendingExceptions > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {stats.pendingExceptions}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="supervisor"><TabPanel label="Supervisor"><SupervisorPlatform /></TabPanel></TabsContent>

          <TabsContent value="checkpoints">
            <div className="flex flex-col gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Checkpoint Verification</h2>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                <Button
                  variant="outline" size="sm" className="text-xs"
                  onClick={() => {
                    const p = window.location.pathname.match(/^\/platform\/([^/]+)/)?.[1];
                    navigate(p ? `/platform/${p}/m/patrol-checkpoints` : "/patrol-checkpoints");
                  }}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1" /> Manage
                </Button>
                <Button
                  variant="outline" size="sm" className="text-xs"
                  onClick={() => { setShowScanner(true); setShowRFIDInput(false); }}
                >
                  <QrCode className="w-3.5 h-3.5 mr-1" /> Scan QR
                </Button>
                <Button
                  variant="default" size="sm" className="text-xs"
                  onClick={() => { setShowRFIDInput(true); setShowScanner(false); }}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1" /> RFID
                </Button>
              </div>
            </div>

            {showScanner && (
              <div className="mb-4">
                <QRScanner
                  patrolId={activePatrolId || ""}
                  onScanSuccess={handleScanSuccess}
                  onClose={() => setShowScanner(false)}
                />
              </div>
            )}

            {showRFIDInput && (
              <Card className="mb-4 border-primary/30">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <CreditCard className="w-4 h-4" /> RFID Card Scanner
                    </CardTitle>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => { setShowRFIDInput(false); setRfidCardNumber(""); }}
                    >Cancel</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <div>
                    <Label htmlFor="rfid" className="text-xs">Scan or enter RFID card</Label>
                    <Input
                      id="rfid"
                      value={rfidCardNumber}
                      onChange={(e) => setRfidCardNumber(e.target.value)}
                      placeholder="Tap card or enter manually"
                      onKeyPress={(e) => { if (e.key === "Enter") handleRFIDScan(); }}
                      autoFocus
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleRFIDScan} className="w-full">Verify RFID Card</Button>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">Loading patrols...</p>
              </div>
            ) : patrols.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center px-4">
                  <Shield className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-base font-semibold mb-1">No Active Patrols</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    There are no active patrols right now. Record an entry or manage checkpoints.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {patrols.slice(0, 6).map((patrol) => (
                  <Card key={patrol.id} className="hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2 px-3 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm sm:text-base truncate">{patrol.site_name}</CardTitle>
                        <Badge variant={patrol.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {patrol.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-3 pb-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">Guard: {patrol.guard_id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{new Date(patrol.start_time).toLocaleString()}</span>
                      </div>
                      {patrol.status === "active" && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button
                            size="sm" variant="default" className="h-8 text-xs"
                            onClick={() => { setActivePatrolId(patrol.id); setShowScanner(true); setShowRFIDInput(false); }}
                          ><QrCode className="w-3 h-3 mr-1" /> QR</Button>
                          <Button
                            size="sm" variant="outline" className="h-8 text-xs"
                            onClick={() => { setActivePatrolId(patrol.id); setShowRFIDInput(true); setShowScanner(false); }}
                          ><CreditCard className="w-3 h-3 mr-1" /> RFID</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <PatrolControlRoomView />
              <PatrolCheckpointFeed />
            </div>
          </TabsContent>

          <TabsContent value="clock"><TabPanel label="Clock"><OfficerClockScreen /></TabPanel></TabsContent>
          <TabsContent value="timesheet"><TabPanel label="Timesheet"><OfficerTimesheet /></TabPanel></TabsContent>
          <TabsContent value="map"><TabPanel label="Map"><SupervisorPatrolMap /></TabPanel></TabsContent>
          <TabsContent value="compliance"><TabPanel label="Compliance"><PatrolComplianceDashboard /></TabPanel></TabsContent>
          <TabsContent value="heatmap"><TabPanel label="Heatmap"><PatrolHeatmap /></TabPanel></TabsContent>
          <TabsContent value="scheduling"><TabPanel label="Scheduling"><BulkShiftScheduler /></TabPanel></TabsContent>
          <TabsContent value="reports"><TabPanel label="Reports"><ShiftReportGenerator /></TabPanel></TabsContent>
          <TabsContent value="exceptions"><TabPanel label="Exceptions"><ExceptionQueue /></TabPanel></TabsContent>
          <TabsContent value="payroll"><TabPanel label="Payroll"><PayrollRunner /></TabPanel></TabsContent>
          <TabsContent value="settings"><TabPanel label="Settings"><ClockModeSettings /></TabPanel></TabsContent>
        </Tabs>
      </main>

      <Dialog open={showEntryForm} onOpenChange={setShowEntryForm}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">New Patrol Entry</DialogTitle>
          </DialogHeader>
          <PatrolEntryForm
            patrolId={activePatrolId || patrols[0]?.id || ""}
            checkpointId={selectedCheckpointId || undefined}
            onSuccess={handleEntryFormSuccess}
            onCancel={() => setShowEntryForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupervisionPatrol;
