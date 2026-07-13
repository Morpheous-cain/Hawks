import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

export const MyPerformance = () => {
  const { staffRecord } = useOfficerAssignments();
  const [stats, setStats] = useState({ incidents: 0, drills: 0, audits: 0, attendance: 0 });
  const [grade, setGrade] = useState("B+");

  useEffect(() => {
    const load = async () => {
      if (!staffRecord?.id) return;
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
      const [a, b, c] = await Promise.all([
        (supabase as any).from("incidents").select("id", { count: "exact", head: true }).eq("reported_by", staffRecord.id).gte("created_at", monthAgo),
        (supabase as any).from("drill_completions").select("id,passed", { count: "exact" }).eq("staff_id", staffRecord.id).gte("created_at", monthAgo),
        (supabase as any).from("attendance_records").select("id", { count: "exact", head: true }).eq("staff_id", staffRecord.id).gte("created_at", monthAgo),
      ]);
      const drillsPassed = (b.data ?? []).filter((d: any) => d.passed).length;
      const total = (a.count ?? 0) * 10 + drillsPassed * 15 + (c.count ?? 0) * 5;
      setStats({ incidents: a.count ?? 0, drills: drillsPassed, audits: 0, attendance: c.count ?? 0 });
      setGrade(total > 200 ? "A" : total > 150 ? "A-" : total > 100 ? "B+" : total > 60 ? "B" : "C");
    };
    load();
  }, [staffRecord?.id]);

  const score = Math.min(100, stats.incidents * 5 + stats.drills * 8 + stats.attendance * 3);

  return (
    <div className="space-y-4">
      <Card className="border-primary/40 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-primary" /> My Performance — last 30 days</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-6xl font-black text-primary">{grade}</p>
          <Progress value={score} />
          <p className="text-xs text-muted-foreground">{score}/100</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={AlertTriangle} label="Incidents Filed" value={stats.incidents} tone="text-amber-500" />
        <Stat icon={CheckCircle2} label="Drills Passed" value={stats.drills} tone="text-emerald-500" />
        <Stat icon={TrendingUp} label="Audits" value={stats.audits} tone="text-blue-500" />
        <Stat icon={Award} label="Attendance" value={stats.attendance} tone="text-cyan-500" />
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, tone }: any) => (
  <Card className="p-3">
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone}`} />
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
    <p className="mt-1 text-2xl font-bold">{value}</p>
  </Card>
);

export default MyPerformance;
