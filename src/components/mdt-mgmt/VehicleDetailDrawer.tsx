import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Fuel, Gauge, Wrench, MapPin, FileText, Clock, ShieldAlert, Users } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { gpsStaleness } from "./helpers";

interface Props {
  vehicle: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const VehicleDetailDrawer = ({ vehicle, open, onOpenChange }: Props) => {
  const [audit, setAudit] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [gpsTrail, setGpsTrail] = useState<any[]>([]);
  const [shift, setShift] = useState<any | null>(null);

  useEffect(() => {
    if (!vehicle?.id) return;
    (async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [a, i, c, m, s] = await Promise.all([
        supabase
          .from("audit_trail")
          .select("*")
          .or(`record_id.eq.${vehicle.id},module.eq.mdt`)
          .order("timestamp", { ascending: false })
          .limit(40),
        supabase
          .from("mobile_incidents")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
        supabase.from("crew_members").select("*").eq("unit_id", vehicle.id),
        supabase
          .from("mdt_messages")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("shift_logs")
          .select("*")
          .gte("shift_start", since)
          .order("shift_start", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setAudit(a.data || []);
      setIncidents(i.data || []);
      setCrew(c.data || []);
      setMessages(m.data || []);
      setShift(s.data);
      // Synthesize GPS trail from last known + messages (no history table yet)
      const trail = (m.data || [])
        .filter((msg: any) => msg.message?.includes("@"))
        .slice(0, 20);
      setGpsTrail(trail);
    })();
  }, [vehicle?.id]);

  if (!vehicle) return null;
  const stale = gpsStaleness(vehicle.last_gps_update);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {vehicle.vehicle_id}
            <Badge variant="outline">{vehicle.registration_number}</Badge>
            <Badge>{vehicle.status?.replace("_", " ").toUpperCase()}</Badge>
          </SheetTitle>
        </SheetHeader>

        {/* Health Strip */}
        <Card className="p-3 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Stat icon={Fuel} label="Fuel" value={`${vehicle.fuel_level ?? "—"}%`} />
          <Stat icon={Gauge} label="Odometer" value={`${vehicle.mileage?.toLocaleString() ?? "—"} km`} />
          <Stat
            icon={MapPin}
            label="GPS"
            value={stale.label}
            tone={stale.tone === "red" ? "danger" : stale.tone === "amber" ? "warn" : "ok"}
          />
          <Stat icon={Wrench} label="Region" value={vehicle.region || "—"} />
        </Card>

        <Tabs defaultValue="incidents" className="mt-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="replay">GPS Replay</TabsTrigger>
            <TabsTrigger value="shift">Shift</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="mt-3">
            {incidents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No incidents (24h)</p>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {incidents.map((i) => (
                    <Card key={i.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{i.incident_number}</p>
                          <p className="text-xs text-muted-foreground">{i.incident_type}</p>
                        </div>
                        <Badge variant={i.priority === "critical" ? "destructive" : "outline"}>
                          {i.priority}
                        </Badge>
                      </div>
                      <p className="text-xs mt-2">{i.description}</p>
                      <Button size="sm" variant="outline" className="mt-2 w-full gap-1">
                        <ShieldAlert className="w-3 h-3" /> Escalate to Incident Command
                      </Button>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-3">
            <ScrollArea className="h-96">
              {audit.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No audit entries</p>
              ) : (
                <div className="space-y-2">
                  {audit.map((e) => (
                    <div key={e.id} className="text-xs border-l-2 border-primary/40 pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{e.action}</span>
                        <span className="text-muted-foreground">· {e.module}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(e.timestamp), "PPp")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="crew" className="mt-3">
            {crew.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No crew assigned</p>
            ) : (
              <div className="space-y-2">
                {crew.map((c) => (
                  <Card key={c.id} className="p-3 flex items-center gap-3">
                    <Users className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.role} · {c.mobile_number || "no number"}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="replay" className="mt-3">
            <ScrollArea className="h-96">
              {gpsTrail.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No GPS log entries yet. (Live trail is captured each time the unit changes status.)
                </p>
              ) : (
                <div className="space-y-2">
                  {gpsTrail.map((g, idx) => (
                    <div key={g.id} className="text-xs flex items-center gap-2 border-l-2 border-primary/40 pl-3 py-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(g.created_at), { addSuffix: true })}
                      </span>
                      <span className="ml-auto font-mono text-[10px]">{g.message?.split("@")[1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="shift" className="mt-3">
            {!shift ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No active shift roster</p>
            ) : (
              <Card className="p-3 text-xs space-y-1">
                <p>
                  <strong>Shift:</strong> {shift.shift_id}
                </p>
                <p>
                  <strong>Started:</strong> {format(new Date(shift.shift_start), "PPp")}
                </p>
                <p>
                  <strong>Dispatches:</strong> {shift.dispatches_made || 0} ·{" "}
                  <strong>SLA breaches:</strong> {shift.sla_breaches || 0}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: any;
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn" | "danger";
}) => {
  const tones: Record<string, string> = {
    default: "text-foreground",
    ok: "text-emerald-500",
    warn: "text-amber-500",
    danger: "text-red-500",
  };
  return (
    <div>
      <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <p className={`text-sm font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
};

export default VehicleDetailDrawer;
