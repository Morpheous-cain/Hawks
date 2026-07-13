import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity, Cloud, ChevronRight, CheckCircle2, ShieldAlert, Sparkles, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StickyTacticalBar from "./StickyTacticalBar";
import LiveSectorMap from "./LiveSectorMap";
import { formatDistanceToNow } from "date-fns";
import { getCockpitProfile, type RankCockpitProfile, type QueueSource } from "@/config/rankCockpitConfig";

interface Props {
  rank: string;
  rankDisplayName: string;
  userName: string;
  staffId?: string;
  assignedSites?: any[];
  onModuleSelect: (id: string) => void;
}

type QueueItem = {
  id: string;
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

const toneMap: Record<string, string> = {
  info:    "border-sky-500/40 bg-sky-500/5 text-sky-300",
  warning: "border-amber-500/40 bg-amber-500/5 text-amber-300",
  danger:  "border-red-500/40 bg-red-500/5 text-red-300",
  success: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
};

const normalizeSeverity = (raw: any, fallback: "critical" | "high" | "medium" | "low"): "critical" | "high" | "medium" | "low" => {
  const v = String(raw ?? "").toLowerCase();
  if (["critical","high","medium","low"].includes(v)) return v as any;
  if (v === "urgent") return "critical";
  return fallback;
};

export const RankCockpit = ({ rank, rankDisplayName, userName, staffId, assignedSites = [], onModuleSelect }: Props) => {
  const profile = useMemo(() => getCockpitProfile(rank), [rank]);
  const [kpiValues, setKpiValues] = useState<number[]>([]);
  const [trends, setTrends] = useState<number[][]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [pulse, setPulse] = useState<any[]>([]);

  const sectorName = assignedSites?.[0]?.client_name || assignedSites?.[0]?.site_name || "Sector Alpha";

  /* ---------- KPI counts ---------- */
  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      const counts = await Promise.all(profile.kpis.map(async (k) => {
        try {
          let q: any = (supabase as any).from(k.table).select("id", { count: "exact", head: true });
          if (k.filter) Object.entries(k.filter).forEach(([col, val]) => { q = q.eq(col, val); });
          if (k.inFilter) q = q.in(k.inFilter.col, k.inFilter.values);
          if (k.inFilters) k.inFilters.forEach((f) => { q = q.in(f.col, f.values); });
          if (k.sinceField) q = q.gte(k.sinceField, isoToday);
          const { count } = await q;
          return count ?? 0;
        } catch { return 0; }
      }));
      setKpiValues(counts);
    };
    load();
    const ch = supabase.channel(`cockpit-kpis-${profile.rank}`);
    profile.kpis.forEach((k) => ch.on("postgres_changes", { event: "*", schema: "public", table: k.table }, load));
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile]);

  /* ---------- 8h sparklines on first KPI table ---------- */
  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const buckets = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(); d.setHours(d.getHours() - (7 - i), 0, 0, 0); return d;
      });
      const out: number[][] = [];
      for (const k of profile.kpis) {
        const series: number[] = [];
        for (let i = 0; i < buckets.length; i++) {
          const start = buckets[i];
          const end = i === buckets.length - 1 ? new Date() : buckets[i + 1];
          try {
            const { count } = await (supabase as any).from(k.table)
              .select("id", { count: "exact", head: true })
              .gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
            series.push(count ?? 0);
          } catch { series.push(0); }
        }
        out.push(series);
      }
      setTrends(out);
    };
    load();
  }, [profile]);

  /* ---------- Action queue (multi-source) ---------- */
  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const items: QueueItem[] = [];
      await Promise.all(profile.queueSources.map(async (src: QueueSource) => {
        try {
          let q: any = (supabase as any).from(src.table).select("*").order(src.timeField, { ascending: false }).limit(8);
          if (src.status) q = q.in(src.status.col, src.status.values);
          if (src.scopeIn) q = q.in(src.scopeIn.col, src.scopeIn.values);
          if (src.scopeEq) Object.entries(src.scopeEq).forEach(([col, val]) => { q = q.eq(col, val); });
          const { data } = await q;
          (data ?? []).forEach((row: any) => {
            const raw = src.severityField ? row[src.severityField] : null;
            items.push({
              id: `${src.table}-${row.id}`,
              title: String(row[src.titleField] ?? src.kind).replace(/_/g, " "),
              subtitle: src.subtitleField ? (row[src.subtitleField] ?? "—") : src.kind,
              time: row[src.timeField],
              severity: normalizeSeverity(raw, src.defaultSeverity ?? "medium"),
              module: src.module,
            });
          });
        } catch (e) { /* table may not exist in this project — skip */ }
      }));
      const order = { critical: 0, high: 1, medium: 2, low: 3 } as any;
      items.sort((a, b) => (order[a.severity] - order[b.severity]) || (new Date(b.time).getTime() - new Date(a.time).getTime()));
      setQueue(items.slice(0, 14));
    };
    load();
    const ch = supabase.channel(`cockpit-queue-${profile.rank}`);
    profile.queueSources.forEach((s) => ch.on("postgres_changes", { event: "*", schema: "public", table: s.table }, load));
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile]);

  /* ---------- Pulse strip ---------- */
  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      try {
        let q: any = (supabase as any).from(profile.pulseTable)
          .select("*").order("created_at", { ascending: false }).limit(20);
        if (profile.pulseScopeIn) q = q.in(profile.pulseScopeIn.col, profile.pulseScopeIn.values);
        if (profile.pulseScopeEq) Object.entries(profile.pulseScopeEq).forEach(([col, val]) => { q = q.eq(col, val); });
        const { data } = await q;
        setPulse(data ?? []);
      } catch { setPulse([]); }
    };
    load();
  }, [profile]);

  if (!profile) {
    return <div className="p-6 text-sm text-muted-foreground">No cockpit profile configured for rank "{rank}".</div>;
  }

  const sectorClock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
  const PanelIcon = profile.panelIcon;

  return (
    <div className="space-y-4 pb-2">
      {/* ─── Mission Strip ─── */}
      <Card className="border-primary/30 bg-gradient-to-br from-slate-900 via-slate-900 to-primary/10 shadow-glow">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/20 p-2"><ShieldAlert className={`h-5 w-5 ${profile.accent}`} /></div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{profile.title} · {sectorClock} EAT</p>
                <h2 className="text-lg font-bold leading-tight">{rankDisplayName} · {userName}</h2>
                <p className="text-xs text-muted-foreground">{profile.missionLine} · {sectorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300">Threat: Medium</Badge>
              <Badge variant="outline" className="border-sky-500/40 text-sky-300"><Cloud className="mr-1 h-3 w-3" /> 24°C</Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">{pulse.length} live</Badge>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs">
            <Sparkles className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${profile.accent}`} />
            <p className="text-foreground/90"><span className={`font-semibold ${profile.accent}`}>AI Brief:</span> Sector nominal. Monitor the action queue for escalations and respond per SOP.</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Trend KPIs ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {profile.kpis.map((k, i) => {
          const Icon = k.icon;
          const spark = trends[i] ?? [];
          const max = Math.max(1, ...spark);
          return (
            <Card key={k.label} className={`border ${toneMap[k.tone]}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{k.label}</p>
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                </div>
                <p className="mt-0.5 text-2xl font-bold leading-tight text-foreground">{kpiValues[i] ?? 0}</p>
                <div className="mt-1 flex h-6 items-end gap-0.5">
                  {spark.length === 0
                    ? Array.from({ length: 8 }).map((_, j) => <span key={j} className="w-1.5 rounded-sm bg-current opacity-20" style={{ height: "20%" }} />)
                    : spark.map((v, j) => (
                        <span key={j} className="w-1.5 rounded-sm bg-current opacity-70" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
                      ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Main panel + Action queue ─── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm"><PanelIcon className={`h-4 w-4 ${profile.accent}`} /> {profile.panelTitle}</CardTitle>
              {profile.primaryHubModule && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onModuleSelect(profile.primaryHubModule!)}>
                  Open hub <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ContextPanel profile={profile} pulse={pulse} onModuleSelect={onModuleSelect} />
          </CardContent>
        </Card>

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
                  All clear.
                </div>
              )}
              <div className="space-y-1.5">
                {queue.map((q) => (
                  <button key={q.id} onClick={() => onModuleSelect(q.module)}
                    className={`w-full rounded-md border px-2.5 py-2 text-left transition hover:translate-x-0.5 hover:shadow-md ${severityTone[q.severity]}`}>
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

      {/* ─── Pulse strip ─── */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Activity className={`h-4 w-4 ${profile.accent}`} /> {profile.pulseLabel} · {pulse.length}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {pulse.map((p) => {
                const primary = p[profile.pulseFields.primary] ?? "—";
                const secondary = profile.pulseFields.secondary ? p[profile.pulseFields.secondary] : null;
                const status = profile.pulseFields.statusField ? p[profile.pulseFields.statusField] : null;
                const ok = !status || ["active","ok","completed","verified","scheduled"].includes(String(status).toLowerCase());
                return (
                  <div key={p.id} className="flex w-[150px] shrink-0 flex-col gap-1 rounded-md border border-border/40 bg-muted/20 p-2">
                    <p className="truncate text-[11px] font-semibold">{String(primary)}</p>
                    {secondary && <p className="truncate text-[10px] text-muted-foreground">{String(secondary)}</p>}
                    {status && (
                      <span className={`inline-flex items-center gap-1 text-[10px] ${ok ? "text-emerald-400" : "text-amber-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />{String(status)}
                      </span>
                    )}
                  </div>
                );
              })}
              {pulse.length === 0 && <p className="px-2 py-4 text-xs text-muted-foreground">No live records.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── Quick tools ─── */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {profile.quickTools.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => onModuleSelect(t.id)}
              className="flex flex-col items-center gap-1 rounded-md border border-border/40 bg-muted/20 p-2.5 text-xs hover:border-primary/60 hover:bg-primary/5">
              <Icon className={`h-4 w-4 ${profile.accent}`} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
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

/* ─── Context panel: map / list visualisation ─── */
const ContextPanel = ({ profile, pulse, onModuleSelect }: { profile: RankCockpitProfile; pulse: any[]; onModuleSelect: (id: string) => void }) => {
  // Map view for ranks that operate spatially — shared Live Sector Map
  if (profile.panelType === "map" || profile.panelType === "monitoring") {
    return <LiveSectorMap />;
  }

  // List view (cases, deliveries, missions, workorders, training)
  return (
    <ScrollArea className="h-[340px] pr-2">
      <div className="space-y-1.5">
        {pulse.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No active records.</p>}
        {pulse.slice(0, 12).map((p) => {
          const primary = p[profile.pulseFields.primary] ?? "—";
          const secondary = profile.pulseFields.secondary ? p[profile.pulseFields.secondary] : null;
          const status = profile.pulseFields.statusField ? p[profile.pulseFields.statusField] : null;
          return (
            <button key={p.id} onClick={() => profile.primaryHubModule && onModuleSelect(profile.primaryHubModule)}
              className="flex w-full items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-left text-xs hover:border-primary/60 hover:bg-primary/5">
              <div className="min-w-0">
                <p className="truncate font-medium">{String(primary)}</p>
                {secondary && <p className="truncate text-[10px] text-muted-foreground">{String(secondary)}</p>}
              </div>
              {status && <Badge variant="outline" className="text-[10px]">{String(status)}</Badge>}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default RankCockpit;
