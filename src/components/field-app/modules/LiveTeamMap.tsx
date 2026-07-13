import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const LiveTeamMap = () => {
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("staff").select("id,full_name,position,current_site,status").eq("status", "active").limit(50);
      setTeam(data ?? []);
    };
    load();
    const ch = supabase.channel("team-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4 text-primary" /> Live Team Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-md border border-border/40 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center text-xs text-muted-foreground flex items-center justify-center">
            <div>
              <Users className="mx-auto h-6 w-6 text-primary mb-2" />
              <p>{team.length} active officers · positions streaming</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Team Roster</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {team.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <div>
                <p className="font-medium">{m.full_name}</p>
                <p className="text-[10px] text-muted-foreground">{m.position ?? "—"}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{m.current_site ?? "Site TBA"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTeamMap;
