import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

export const WelfareCheck = () => {
  const { staffRecord } = useOfficerAssignments();
  const [latest, setLatest] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    if (!staffRecord?.id) return;
    const { data } = await (supabase as any)
      .from("welfare_heartbeats")
      .select("*")
      .eq("staff_id", staffRecord.id)
      .order("last_check_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatest(data);
  };
  useEffect(() => { load(); }, [staffRecord?.id]);

  const checkIn = async () => {
    if (!staffRecord?.id) return toast.error("Staff record required");
    const next = new Date(Date.now() + 30 * 60_000);
    const { error } = await (supabase as any).from("welfare_heartbeats").insert({
      staff_id: staffRecord.id, status: "ok", interval_minutes: 30,
      next_due_at: next.toISOString(), last_check_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("Welfare check logged · next due in 30 min");
    load();
  };

  const dueIn = latest?.next_due_at ? Math.max(0, new Date(latest.next_due_at).getTime() - now) : 0;
  const overdue = latest && dueIn === 0;
  const m = Math.floor(dueIn / 60_000), s = Math.floor((dueIn % 60_000) / 1000);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-emerald-500" /> Welfare Heartbeat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border/40 bg-muted/30 p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next check due in</p>
          <p className={`mt-1 font-mono text-3xl font-bold ${overdue ? "text-red-500" : "text-emerald-500"}`}>
            {latest ? `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : "—"}
          </p>
          <Badge variant={overdue ? "destructive" : "outline"} className="mt-2 text-[10px]">
            {overdue ? "OVERDUE" : latest ? "OK" : "Not started"}
          </Badge>
        </div>
        <Button size="lg" className="w-full gap-2" onClick={checkIn}>
          <CheckCircle2 className="h-4 w-4" /> I'm OK — Check In
        </Button>
        <p className="text-center text-[10px] text-muted-foreground">
          Missed checks auto-escalate to HQ Connect.
        </p>
      </CardContent>
    </Card>
  );
};

export default WelfareCheck;
