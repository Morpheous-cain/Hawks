// Training Drill Simulator — operators run synthetic incidents and get scored.
// Drills are checklist-based: tick the right actions inside the SLA window.
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Activity, Award, Clock, Play, Square, Target } from "lucide-react";

type Drill = {
  id: string;
  drill_code: string;
  scenario_type: string;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  title: string;
  briefing: string;
  expected_actions: string[];
  sla_seconds: number;
};

type Run = {
  drill: Drill;
  startedAt: number;
  ticked: Set<number>;
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  hard: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  extreme: "bg-red-500/15 text-red-400 border-red-500/30",
};

const TrainingDrills = () => {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("training_drills")
        .select("*")
        .eq("is_active", true)
        .order("difficulty");
      if (error) { toast.error("Could not load drills — has the migration been applied?"); return; }
      setDrills((data ?? []).map((d: any) => ({ ...d, expected_actions: d.expected_actions ?? [] })));

      const { data: hist } = await (supabase as any)
        .from("drill_runs")
        .select("*, training_drills(title, drill_code)")
        .order("started_at", { ascending: false })
        .limit(10);
      setHistory(hist ?? []);
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (!run) {
      if (tick.current) window.clearInterval(tick.current);
      setElapsed(0);
      return;
    }
    tick.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - run.startedAt) / 1000));
    }, 250);
    return () => { if (tick.current) window.clearInterval(tick.current); };
  }, [run]);

  const start = (d: Drill) => {
    setRun({ drill: d, startedAt: Date.now(), ticked: new Set() });
    toast.success(`Drill ${d.drill_code} started — clock is running`);
  };

  const toggleAction = (idx: number) => {
    if (!run) return;
    const next = new Set(run.ticked);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setRun({ ...run, ticked: next });
  };

  const completeRun = async (forced = false) => {
    if (!run) return;
    const duration = Math.floor((Date.now() - run.startedAt) / 1000);
    const total = run.drill.expected_actions.length;
    const correct = run.ticked.size;
    const completion = total > 0 ? correct / total : 0;
    const slaRatio = Math.min(duration / run.drill.sla_seconds, 2);
    // Score: 70% completion + 30% speed (inverted, capped)
    const speedScore = Math.max(0, 1 - Math.max(0, slaRatio - 1));
    const score = Math.round(completion * 70 + speedScore * 30);
    const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 45 ? "D" : "F";
    const passed = score >= 60 && correct === total;
    const feedback = [
      forced ? "Drill aborted." : null,
      `${correct}/${total} required actions completed.`,
      duration > run.drill.sla_seconds ? `SLA exceeded by ${duration - run.drill.sla_seconds}s.` : `Within SLA by ${run.drill.sla_seconds - duration}s.`,
    ].filter(Boolean).join(" ");

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("drill_runs").insert({
      drill_id: run.drill.id,
      operator_id: user?.id ?? null,
      completed_at: new Date().toISOString(),
      duration_seconds: duration,
      actions_taken: Array.from(run.ticked),
      score,
      grade,
      feedback,
      passed,
    });
    if (error) toast.error("Could not save drill run");
    else toast.success(`Drill complete — Grade ${grade} (${score}/100)`);

    setRun(null);
    // Refresh history
    const { data: hist } = await (supabase as any)
      .from("drill_runs")
      .select("*, training_drills(title, drill_code)")
      .order("started_at", { ascending: false })
      .limit(10);
    setHistory(hist ?? []);
  };

  const slaPct = useMemo(() => {
    if (!run) return 0;
    return Math.min(100, (elapsed / run.drill.sla_seconds) * 100);
  }, [elapsed, run]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Training Drill Simulator
          </h1>
          <p className="text-sm text-muted-foreground">
            Synthetic incidents injected into a sandboxed Control Room view. Score by completion + SLA.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5"><Activity className="h-3 w-3" /> Drills loaded: {drills.length}</Badge>
      </header>

      {run ? (
        <Card className="p-6 border-primary/40">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{run.drill.drill_code} · {run.drill.scenario_type.replace(/_/g, " ")}</div>
              <h2 className="text-xl font-bold">{run.drill.title}</h2>
            </div>
            <Badge className={DIFFICULTY_COLOR[run.drill.difficulty]}>{run.drill.difficulty}</Badge>
          </div>

          <div className="bg-muted/30 border border-border/40 rounded-md p-4 text-sm mb-4">
            <div className="font-semibold mb-1 text-xs uppercase tracking-wider text-muted-foreground">Briefing</div>
            {run.drill.briefing}
          </div>

          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {elapsed}s / {run.drill.sla_seconds}s SLA</span>
            <span className={elapsed > run.drill.sla_seconds ? "text-red-400 font-semibold" : "text-muted-foreground"}>
              {elapsed > run.drill.sla_seconds ? "OVER SLA" : `${run.drill.sla_seconds - elapsed}s remaining`}
            </span>
          </div>
          <Progress value={slaPct} className={elapsed > run.drill.sla_seconds ? "[&>div]:bg-red-500" : ""} />

          <div className="mt-6 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Required actions ({run.ticked.size}/{run.drill.expected_actions.length})</div>
            {run.drill.expected_actions.map((act, i) => (
              <label key={i} className="flex items-start gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer">
                <Checkbox checked={run.ticked.has(i)} onCheckedChange={() => toggleAction(i)} className="mt-0.5" />
                <span className={run.ticked.has(i) ? "line-through text-muted-foreground" : ""}>{act}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={() => completeRun(false)} className="gap-1.5"><Square className="h-3.5 w-3.5" /> Complete Drill</Button>
            <Button variant="outline" onClick={() => completeRun(true)}>Abort</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drills.map((d) => (
            <Card key={d.id} className="p-4 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-muted-foreground font-mono">{d.drill_code}</div>
                <Badge className={DIFFICULTY_COLOR[d.difficulty]}>{d.difficulty}</Badge>
              </div>
              <h3 className="font-semibold mb-1">{d.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{d.briefing}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span><Clock className="h-3 w-3 inline mr-1" /> {d.sla_seconds}s SLA</span>
                <span>{d.expected_actions.length} actions</span>
              </div>
              <Button size="sm" onClick={() => start(d)} className="w-full gap-1.5"><Play className="h-3 w-3" /> Start drill</Button>
            </Card>
          ))}
          {drills.length === 0 && (
            <Card className="p-8 col-span-full text-center text-muted-foreground">
              No drills loaded. Apply the Phase 6 migration to seed canonical drills.
            </Card>
          )}
        </div>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Recent runs</h2>
        </div>
        <div className="space-y-2">
          {history.map((h: any) => (
            <div key={h.id} className="flex items-center justify-between text-sm border-b border-border/40 py-2">
              <div>
                <div className="font-medium">{h.training_drills?.title ?? "Drill"}</div>
                <div className="text-xs text-muted-foreground">{new Date(h.started_at).toLocaleString()} · {h.duration_seconds}s</div>
              </div>
              <Badge className={h.grade === "A" ? "bg-emerald-500" : h.grade === "F" ? "bg-red-500" : ""}>
                {h.grade ?? "—"} · {h.score ?? 0}
              </Badge>
            </div>
          ))}
          {history.length === 0 && <div className="text-sm text-muted-foreground">No drill runs yet.</div>}
        </div>
      </Card>
    </div>
  );
};

export default TrainingDrills;
