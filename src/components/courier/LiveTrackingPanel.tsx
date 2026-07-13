import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Navigation, Truck, Clock } from "lucide-react";

type D = { id: string; tracking_number: string; status: string | null; recipient_address: string; assigned_rider_id: string | null; created_at: string };
type R = { id: string; rider_id: string; rider_name: string; vehicle_type: string; zone: string | null; status: string | null };

const fmtRel = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
};

export const LiveTrackingPanel = () => {
  const [d, setD] = useState<D[]>([]);
  const [r, setR] = useState<R[]>([]);

  const load = async () => {
    const [dd, rr] = await Promise.all([
      supabase.from("courier_deliveries").select("id,tracking_number,status,recipient_address,assigned_rider_id,created_at").limit(500),
      supabase.from("courier_riders").select("id,rider_id,rider_name,vehicle_type,zone,status").eq("status", "active"),
    ]);
    setD((dd.data ?? []) as D[]);
    setR((rr.data ?? []) as R[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("live-track")
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_deliveries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_riders" }, load)
      .subscribe();
    const t = setInterval(load, 20000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  const riderRows = useMemo(() => {
    return r.map((rider) => {
      const jobs = d.filter((x) => x.assigned_rider_id === rider.id && !["delivered", "cancelled", "failed"].includes(x.status ?? ""));
      const latest = jobs[0];
      return { rider, jobs: jobs.length, latest };
    }).sort((a, b) => b.jobs - a.jobs);
  }, [r, d]);

  const zoneCounts = useMemo(() => {
    const m = new Map<string, number>();
    d.filter((x) => !["delivered", "cancelled", "failed"].includes(x.status ?? "")).forEach((x) => {
      const rider = r.find((rr) => rr.id === x.assigned_rider_id);
      const z = rider?.zone ?? "Unassigned";
      m.set(z, (m.get(z) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [d, r]);

  const maxZ = zoneCounts[0]?.[1] || 1;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-4 w-4 text-primary" /> Live Rider Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riderRows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No active riders.</div>
          ) : (
            <ul className="space-y-2">
              {riderRows.map(({ rider, jobs, latest }) => (
                <li key={rider.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{rider.rider_name}</span>
                      <Badge variant="outline" className="text-xs">{rider.vehicle_type}</Badge>
                      {rider.zone && <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{rider.zone}</Badge>}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {latest ? <>Carrying {latest.tracking_number} → {latest.recipient_address}</> : "Idle — awaiting dispatch"}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge>{jobs} live</Badge>
                    {latest && <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{fmtRel(latest.created_at)}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" /> Active Load by Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zoneCounts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No active load.</div>
          ) : (
            <ul className="space-y-3">
              {zoneCounts.map(([z, n]) => (
                <li key={z}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{z}</span><span className="text-muted-foreground">{n}</span>
                  </div>
                  <Progress value={(n / maxZ) * 100} className="h-1.5" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTrackingPanel;
