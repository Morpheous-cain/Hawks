import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";

interface LiveSectorMapProps {
  /** Optional pre-loaded team array. If omitted, the map self-loads active staff. */
  team?: any[];
  /** Tailwind aspect class. Default: aspect-[16/10] */
  aspectClass?: string;
}

/**
 * Shared Live Sector Map — used by Supervisor, Operations Officer,
 * Response Officer and Control Room cockpits. Renders live officer pins
 * (on-post / unassigned / SOS) plus an SOS overlay sourced from sos_alerts.
 */
export const LiveSectorMap = ({ team: externalTeam, aspectClass = "aspect-[16/10]" }: LiveSectorMapProps) => {
  const [team, setTeam] = useState<any[]>(externalTeam ?? []);
  const [sosCount, setSosCount] = useState(0);

  useEffect(() => {
    if (externalTeam) {
      setTeam(externalTeam);
      return;
    }
    const loadTeam = async () => {
      const { data } = await (supabase as any)
        .from("staff")
        .select("id,full_name,current_site,status")
        .eq("status", "active")
        .limit(50);
      setTeam(data ?? []);
    };
    loadTeam();
    const ch = supabase
      .channel("live-sector-map-staff")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, loadTeam)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [externalTeam]);

  useEffect(() => {
    const loadSos = async () => {
      const { count } = await (supabase as any)
        .from("sos_alerts")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      setSosCount(count ?? 0);
    };
    loadSos();
    const ch = supabase
      .channel("live-sector-map-sos")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, loadSos)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className={`relative ${aspectClass} overflow-hidden rounded-md border border-border/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {team.slice(0, 14).map((m, i) => {
        const x = 8 + ((i * 53) % 84);
        const y = 8 + ((i * 37) % 80);
        const onPost = !!m.current_site;
        return (
          <div
            key={m.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className={`block h-2.5 w-2.5 rounded-full ring-2 ring-background animate-pulse ${
                onPost
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
              }`}
            />
            <div className="pointer-events-none absolute left-3 top-3 hidden whitespace-nowrap rounded border border-border/60 bg-popover px-1.5 py-0.5 text-[10px] group-hover:block">
              {m.full_name}
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded bg-background/70 px-2 py-1 text-[10px] backdrop-blur">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> On post</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unassigned</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> SOS {sosCount > 0 ? `· ${sosCount}` : ""}</span>
      </div>
      <div className="absolute right-2 top-2 rounded bg-background/70 px-2 py-1 text-[10px] backdrop-blur">
        <Activity className="mr-1 inline h-3 w-3 text-emerald-400" /> Streaming
      </div>
    </div>
  );
};

export default LiveSectorMap;
