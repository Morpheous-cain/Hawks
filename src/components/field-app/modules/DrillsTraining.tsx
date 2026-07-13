import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

const DRILLS = [
  { code: "FIRE-01", title: "Fire evacuation procedure", category: "safety", q: "First action on fire alarm?" },
  { code: "ROBBERY-01", title: "Armed robbery response", category: "tactical", q: "Primary objective during armed robbery?" },
  { code: "RADIO-01", title: "Radio call sign protocol", category: "comms", q: "Standard call format?" },
  { code: "SEARCH-01", title: "Vehicle search procedure", category: "patrol", q: "Three-point search sequence?" },
];

export const DrillsTraining = () => {
  const { staffRecord } = useOfficerAssignments();
  const [completions, setCompletions] = useState<any[]>([]);

  const load = async () => {
    if (!staffRecord?.id) return;
    const { data } = await (supabase as any)
      .from("drill_completions").select("*").eq("staff_id", staffRecord.id).order("completed_at", { ascending: false }).limit(10);
    setCompletions(data ?? []);
  };
  useEffect(() => { load(); }, [staffRecord?.id]);

  const complete = async (drill: typeof DRILLS[number]) => {
    const ans = prompt(`${drill.title}\n\n${drill.q}`);
    if (!ans) return;
    const passed = ans.length > 5;
    const { error } = await (supabase as any).from("drill_completions").insert({
      staff_id: staffRecord?.id, drill_code: drill.code, drill_title: drill.title,
      drill_category: drill.category, score: passed ? 100 : 50, passed,
      responses: { answer: ans },
    });
    if (error) return toast.error(error.message);
    toast.success(passed ? "Drill passed ✓" : "Drill recorded — review required");
    load();
  };

  const isDoneToday = (code: string) =>
    completions.some((c) => c.drill_code === code && new Date(c.completed_at).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-primary" /> Daily Drills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DRILLS.map((d) => (
            <div key={d.code} className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/30 p-3 text-xs">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-[10px] uppercase text-muted-foreground">{d.category} · {d.code}</p>
              </div>
              {isDoneToday(d.code)
                ? <Badge variant="outline" className="text-emerald-500 border-emerald-500/40"><CheckCircle2 className="mr-1 h-3 w-3" /> Done</Badge>
                : <Button size="sm" onClick={() => complete(d)}>Take</Button>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent Attempts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {completions.length === 0 && <p className="text-xs text-muted-foreground">No history.</p>}
          {completions.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <span>{c.drill_title}</span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{c.score}/100</span>
                {c.passed ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DrillsTraining;
