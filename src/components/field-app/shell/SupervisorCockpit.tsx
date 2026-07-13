import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity, AlertTriangle, Bell, CheckCircle2, ChevronRight, Cloud, Heart,
  Map, Phone, Radio, ShieldAlert, Sparkles, Users, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFieldKpis } from "@/hooks/useFieldKpis";
import StickyTacticalBar from "./StickyTacticalBar";
import LiveSectorMap from "./LiveSectorMap";
import { formatDistanceToNow } from "date-fns";

interface Props {
  rankDisplayName: string;
  userName: string;
  staffId?: string;
  assignedSites?: any[];
  onModuleSelect: (id: string) => void;
}

type QueueItem = {
  id: string;
  kind: "sos" | "incident" | "dispatch" | "welfare" | "alarm";
  title: string;
  subtitle: string;
  time: string;
  severity: "critical" | "high" | "medium" | "low";
  module: string;
};

const severityTone: Record<string, string> = {
  critical: "border-red-500/60 bg-red-500/10 text-red-300",
  high:     "border-orange-500/60 bg-orange-500/10 text-orange-300",
  medium:   "border-amber-500/60 bg-amber-500/10 text-amber-300",
  low:      "border-sky-500/60 bg-sky-500/10 text-sky-300",
};

export const SupervisorCockpit = ({
  rankDisplayName, userName, staffId, assignedSites = [], onModuleSelect,
}: Props) => {
  const { kpis } = useFieldKpis("supervisor", staffId);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [trend, setTrend] = useState<{ incidents: number[]; alarms: number[] }>({ incidents: [], alarms: [] });
  const [aiBrief, setAiBrief] = useState<string>("Sector quiet. 2 advisories in the last 12h. Welfare cadence on target.");

  const sectorName = assignedSites?.[0]?.client_name || assignedSites?.[0]?.site_name || "Sector Alpha";

  /* ---------- Action queue (live) ---------- */
  useEffect(() => {
    const load = async () => {
      const items: QueueItem[] = [];

      const [{ data: sos }, { data: inc }, { data: disp }, { data: alarms }] = await Promise.all([
        (supabase as any).from("sos_alerts").select("id,alert_number,location,triggered_at,status").eq("status", "active").order("triggered_at", { ascending: false }).limit(5),
        (supabase as any).from("incidents").select("id,incident_type,severity,location,status,created_at").in("status", ["reported", "in_progress", "open"]).order("created_at", { ascending: false }).limit(8),
        (supabase as any).from("dispatch_requests").select("id,request_number,priority,status,created_at,location").in("status", ["pending", "dispatched"]).order("created_at", { ascending: false }).limit(8),
        (supabase as any).from("alarms").select("id,alarm_number,severity,location,created_at,status").eq("status", "triggered").order("created_at", { ascending: false }).limit(5),
      ]);

      (sos ?? []).forEach((s: any) => items.push({
        id: `sos-${s.id}`, kind: "sos", severity: "critical",
        title: `SOS · ${s.alert_number ?? "Unknown"}`,
        subtitle: s.location ?? "Location unknown", time: s.triggered_at, module: "incidents",
      }));
      (inc ?? []).forEach((i: any) => items.push({
        id: `inc-${i.id}`, kind: "incident",
        severity: (i.severity as any) ?? "medium",
        title: `${(i.incident_type ?? "Incident").replace(/_/g, " ")}`,
        subtitle: i.location ?? "—", time: i.created_at, module: "incident_triage",
      }));
      (disp ?? []).forEach((d: any) => items.push({
        id: `disp-${d.id}`, kind: "dispatch",
        severity: d.priority === "high" ? "high" : "medium",
        title: `Dispatch · ${d.request_number ?? d.id.slice(0,6)}`,
        subtitle: d.location ?? "—", time: d.created_at, module: "dispatch",
      }));
      (alarms ?? []).forEach((a: any) => items.push({
        id: `alm-${a.id}`, kind: "alarm",
        severity: (a.severity as any) ?? "high",
        title: `Alarm · ${a.alarm_number ?? a.id.slice(0,6)}`,
        subtitle: a.location ?? "—", time: a.created_at, module: "alarms",
      }));

      const order = { critical: 0, high: 1, medium: 2, low: 3 } as any;
      items.sort((a, b) => (order[a.severity] - order[b.severity]) || (new Date(b.time).getTime() - new Date(a.time).getTime()));
      setQueue(items.slice(0, 12));
    };
    load();
    const ch = supabase.channel("cockpit-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alarms" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  /* ---------- Team pulse ---------- */
  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("staff")
        .select("id,full_name,position,current_site,status")
        .eq("status", "active")
        .order("full_name").limit(24);
      setTeam(data ?? []);
    };
    load();
    const ch = supabase.channel("cockpit-team")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  /* ---------- 8h sparklines ---------- */
  useEffect(() => {
    const load = async () => {
      const buckets = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(); d.setHours(d.getHours() - (7 - i), 0, 0, 0); return d;
      });
      const incCounts: number[] = [];
      const alarmCounts: number[] = [];
      for (let i = 0; i < buckets.length; i++) {
        const start = buckets[i];
        const end = i === buckets.length - 1 ? new Date() : buckets[i + 1];
        const [{ count: inc }, { count: alm }] = await Promise.all([
          (supabase as any).from("incidents").select("id", { count: "exact", head: true })
            .gte("created_at", start.toISOString()).lt("created_at", end.toISOString()),
          (supabase as any).from("alarms").select("id", { count: "exact", head: true })
            .gte("created_at", start.toISOString()).lt("created_at", end.toISOString()),
        ]);
        incCounts.push(inc ?? 0); alarmCounts.push(alm ?? 0);
      }
      setTrend({ incidents: incCounts, alarms: alarmCounts });
    };
    load();
  }, []);

  const teamStats = useMemo(() => ({
    total: team.length,
    onPost: team.filter((t) => t.current_site).length,
    unassigned: team.filter((t) => !t.current_site).length,
  }), [team]);

  const sectorClock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });

  return (
    <div className="space-y-4 pb-2 w-full max-w-full overflow-x-hidden">
      {/* ─── Mission Strip ─── */}
      <Card className="border-primary/30 bg-gradient-to-br from-slate-900 via-slate-900 to-primary/10 shadow-glow">
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="rounded-md bg-primary/20 p-2 shrink-0"><ShieldAlert className="h-5 w-5 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Sector Cockpit · {sectorClock} EAT</p>
                <h2 className="text-base sm:text-lg font-bold leading-tight break-all">{rankDisplayName} · {userName}</h2>
                <p className="text-xs text-muted-foreground break-words">{sectorName} · 06:00 – 18:00 shift</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300 text-[10px]">Threat: Med</Badge>
              <Badge variant="outline" className="border-sky-500/40 text-sky-300 text-[10px]"><Cloud className="mr-1 h-3 w-3" /> 24°C</Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px]">{teamStats.onPost}/{teamStats.total} on post</Badge>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-foreground/90 min-w-0 break-words"><span className="font-semibold text-primary">AI Brief:</span> {aiBrief}</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Trend KPIs ─── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <TrendKpi label="On Duty"          value={kpis.onDuty ?? teamStats.total} icon={Users}          tone="info"    spark={trend.incidents.map(() => teamStats.total)} />
        <TrendKpi label="Open Dispatch"    value={kpis.openDispatch ?? 0}        icon={Radio}          tone="warning" spark={trend.alarms} />
        <TrendKpi label="Incidents · 8h"   value={trend.incidents.reduce((a,b)=>a+b,0)} icon={AlertTriangle} tone="danger"  spark={trend.incidents} />
        <TrendKpi label="Alarms · 8h"      value={trend.alarms.reduce((a,b)=>a+b,0)}    icon={Bell}        tone="warning" spark={trend.alarms} />
      </div>

      {/* ─── Map + Action Queue ─── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Live Sector Map */}
        <Card className="lg:col-span-3 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm"><Map className="h-4 w-4 text-primary" /> Live Sector Map</CardTitle>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onModuleSelect("live_team_map")}>
                Open full map <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LiveSectorMap team={team} />
          </CardContent>
        </Card>

        {/* Action Queue */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm"><Zap className="h-4 w-4 text-amber-400" /> Action Queue</CardTitle>
              <Badge variant="outline" className="text-[10px]">{queue.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[340px] pr-2">
              {queue.length === 0 && (
                <div className="flex h-32 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  Sector clear — no open items.
                </div>
              )}
              <div className="space-y-1.5">
                {queue.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onModuleSelect(q.module)}
                    className={`w-full rounded-md border px-2.5 py-2 text-left transition hover:translate-x-0.5 hover:shadow-md ${severityTone[q.severity]}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold uppercase tracking-wide">{q.title}</p>
                        <p className="truncate text-[10px] opacity-80">{q.subtitle}</p>
                      </div>
                      <span className="shrink-0 text-[10px] opacity-70">
                        {q.time ? formatDistanceToNow(new Date(q.time), { addSuffix: false }) : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ─── Team Pulse Bar ─── */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm"><Heart className="h-4 w-4 text-rose-400" /> Team Pulse · {teamStats.total} active</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onModuleSelect("team")}>
              Open Team Mgmt <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {team.map((m) => {
                const onPost = !!m.current_site;
                return (
                  <button key={m.id} onClick={() => onModuleSelect("team")}
                    className="group flex w-[120px] shrink-0 flex-col items-center gap-1 rounded-md border border-border/40 bg-muted/20 p-2 hover:border-primary/60 hover:bg-primary/5">
                    <div className="relative">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {m.full_name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("") ?? "?"}
                      </div>
                      <span className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${onPost ? "bg-emerald-400" : "bg-amber-400"}`} />
                    </div>
                    <p className="w-full truncate text-center text-[10px] font-medium">{m.full_name}</p>
                    <p className="w-full truncate text-center text-[9px] text-muted-foreground">{m.current_site ?? "Unassigned"}</p>
                  </button>
                );
              })}
              {team.length === 0 && (
                <p className="px-2 py-4 text-xs text-muted-foreground">No active officers in roster.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── Quick Tools row ─── */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[
          { id: "broadcast_composer", label: "Broadcast", icon: Radio },
          { id: "incident_triage",    label: "Triage",    icon: AlertTriangle },
          { id: "welfare_oversight",  label: "Welfare",   icon: Heart },
          { id: "patrol_performance", label: "Patrol KPI",icon: Activity },
          { id: "site_audit",         label: "Audit",     icon: CheckCircle2 },
          { id: "hq_connect",         label: "HQ",        icon: Phone },
        ].map((t) => (
          <button key={t.id} onClick={() => onModuleSelect(t.id)}
            className="flex flex-col items-center gap-1 rounded-md border border-border/40 bg-muted/20 p-2.5 text-xs hover:border-primary/60 hover:bg-primary/5">
            <t.icon className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <StickyTacticalBar
        onPTT={() => onModuleSelect("hq_connect")}
        onCall={() => onModuleSelect("hq_connect")}
        onBackup={() => onModuleSelect("hq_connect")}
        onPanic={() => onModuleSelect("incidents")}
        onStatus={() => onModuleSelect("hq_connect")}
      />
    </div>
  );
};

/* ─── Trend KPI tile with inline sparkline ─── */
const toneMap = {
  info:    "border-sky-500/40 bg-sky-500/5 text-sky-300",
  warning: "border-amber-500/40 bg-amber-500/5 text-amber-300",
  danger:  "border-red-500/40 bg-red-500/5 text-red-300",
  success: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
} as const;

const TrendKpi = ({ label, value, icon: Icon, tone = "info", spark }: { label: string; value: number | string; icon: any; tone?: keyof typeof toneMap; spark: number[] }) => {
  const max = Math.max(1, ...spark);
  return (
    <Card className={`border ${toneMap[tone]}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
          <Icon className="h-3.5 w-3.5 opacity-80" />
        </div>
        <p className="mt-0.5 text-2xl font-bold leading-tight text-foreground">{value}</p>
        <div className="mt-1 flex h-6 items-end gap-0.5">
          {spark.length === 0
            ? Array.from({ length: 8 }).map((_, i) => <span key={i} className="w-1.5 rounded-sm bg-current opacity-20" style={{ height: "20%" }} />)
            : spark.map((v, i) => (
                <span key={i} className="w-1.5 rounded-sm bg-current opacity-70" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
              ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupervisorCockpit;
