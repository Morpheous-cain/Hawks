import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, Route, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/utils/exportData";

interface Patrol { id: string; patrol_id: string|null; guard_id: string; site_name: string; status: string; start_time: string; end_time: string|null; }
interface Score { id: string; patrol_id: string; guard_id: string; integrity_score: number; grade: string; checkpoints_expected: number; checkpoints_hit: number; on_time_pct: number; deviation_count: number; scored_at: string; }
interface Deviation { id: string; patrol_id: string; guard_id: string; deviation_type: string; severity: string; detected_at: string; resolved: boolean; detail: any; }
interface Checkpoint { id: string; patrol_id: string; status?: string; scanned_at?: string|null; checkpoint_name?: string; }

const GRADE_COLOR: Record<string,string> = {
  A: "bg-emerald-500", B: "bg-green-500", C: "bg-yellow-500", D: "bg-orange-500", E: "bg-red-500", F: "bg-rose-700"
};
const SEV_COLOR: Record<string,string> = { low:"secondary", medium:"outline", high:"default", critical:"destructive" };

function gradeFromScore(s: number) {
  if (s >= 90) return "A"; if (s >= 80) return "B"; if (s >= 70) return "C";
  if (s >= 60) return "D"; if (s >= 50) return "E"; return "F";
}

export default function PatrolIntelligence() {
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string,string>>({});

  const reload = async () => {
    const since = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    const [p, s, d, c, st] = await Promise.all([
      supabase.from("patrols").select("*").gte("start_time", since).order("start_time", { ascending: false }).limit(200),
      supabase.from("patrol_scores" as any).select("*").gte("scored_at", since).order("scored_at", { ascending: false }).limit(500),
      supabase.from("patrol_deviations" as any).select("*").gte("detected_at", since).order("detected_at", { ascending: false }).limit(200),
      supabase.from("patrol_checkpoints").select("id, patrol_id, status, scanned_at, checkpoint_name").limit(2000),
      supabase.from("staff").select("id, full_name").limit(1000),
    ]);
    setPatrols((p.data as any) || []);
    setScores((s.data as any) || []);
    setDeviations((d.data as any) || []);
    setCheckpoints((c.data as any) || []);
    setStaffMap(Object.fromEntries(((st.data as any) || []).map((s: any)=>[s.id, s.full_name])));
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    const ch = supabase.channel("patrol-intel-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"patrols"}, reload)
      .on("postgres_changes",{event:"*",schema:"public",table:"patrol_scores"}, reload)
      .on("postgres_changes",{event:"*",schema:"public",table:"patrol_deviations"}, reload)
      .on("postgres_changes",{event:"*",schema:"public",table:"patrol_checkpoints"}, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const scoreOnePatrol = async (patrol: Patrol) => {
    const cps = checkpoints.filter(c => c.patrol_id === patrol.id);
    const expected = cps.length || 0;
    const hit = cps.filter(c => c.scanned_at).length;
    const onTime = expected ? Math.round((hit / expected) * 100) : 0;
    const devs = deviations.filter(d => d.patrol_id === patrol.id);
    const penalty = devs.reduce((s,d) => s + (d.severity === "critical" ? 25 : d.severity === "high" ? 15 : d.severity === "medium" ? 8 : 3), 0);
    const integrity = Math.max(0, Math.min(100, onTime - penalty));
    const grade = gradeFromScore(integrity);
    const { error } = await (supabase.from("patrol_scores" as any) as any).insert({
      patrol_id: patrol.id, guard_id: patrol.guard_id,
      checkpoints_expected: expected, checkpoints_hit: hit,
      on_time_pct: onTime, deviation_count: devs.length,
      integrity_score: integrity, grade,
    });
    if (error) toast.error(error.message); else toast.success(`Scored: Grade ${grade} (${integrity})`);
  };

  const ackDeviation = async (id: string) => {
    const { error } = await (supabase.from("patrol_deviations" as any) as any).update({ resolved: true, acknowledged_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Acknowledged");
  };

  // KPIs
  const avgScore = scores.length ? Math.round(scores.reduce((s,x)=>s+Number(x.integrity_score),0)/scores.length) : 0;
  const openDevs = deviations.filter(d => !d.resolved).length;
  const critical = deviations.filter(d => !d.resolved && d.severity === "critical").length;
  const activePatrols = patrols.filter(p => p.status === "active").length;

  // Heatmap by site
  const siteHeat = useMemo(() => {
    const m: Record<string, { total: number; critical: number }> = {};
    for (const p of patrols) {
      const s = (m[p.site_name] ||= { total: 0, critical: 0 });
      s.total++;
      if (deviations.some(d => d.patrol_id === p.id && !d.resolved && d.severity === "critical")) s.critical++;
    }
    return Object.entries(m).sort((a,b)=>b[1].critical - a[1].critical || b[1].total - a[1].total).slice(0,12);
  }, [patrols, deviations]);

  return (
    <ModuleScaffold
      title="Patrol Intelligence"
      description="A–F integrity grading, route deviation alerts, and patrol heatmap."
      icon={Activity}
      kpis={[
        { label: "Active Patrols", value: activePatrols, hint: "Right now" },
        { label: "Avg Integrity", value: `${avgScore}/100`, hint: "Last 7d" },
        { label: "Open Deviations", value: openDevs },
        { label: "Critical", value: critical, hint: "Unresolved" },
      ]}
      onExport={() => exportToCSV(scores, "patrol-scores.csv")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-500"/>
            <div className="font-semibold">Recent Patrols & Scores</div>
          </div>
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
            {patrols.slice(0,40).map(p => {
              const score = scores.find(s => s.patrol_id === p.id);
              return (
                <div key={p.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.patrol_id || p.id.slice(0,8)} · {p.site_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {staffMap[p.guard_id] || "Unassigned"} · {new Date(p.start_time).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {score ? (
                      <>
                        <span className={`text-white text-xs font-bold rounded px-2 py-0.5 ${GRADE_COLOR[score.grade]}`}>
                          {score.grade}
                        </span>
                        <span className="text-xs text-muted-foreground">{Number(score.integrity_score).toFixed(0)}</span>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={()=>scoreOnePatrol(p)}>Score</Button>
                    )}
                  </div>
                </div>
              );
            })}
            {patrols.length===0 && <div className="text-sm text-muted-foreground text-center py-8">No patrols in last 7 days.</div>}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Route className="h-4 w-4 text-blue-500"/>
            <div className="font-semibold">Site Heatmap</div>
          </div>
          <div className="space-y-2">
            {siteHeat.map(([site, v]) => {
              const rate = v.total ? v.critical/v.total : 0;
              const tone = rate > 0.5 ? "bg-red-500" : rate > 0.2 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={site} className="text-sm">
                  <div className="flex justify-between"><span className="truncate">{site}</span><span className="text-xs text-muted-foreground">{v.critical}/{v.total}</span></div>
                  <div className="h-1.5 rounded bg-muted overflow-hidden mt-1">
                    <div className={`h-full ${tone}`} style={{ width: `${Math.max(8, rate*100)}%` }}/>
                  </div>
                </div>
              );
            })}
            {siteHeat.length===0 && <div className="text-xs text-muted-foreground">No site data.</div>}
          </div>
        </Card>
      </div>

      <Card className="p-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertOctagon className="h-4 w-4 text-red-500"/>
          <div className="font-semibold">Deviation Alerts</div>
        </div>
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {deviations.filter(d=>!d.resolved).slice(0,30).map(d => (
            <div key={d.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{d.deviation_type.replace("_"," ")}</div>
                <div className="text-xs text-muted-foreground">
                  {staffMap[d.guard_id] || "Unknown"} · {new Date(d.detected_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={SEV_COLOR[d.severity] as any}>{d.severity}</Badge>
                <Button size="sm" variant="outline" onClick={()=>ackDeviation(d.id)}>Acknowledge</Button>
              </div>
            </div>
          ))}
          {deviations.filter(d=>!d.resolved).length===0 && (
            <div className="text-sm text-muted-foreground text-center py-6">No open deviations. ✓</div>
          )}
        </div>
      </Card>
    </ModuleScaffold>
  );
}
