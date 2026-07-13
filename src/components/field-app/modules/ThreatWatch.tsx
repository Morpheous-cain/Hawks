import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ThreatWatch = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("strategic_advisories")
        .select("*")
        .order("timestamp_detected", { ascending: false })
        .limit(15);
      setItems(data ?? []);
    };
    load();
    const ch = supabase
      .channel("threat-watch-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "strategic_advisories" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-amber-500" /> Threat Watch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">No active advisories.</p>}
        {items.map((i) => (
          <div key={i.id} className="rounded-md border border-border/40 bg-muted/30 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <p className="text-xs font-semibold">{i.title ?? i.threat_type ?? "Advisory"}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{i.summary ?? i.description ?? "—"}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {i.location ?? "Unknown location"} · {new Date(i.timestamp_detected ?? i.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant={i.severity === "critical" || i.severity === "high" ? "destructive" : "outline"} className="text-[10px]">
                {i.severity ?? "info"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ThreatWatch;
