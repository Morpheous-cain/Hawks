import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Bell, Navigation, Activity, Radio, Camera,
  Phone, MapPin, Shield, Truck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * LiveOpsCommandPanel — replaces the hardcoded incident/patrol/alarm
 * sections of ControlRoomDashboard with real Supabase data + realtime.
 * Buttons are wired to live destinations.
 */
type Row = Record<string, any>;

const rel = (ts?: string) =>
  ts ? formatDistanceToNow(new Date(ts), { addSuffix: true }) : "—";

const sevColor = (s?: string) => {
  if (s === "critical") return "bg-alert-critical text-white";
  if (s === "high") return "bg-alert-caution text-black";
  if (s === "medium") return "bg-muted";
  return "bg-muted";
};

const statusTone = (s?: string) => {
  if (["resolved", "closed", "verified", "completed"].includes(s ?? "")) return "bg-alert-normal";
  if (["responding", "en_route", "in_progress", "dispatched", "arrived", "acknowledged"].includes(s ?? ""))
    return "bg-alert-caution";
  if (["active", "open", "new", "delayed"].includes(s ?? "")) return "bg-alert-critical";
  return "bg-muted";
};

export const LiveOpsCommandPanel = () => {
  const [incidents, setIncidents] = useState<Row[]>([]);
  const [patrols, setPatrols] = useState<Row[]>([]);
  const [alarms, setAlarms] = useState<Row[]>([]);
  const [sos, setSos] = useState<Row[]>([]);
  const [mdt, setMdt] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const [i, p, a, s, m] = await Promise.all([
      supabase
        .from("incidents")
        .select("id, incident_number, title, incident_type, severity, status, location, occurred_at, sites(site_name), clients(legal_name)")
        .order("occurred_at", { ascending: false })
        .limit(8),
      supabase
        .from("mobile_patrols")
        .select("id, patrol_id, site_name, route_name, status, priority, start_time, vehicles(call_sign), staff:officer_id(full_name)")
        .order("start_time", { ascending: false })
        .limit(8),
      supabase
        .from("alarm_activations")
        .select("id, alarm_number, alarm_type, location, priority, status, triggered_at, vehicles:assigned_vehicle_id(call_sign)")
        .order("triggered_at", { ascending: false })
        .limit(8),
      supabase
        .from("sos_alerts")
        .select("id, alert_number, status, triggered_at, vehicles(call_sign), staff:officer_id(full_name)")
        .order("triggered_at", { ascending: false })
        .limit(6),
      supabase
        .from("mdt_messages")
        .select("id, message, message_type, priority, created_at, vehicles(call_sign)")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    setIncidents(i.data ?? []);
    setPatrols(p.data ?? []);
    setAlarms(a.data ?? []);
    setSos(s.data ?? []);
    setMdt(m.data ?? []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("live-ops-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alarm_activations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "mobile_patrols" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "mdt_messages" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const platformBase = (() => {
    const role = typeof window !== "undefined"
      ? sessionStorage.getItem("selected_management_role") : null;
    const map: Record<string, string> = {
      ceo: "ceo", coo: "coo", gm: "gm", control: "control-room",
      ops_manager: "ops-manager", system_admin: "system-admin",
    };
    return `/platform/${map[role ?? ""] ?? "control-room"}`;
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Tabs defaultValue="incidents" className="space-y-4">
          <TabsList className="bg-card">
            <TabsTrigger value="incidents">Live Incidents</TabsTrigger>
            <TabsTrigger value="patrols">Patrols</TabsTrigger>
            <TabsTrigger value="alarms">Alarms & Response</TabsTrigger>
            <TabsTrigger value="sos">SOS</TabsTrigger>
          </TabsList>

          {/* ---------------- INCIDENTS ---------------- */}
          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Active Incidents</span>
                  <Badge variant="outline">{incidents.filter(x => x.status !== "resolved" && x.status !== "closed").length} Open</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incidents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No incidents on file. Click "New Incident" above to log one.</p>
                )}
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">
                          {inc.incident_number} – {inc.sites?.site_name ?? inc.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inc.title} · {inc.incident_type} · {rel(inc.occurred_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={sevColor(inc.severity)}>{inc.severity}</Badge>
                        <Badge className={statusTone(inc.status)}>{inc.status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`${platformBase}/m/incidents`}>Open in Manager</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`${platformBase}/m/cctv`}><Camera className="w-3 h-3 mr-1" /> CCTV</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- PATROLS ---------------- */}
          <TabsContent value="patrols" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Navigation className="w-5 h-5" /> Active Patrols</span>
                  <Badge variant="outline">{patrols.filter(x => x.status === "in_progress").length} In Progress</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patrols.length === 0 && (
                  <p className="text-sm text-muted-foreground">No patrols logged yet.</p>
                )}
                {patrols.map((pt) => (
                  <div key={pt.id} className="p-3 rounded-lg border bg-muted/40 border-primary/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{pt.patrol_id} – {pt.site_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pt.vehicles?.call_sign ?? "—"} · {pt.staff?.full_name ?? "Unassigned"} · {pt.route_name ?? "ad-hoc"}
                        </p>
                      </div>
                      <Badge className={statusTone(pt.status)}>{pt.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Started {rel(pt.start_time)}</p>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`${platformBase}/m/gps-patrol`}><MapPin className="w-3 h-3 mr-1" /> Track</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`${platformBase}/m/comms`}><Phone className="w-3 h-3 mr-1" /> Call</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- ALARMS ---------------- */}
          <TabsContent value="alarms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Bell className="w-5 h-5" /> Alarm Events</span>
                  <Badge variant="outline">{alarms.filter(x => x.status === "active").length} Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alarms.length === 0 && (
                  <p className="text-sm text-muted-foreground">No alarms triggered.</p>
                )}
                {alarms.map((al) => (
                  <div key={al.id} className="p-3 bg-muted/50 rounded-lg border border-primary/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{al.alarm_number} – {al.location}</p>
                        <p className="text-xs text-muted-foreground">{al.alarm_type} · {rel(al.triggered_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={sevColor(al.priority)}>{al.priority}</Badge>
                        <Badge className={statusTone(al.status)}>{al.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Unit: {al.vehicles?.call_sign ?? "Unassigned"}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`${platformBase}/m/alarms`}>Open Alarm</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`${platformBase}/m/mdt`}><Truck className="w-3 h-3 mr-1" /> Dispatch</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- SOS ---------------- */}
          <TabsContent value="sos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Shield className="w-5 h-5 text-alert-critical" /> SOS Alerts</span>
                  <Badge variant="outline">{sos.filter(x => x.status === "active").length} Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sos.length === 0 && (
                  <p className="text-sm text-muted-foreground">No SOS signals received.</p>
                )}
                {sos.map((s) => (
                  <div key={s.id} className={`p-3 rounded-lg border ${s.status === "active" ? "bg-alert-critical/10 border-alert-critical/40" : "bg-muted/40 border-primary/20"}`}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm">{s.alert_number}</p>
                      <Badge className={statusTone(s.status)}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.staff?.full_name ?? "—"} · {s.vehicles?.call_sign ?? "—"} · {rel(s.triggered_at)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------------- RIGHT SIDEBAR (Activity / MDT) ---------------- */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ...incidents.slice(0, 3).map(x => ({ ts: x.occurred_at, text: `Incident ${x.incident_number} – ${x.title}`, kind: "incident" })),
              ...alarms.slice(0, 3).map(x => ({ ts: x.triggered_at, text: `Alarm ${x.alarm_number} – ${x.alarm_type}`, kind: "alarm" })),
              ...patrols.slice(0, 3).map(x => ({ ts: x.start_time, text: `Patrol ${x.patrol_id} – ${x.site_name}`, kind: "patrol" })),
              ...sos.slice(0, 2).map(x => ({ ts: x.triggered_at, text: `SOS ${x.alert_number}`, kind: "sos" })),
            ]
              .filter(x => x.ts)
              .sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
              .slice(0, 8)
              .map((it, i) => (
                <div key={i} className="text-xs p-2 bg-muted/30 rounded border-l-2 border-primary/50">
                  <span className="text-primary font-semibold">{rel(it.ts)}</span>
                  <span className="text-muted-foreground ml-2">{it.text}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="w-4 h-4" /> MDT / Radio Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mdt.length === 0 && (
              <p className="text-xs text-muted-foreground">No radio traffic.</p>
            )}
            {mdt.map((m) => (
              <div key={m.id} className="text-xs p-2 bg-muted/30 rounded">
                <p className="font-semibold">{m.vehicles?.call_sign ?? "Control"}: {m.message}</p>
                <p className="text-muted-foreground">{m.message_type} · {rel(m.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveOpsCommandPanel;
