import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const WelfareOversight = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("welfare_heartbeats")
        .select("*,staff:staff_id(full_name)")
        .order("next_due_at", { ascending: true })
        .limit(50);
      setRows(data ?? []);
    };
    load();
    const ch = supabase.channel("welfare-oversight")
      .on("postgres_changes", { event: "*", schema: "public", table: "welfare_heartbeats" }, load)
      .subscribe();
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-4 w-4 text-emerald-500" /> Welfare Oversight</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No active welfare timers.</p>}
        {rows.map((r) => {
          const overdue = new Date(r.next_due_at).getTime() < now;
          return (
            <div key={r.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <div>
                <p className="font-medium">{r.staff?.full_name ?? "Officer"}</p>
                <p className="text-[10px] text-muted-foreground">Next due {new Date(r.next_due_at).toLocaleTimeString()}</p>
              </div>
              {overdue
                ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>
                : <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">OK</Badge>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default WelfareOversight;
