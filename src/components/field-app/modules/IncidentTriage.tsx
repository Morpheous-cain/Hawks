import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const IncidentTriage = () => {
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("incidents")
      .select("*")
      .in("status", ["new", "open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(30);
    setItems(data ?? []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("triage")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const escalate = async (id: string) => {
    const { error } = await (supabase as any).from("incidents").update({ severity: "high", status: "in_progress" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Escalated");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-500" /> Incident Triage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">Queue clear.</p>}
        {items.map((i) => (
          <div key={i.id} className="rounded border border-border/40 bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{i.incident_type ?? "Incident"}</p>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{i.description ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={i.severity === "high" || i.severity === "critical" ? "destructive" : "outline"} className="text-[10px]">{i.severity ?? "low"}</Badge>
                <Button size="sm" variant="outline" onClick={() => escalate(i.id)} className="gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Escalate
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default IncidentTriage;
