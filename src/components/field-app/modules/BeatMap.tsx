import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Crosshair, Footprints } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Pos { lat: number; lng: number; ts: number; }

export const BeatMap = () => {
  const [pos, setPos] = useState<Pos | null>(null);
  const [trail, setTrail] = useState<Pos[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("client_sites").select("id,site_name,client_name,gps_lat,gps_lng,geofence_radius").limit(20);
      setSites(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const np = { lat: p.coords.latitude, lng: p.coords.longitude, ts: Date.now() };
        setPos(np);
        setTrail((t) => [...t.slice(-49), np]);
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 5_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crosshair className="h-4 w-4 text-primary" /> Beat Map — Live Position
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border/40 bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Latitude</p>
              <p className="font-mono text-sm">{pos ? pos.lat.toFixed(6) : "—"}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Longitude</p>
              <p className="font-mono text-sm">{pos ? pos.lng.toFixed(6) : "—"}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Trail Points</p>
              <p className="font-mono text-sm">{trail.length}</p>
            </div>
          </div>
          <div className="aspect-video rounded-md border border-border/40 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-xs text-muted-foreground flex items-center justify-center">
            <div className="text-center space-y-1">
              <Footprints className="mx-auto h-6 w-6 text-primary" />
              <p>Live beat path captured · GPS streaming</p>
              <p className="text-[10px]">{pos ? `Last fix ${new Date(pos.ts).toLocaleTimeString()}` : "Awaiting GPS lock…"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-emerald-500" /> Geofences in Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sites.length === 0 && <p className="text-xs text-muted-foreground">No sites configured.</p>}
          {sites.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.site_name ?? s.client_name ?? "Site"}</p>
                <p className="text-[10px] text-muted-foreground">Radius {s.geofence_radius ?? "—"}m</p>
              </div>
              <Badge variant="outline" className="text-[10px]">Geofence</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BeatMap;
