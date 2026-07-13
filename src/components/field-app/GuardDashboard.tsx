import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock, MapPin, Shield, AlertTriangle, CheckCircle2, Radio,
  QrCode, BookOpen, Siren, TrendingUp, Activity, ShieldCheck,
  Zap, Navigation, Timer, FileWarning,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GuardDashboardProps {
  userName: string;
  userRole: string;
  staffId?: string;
  assignedSites: any[];
  assignedPatrols: any[];
  assignedDispatches: any[];
  onModuleSelect: (m: string) => void;
}

type Attendance = { id: string; check_in: string; check_out: string | null; site?: string | null };

export const GuardDashboard = ({
  userName,
  userRole,
  staffId,
  assignedSites,
  assignedPatrols,
  assignedDispatches,
  onModuleSelect,
}: GuardDashboardProps) => {
  const [shift, setShift] = useState<Attendance | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [checkpointsToday, setCheckpointsToday] = useState<number>(0);
  const [checkpointsExpected, setCheckpointsExpected] = useState<number>(0);
  const [lastGrade, setLastGrade] = useState<string | null>(null);
  const [integrityScore, setIntegrityScore] = useState<number | null>(null);
  const [recentOB, setRecentOB] = useState<any[]>([]);
  const [siteIncidents, setSiteIncidents] = useState<number>(0);
  const [sosLoading, setSosLoading] = useState(false);

  const greeting = useMemo(() => {
    const h = now.getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  }, [now]);

  const onDuty = !!shift && !shift.check_out;
  const shiftElapsed = useMemo(() => {
    if (!shift?.check_in) return "00:00:00";
    const ms = now.getTime() - new Date(shift.check_in).getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [now, shift]);

  // 1-second tick for shift timer
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial load
  useEffect(() => {
    if (!staffId) return;
    const load = async () => {
      const sb: any = supabase;
      const since = new Date();
      since.setHours(0, 0, 0, 0);

      const [att, scans, score, ob, inc] = await Promise.all([
        sb.from("attendance").select("id,check_in,check_out,site")
          .eq("staff_id", staffId).is("check_out", null)
          .order("check_in", { ascending: false }).limit(1).maybeSingle(),
        sb.from("patrol_checkpoints").select("id,scanned_at,verification_status")
          .eq("scanned_by", staffId).gte("scanned_at", since.toISOString()),
        sb.from("patrol_scores").select("grade,integrity_score,scored_at")
          .eq("guard_id", staffId).order("scored_at", { ascending: false }).limit(1).maybeSingle(),
        sb.from("dob_entries").select("id,entry_number,entry_type,description,entry_time,site_name")
          .eq("recorded_by", staffId).order("entry_time", { ascending: false }).limit(5),
        sb.from("incidents").select("id", { count: "exact", head: true })
          .gte("created_at", since.toISOString()),
      ]);

      if (att.data) setShift(att.data);
      if (scans.data) setCheckpointsToday(scans.data.length);
      // Expected checkpoints from active patrols today (rough heuristic)
      setCheckpointsExpected(Math.max(scans.data?.length || 0, (assignedPatrols?.length || 1) * 6));
      if (score.data) {
        setLastGrade(score.data.grade);
        setIntegrityScore(Number(score.data.integrity_score));
      }
      if (ob.data) setRecentOB(ob.data);
      if (typeof inc.count === "number") setSiteIncidents(inc.count);
    };
    load();
  }, [staffId, assignedPatrols?.length]);

  // Realtime: own attendance + new OB entries
  useEffect(() => {
    if (!staffId) return;
    const ch = supabase
      .channel(`guard-dash-${staffId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "attendance", filter: `staff_id=eq.${staffId}` },
        (p: any) => {
          if (p.new && (!p.new.check_out)) setShift(p.new);
          else if (p.new?.check_out) setShift(null);
        })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "dob_entries" },
        (p: any) => {
          if (p.new?.recorded_by === staffId) {
            setRecentOB(prev => [p.new, ...prev].slice(0, 5));
          }
        })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "patrol_checkpoints", filter: `scanned_by=eq.${staffId}` },
        () => setCheckpointsToday(c => c + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [staffId]);

  const compliancePct = checkpointsExpected
    ? Math.min(100, Math.round((checkpointsToday / checkpointsExpected) * 100))
    : 0;

  const gradeColor = (g: string | null) => {
    switch (g) {
      case "A": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "B": return "text-green-400 border-green-500/30 bg-green-500/10";
      case "C": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "D": return "text-orange-400 border-orange-500/30 bg-orange-500/10";
      case "E":
      case "F": return "text-red-400 border-red-500/30 bg-red-500/10";
      default: return "text-muted-foreground border-muted/30";
    }
  };

  const triggerSOS = async () => {
    if (!staffId || sosLoading) return;
    setSosLoading(true);
    try {
      let lat: number | null = null, lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {}
      const sb: any = supabase;
      const { error } = await sb.from("sos_alerts").insert({
        officer_id: staffId,
        gps_lat: lat,
        gps_lng: lng,
        triggered_at: new Date().toISOString(),
        status: "active",
      });
      if (error) throw error;
      toast.error("SOS DISPATCHED — Control Room notified", { duration: 6000 });
    } catch (e: any) {
      toast.error(`SOS failed: ${e.message || "unknown"}`);
    } finally {
      setSosLoading(false);
    }
  };

  const quickActions = [
    { id: "sos", label: "SOS", icon: Siren, hot: true, onClick: triggerSOS,
      cls: "from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 ring-red-500/40" },
    { id: "incidents", label: "Report", icon: FileWarning,
      cls: "from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 ring-amber-500/30",
      onClick: () => onModuleSelect("incidents") },
    { id: "clock", label: onDuty ? "Clock Out" : "Clock In", icon: Timer,
      cls: "from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 ring-blue-500/30",
      onClick: () => onModuleSelect("clock") },
    { id: "field_ob", label: "OB Entry", icon: BookOpen,
      cls: "from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 ring-violet-500/30",
      onClick: () => onModuleSelect("field_ob") },
  ];

  return (
    <div className="space-y-6">
      {/* TACTICAL HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-slate-900/60 to-slate-950/80 p-6">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-blue-300/70">
              {greeting} · {format(now, "EEE dd MMM · HH:mm:ss")} · Africa/Nairobi
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1 text-white">{userName}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                <Shield className="h-3 w-3 mr-1" /> {userRole}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  onDuty
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-600"
                )}
              >
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full mr-2",
                  onDuty ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                )} />
                {onDuty ? "ON DUTY" : "OFF DUTY"}
              </Badge>
              {assignedSites?.[0] && (
                <Badge variant="outline" className="bg-slate-900/60 text-slate-300 border-slate-700">
                  <MapPin className="h-3 w-3 mr-1" />
                  {assignedSites[0].site_name || assignedSites[0].name || "Assigned Site"}
                </Badge>
              )}
            </div>
          </div>

          {/* Live shift timer */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-mono uppercase tracking-widest text-blue-300/70">Shift Elapsed</p>
              <p className="font-mono text-3xl md:text-4xl font-bold text-white tabular-nums">
                {shiftElapsed}
              </p>
              {shift?.check_in && (
                <p className="text-[10px] text-blue-300/60 mt-0.5">
                  Started {format(new Date(shift.check_in), "HH:mm")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS — tactical buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(a => (
          <button
            key={a.id}
            onClick={a.onClick}
            disabled={a.id === "sos" && sosLoading}
            className={cn(
              "group relative overflow-hidden rounded-xl p-4 text-left transition-all",
              "bg-gradient-to-br shadow-lg ring-1 active:scale-[0.98]",
              a.cls,
              a.hot && "shadow-red-900/40"
            )}
          >
            {a.hot && (
              <span className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
            )}
            <div className="relative flex items-center justify-between">
              <a.icon className="h-6 w-6 text-white" />
              <Zap className="h-3 w-3 text-white/40 group-hover:text-white/80 transition" />
            </div>
            <p className="relative mt-3 text-sm font-bold uppercase tracking-wide text-white">
              {a.label}
            </p>
            <p className="relative text-[10px] text-white/70 mt-0.5">
              {a.id === "sos" ? "Hold for emergency" :
               a.id === "incidents" ? "File incident report" :
               a.id === "clock" ? "Verify & log shift" : "Log occurrence"}
            </p>
          </button>
        ))}
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Compliance ring */}
        <Card className="bg-card/60 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Patrol Compliance</span>
              <ShieldCheck className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{compliancePct}%</p>
            <Progress value={compliancePct} className="h-1.5 mt-2" />
            <p className="text-[10px] text-muted-foreground mt-1">
              {checkpointsToday}/{checkpointsExpected} checkpoints today
            </p>
          </CardContent>
        </Card>

        {/* Last grade */}
        <Card className="bg-card/60 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Last Patrol Grade</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "inline-flex items-center justify-center h-12 w-12 rounded-lg border text-2xl font-bold",
                gradeColor(lastGrade)
              )}>
                {lastGrade ?? "—"}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {integrityScore !== null ? `${integrityScore.toFixed(0)} pts` : "No data"}
                </p>
                <p className="text-[10px] text-muted-foreground">Integrity score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active tasks */}
        <Card className="bg-card/60 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Active Tasks</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold">{assignedDispatches?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Pending dispatches
            </p>
          </CardContent>
        </Card>

        {/* Site incidents today */}
        <Card className="bg-card/60 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Incidents Today</span>
              <Activity className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-3xl font-bold">{siteIncidents}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Across all sites</p>
          </CardContent>
        </Card>
      </div>

      {/* TWO-COLUMN: assignments + OB feed */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Today's assignments */}
        <Card className="lg:col-span-2 bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-400" />
                Today's Patrols
              </h2>
              <Badge variant="outline" className="text-xs">
                {assignedPatrols?.length || 0} scheduled
              </Badge>
            </div>

            {assignedPatrols && assignedPatrols.length > 0 ? (
              <div className="space-y-2">
                {assignedPatrols.slice(0, 5).map((p: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/50 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                        <QrCode className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.patrol_id || `Patrol ${i + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.site_name || p.client_name || "Site TBD"}
                          {p.shift_start && ` · ${format(new Date(p.shift_start), "HH:mm")}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase",
                        p.status === "active" || p.status === "in_progress"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                          : p.status === "pending"
                          ? "text-amber-400 border-amber-500/30 bg-amber-500/5"
                          : "text-muted-foreground"
                      )}
                    >
                      {p.status || "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/60 mx-auto mb-2" />
                <p className="text-sm font-medium">No patrols scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">Stand by for assignments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent OB feed */}
        <Card className="bg-card/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-400" />
                Your Recent OB
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => onModuleSelect("field_ob")}
              >
                Open
              </Button>
            </div>

            {recentOB.length > 0 ? (
              <div className="space-y-3">
                {recentOB.map((e: any) => (
                  <div key={e.id} className="border-l-2 border-violet-500/40 pl-3 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-violet-300/80">
                        {e.entry_number || "OB"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {e.entry_time
                          ? formatDistanceToNowStrict(new Date(e.entry_time), { addSuffix: true })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs font-medium mt-0.5 capitalize">
                      {e.entry_type || "Entry"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {e.description || "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No entries yet today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DISPATCHES (if any) */}
      {assignedDispatches && assignedDispatches.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-950/30 to-card/50 border-orange-500/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="h-4 w-4 text-orange-400 animate-pulse" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Active Dispatches
              </h2>
              <Badge variant="outline" className="ml-auto text-orange-300 border-orange-500/40 bg-orange-500/10">
                {assignedDispatches.length} pending
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {assignedDispatches.map((d: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-background/40 border border-orange-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {d.request_number || `Dispatch ${i + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.location || "Location pending"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        d.priority === "high" ? "text-red-400 border-red-500/40 bg-red-500/10" :
                        d.priority === "medium" ? "text-amber-400 border-amber-500/40 bg-amber-500/10" :
                        "text-blue-400 border-blue-500/30 bg-blue-500/10"
                      )}
                    >
                      {d.priority || "Normal"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {d.description || d.dispatch_type || "—"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOOTER STRIP */}
      <div className="flex items-center justify-between px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Sync · Realtime Connected
        </span>
        <span>BLACKHAWK-SOC · {format(now, "yyyy.MM.dd HH:mm")}</span>
      </div>
    </div>
  );
};

export default GuardDashboard;
