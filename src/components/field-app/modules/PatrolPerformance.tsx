import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const grade = (score: number) => score >= 90 ? "A" : score >= 80 ? "A-" : score >= 70 ? "B+" : score >= 60 ? "B" : score >= 50 ? "C" : "D";

export const PatrolPerformance = () => {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: staff } = await (supabase as any).from("staff").select("id,full_name,position").eq("status", "active").limit(30);
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
      const enriched: any[] = [];
      for (const s of staff ?? []) {
        const [{ count: inc }, { data: drills }, { count: att }] = await Promise.all([
          (supabase as any).from("incidents").select("id", { count: "exact", head: true }).eq("reported_by", s.id).gte("created_at", monthAgo),
          (supabase as any).from("drill_completions").select("passed").eq("staff_id", s.id).gte("created_at", monthAgo),
          (supabase as any).from("attendance_records").select("id", { count: "exact", head: true }).eq("staff_id", s.id).gte("created_at", monthAgo),
        ]);
        const drillsPassed = (drills ?? []).filter((d: any) => d.passed).length;
        const score = Math.min(100, (inc ?? 0) * 5 + drillsPassed * 8 + (att ?? 0) * 3);
        enriched.push({ ...s, score, grade: grade(score), incidents: inc ?? 0, drills: drillsPassed, attendance: att ?? 0 });
      }
      enriched.sort((a, b) => b.score - a.score);
      setRows(enriched);
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-emerald-500" /> Patrol Performance — 30 days</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No staff data yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="space-y-1.5 rounded border border-border/40 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs">
              <p className="font-medium">{r.full_name}</p>
              <Badge variant="outline" className="font-mono text-xs">{r.grade}</Badge>
            </div>
            <Progress value={r.score} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Inc {r.incidents}</span><span>Drills {r.drills}</span><span>Att {r.attendance}</span><span>{r.score}/100</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PatrolPerformance;
