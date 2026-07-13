import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const PreShiftBriefing = () => {
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<string>("");
  const [recent, setRecent] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data: incidents } = await (supabase as any)
      .from("incidents")
      .select("id,incident_type,severity,description,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecent(incidents ?? []);
    setBrief(buildBrief(incidents ?? []));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" /> Pre-Shift Briefing
          </CardTitle>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Summary</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{brief}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Sector Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 && <p className="text-xs text-muted-foreground">No recent activity.</p>}
          {recent.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-2 rounded border border-border/40 bg-muted/30 p-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.incident_type ?? "Incident"}</p>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.description ?? "—"}</p>
              </div>
              <Badge variant={r.severity === "critical" || r.severity === "high" ? "destructive" : "outline"} className="text-[10px]">
                {r.severity ?? "low"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

function buildBrief(incidents: any[]): string {
  if (!incidents.length) return "All quiet on your sector. No incidents in the last 24h. Maintain standard cadence.";
  const counts = incidents.reduce<Record<string, number>>((a, i) => {
    const k = i.severity ?? "low"; a[k] = (a[k] ?? 0) + 1; return a;
  }, {});
  const lines = [
    `${incidents.length} incident(s) logged in last 24h.`,
    counts.critical ? `🔴 ${counts.critical} critical — heightened vigilance required.` : "",
    counts.high ? `🟠 ${counts.high} high-severity event(s).` : "",
    `Top type: ${incidents[0]?.incident_type ?? "varied"}.`,
    "Verify body cam, comms, and panic. Confirm checkpoint cadence with supervisor.",
  ].filter(Boolean);
  return lines.join("\n");
}

export default PreShiftBriefing;
