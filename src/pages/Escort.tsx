import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Car, Shield, Navigation, Clock, Users, AlertTriangle, MapPin, Radio, Activity, Briefcase, FileText, Phone, Crown, Route as RouteIcon, ShieldAlert, Plane, Building2, Search, Filter, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { EscortCreateDialog } from "@/components/escort/EscortCreateDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/utils/exportData";

interface EscortMission {
  id: string;
  escort_id: string;
  client_name: string;
  route_start: string;
  route_end: string;
  vehicles_count: number;
  officers_count: number;
  priority: string;
  status: string;
  scheduled_time: string | null;
  lead_officer_name: string | null;
  notes: string | null;
  created_at: string;
}

const Escort = () => {
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [selectedConvoy, setSelectedConvoy] = useState<any>(null);
  const [missions, setMissions] = useState<EscortMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    fetchMissions();
    const channel = supabase
      .channel("escort_missions_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "escort_missions" }, fetchMissions)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMissions = async () => {
    const { data, error } = await (supabase as any)
      .from("escort_missions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setMissions((data as any) || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return missions.filter(m => {
      const matchSearch = !search ||
        m.client_name.toLowerCase().includes(search.toLowerCase()) ||
        m.escort_id.toLowerCase().includes(search.toLowerCase()) ||
        m.route_start.toLowerCase().includes(search.toLowerCase()) ||
        m.route_end.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      const matchPriority = priorityFilter === "all" || m.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [missions, search, statusFilter, priorityFilter]);

  const kpis = useMemo(() => {
    const active = missions.filter(m => ["in-transit", "standby"].includes(m.status)).length;
    const inTransit = missions.filter(m => m.status === "in-transit").length;
    const today = missions.filter(m => {
      const d = new Date(m.created_at);
      return d.toDateString() === new Date().toDateString();
    }).length;
    const critical = missions.filter(m => m.priority === "critical").length;
    return { active, inTransit, today, critical };
  }, [missions]);

  // Static reference data (operational reference - not user data)
  const activeConvoys = [
    { id: "ESC-2025-042", client: "Hon. Cabinet Secretary", route: "State House → JKIA Terminal 3", vehicles: 5, officers: 12, status: "in-transit", eta: "18 mins", lead: "LT Wanjiru A.", priority: "critical" },
    { id: "ESC-2025-041", client: "CEO - Banking Corporation", route: "Villa Rosa → Two Rivers Mall", vehicles: 3, officers: 6, status: "standby", eta: "Ready", lead: "SGT Kamau P.", priority: "caution" },
  ];

  const vipClients = [
    { name: "Hon. Cabinet Secretary - Defence", category: "Government", tier: "Diamond", missions: 47, lastEscort: "2h ago", risk: "Critical", contact: "+254 700 100 200" },
    { name: "Ambassador - EU Delegation", category: "Diplomatic", tier: "Platinum", missions: 32, lastEscort: "Yesterday", risk: "High", contact: "+254 700 100 201" },
    { name: "CEO - Equity Bank Group", category: "Corporate", tier: "Gold", missions: 28, lastEscort: "3 days ago", risk: "Medium", contact: "+254 700 100 202" },
    { name: "Hon. Senator - Nairobi", category: "Government", tier: "Platinum", missions: 19, lastEscort: "1 week ago", risk: "High", contact: "+254 700 100 203" },
    { name: "Family - Hon. Cabinet Secretary", category: "Family Protection", tier: "Gold", missions: 14, lastEscort: "5 days ago", risk: "Medium", contact: "+254 700 100 204" },
  ];

  const routeLibrary = [
    { code: "RT-001", name: "State House ↔ JKIA Terminal 3", distance: "22.4 km", avgTime: "28 min", riskZones: 3, lastUsed: "Today", status: "Primary" },
    { code: "RT-002", name: "Villa Rosa ↔ Two Rivers", distance: "14.1 km", avgTime: "19 min", riskZones: 1, lastUsed: "Today", status: "Primary" },
    { code: "RT-003", name: "Diplomatic Quarter ↔ KICC", distance: "8.7 km", avgTime: "14 min", riskZones: 2, lastUsed: "Yesterday", status: "Alt" },
    { code: "RT-004", name: "Parliament ↔ Serena Hotel", distance: "3.2 km", avgTime: "7 min", riskZones: 0, lastUsed: "2 days ago", status: "Primary" },
    { code: "RT-005", name: "JKIA ↔ Karen Country Club", distance: "26.8 km", avgTime: "42 min", riskZones: 4, lastUsed: "1 week ago", status: "Alt" },
  ];

  const threatAdvisories = [
    { id: "ADV-882", area: "Mombasa Rd corridor", level: "Elevated", reason: "Reported carjacking spike past 72h", validUntil: "26 May 23:59" },
    { id: "ADV-881", area: "Uhuru Highway / CBD", level: "High", reason: "Planned protest staging Wed 09:00", validUntil: "20 May 18:00" },
    { id: "ADV-879", area: "Eastleigh sector", level: "Moderate", reason: "Increased pickpocket reports", validUntil: "31 May" },
  ];

  const incidentLog = [
    { ts: "14:22", convoy: "ESC-2025-042", type: "Route deviation", note: "Lead diverted via Mombasa Rd due to accident at Likoni roundabout", severity: "info" },
    { ts: "13:58", convoy: "ESC-2025-042", type: "Departure", note: "Convoy departed State House on schedule", severity: "info" },
    { ts: "12:10", convoy: "ESC-2025-038", type: "Closure", note: "Mission completed, principal handed over at residence", severity: "success" },
    { ts: "11:45", convoy: "ESC-2025-040", type: "Threat flag", note: "Suspicious follow vehicle reported, units alerted, vehicle disengaged", severity: "warning" },
  ];

  const sopChecklist = [
    "Pre-mission briefing completed (T-60 min)",
    "Vehicle inspection - mechanical & ballistic",
    "Comms check on primary + backup channel",
    "Medical kit & trauma pack onboard",
    "Route recce / advance car deployed",
    "Principal PPE issued (if required)",
    "Quick Reaction Force on standby",
    "Hospital contingency confirmed",
  ];

  const statusConfig: Record<string, string> = {
    "in-transit": "bg-primary text-primary-foreground",
    "standby": "bg-alert-caution text-primary-foreground",
    "scheduled": "bg-secondary text-secondary-foreground",
    "completed": "bg-alert-normal text-primary-foreground",
    "emergency": "bg-alert-critical text-primary-foreground animate-pulse",
  };

  const exportMissions = () => {
    exportToCSV(filtered, `escort-missions-${new Date().toISOString().split("T")[0]}`);
    toast.success("Missions exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Escort & VIP Protection"
          description="VIP roster, convoy planning, route intelligence, threat advisories, comms & SOPs"
          icon={Car}
        />
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Issuing convoy recall...")}>
            <Radio className="w-4 h-4" /> Convoy Recall
          </Button>
          <EscortCreateDialog onSuccess={fetchMissions} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><Car className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Active Missions</p><p className="text-2xl font-bold">{kpis.active}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><Navigation className="w-8 h-8 text-accent" /><div><p className="text-xs text-muted-foreground">In Transit</p><p className="text-2xl font-bold">{kpis.inTransit}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><Crown className="w-8 h-8 text-alert-caution" /><div><p className="text-xs text-muted-foreground">VIPs Tracked</p><p className="text-2xl font-bold">{vipClients.length}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-alert-critical" /><div><p className="text-xs text-muted-foreground">Critical Priority</p><p className="text-2xl font-bold">{kpis.critical}</p></div></div></Card>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="operations"><Activity className="w-4 h-4 mr-1" />Live Ops</TabsTrigger>
          <TabsTrigger value="missions"><Briefcase className="w-4 h-4 mr-1" />Mission Log</TabsTrigger>
          <TabsTrigger value="vips"><Crown className="w-4 h-4 mr-1" />VIP Roster</TabsTrigger>
          <TabsTrigger value="routes"><RouteIcon className="w-4 h-4 mr-1" />Route Library</TabsTrigger>
          <TabsTrigger value="threats"><ShieldAlert className="w-4 h-4 mr-1" />Threat Advisories</TabsTrigger>
          <TabsTrigger value="comms"><Radio className="w-4 h-4 mr-1" />Comms & Sitrep</TabsTrigger>
          <TabsTrigger value="sop"><FileText className="w-4 h-4 mr-1" />SOP & Briefings</TabsTrigger>
        </TabsList>

        {/* LIVE OPS */}
        <TabsContent value="operations" className="space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Active Escort Missions</h3>
            <div className="space-y-4">
              {activeConvoys.map((convoy) => (
                <div key={convoy.id} className={`p-4 rounded-lg border-l-4 ${convoy.priority === "critical" ? "border-alert-critical bg-alert-critical/5" : "border-alert-caution bg-alert-caution/5"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{convoy.client}</h4>
                        <Badge className={statusConfig[convoy.status]}>{convoy.status.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{convoy.id}</p>
                    </div>
                    {convoy.status === "in-transit" && (
                      <Button size="sm" variant="destructive" className="gap-2" onClick={() => toast.error(`🚨 EMERGENCY ALERT for ${convoy.client}! All units notified.`)}>
                        <Shield className="w-3 h-3" />Emergency Alert
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div><p className="text-xs text-muted-foreground mb-1">Route</p><p className="text-sm font-medium">{convoy.route}</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Lead Officer</p><p className="text-sm">{convoy.lead}</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Convoy</p><p className="text-sm">{convoy.vehicles} veh · {convoy.officers} off</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">ETA</p><p className="text-sm font-bold">{convoy.eta}</p></div>
                  </div>
                  {convoy.status === "in-transit" && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedConvoy(convoy); setRouteDialogOpen(true); }}>View Route</Button>
                      <Button size="sm" variant="outline" onClick={() => toast.success(`Contacting ${convoy.lead}...`)}>Contact Lead</Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info(`Traffic advisory pulled for: ${convoy.route}`)}>Traffic Advisory</Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info("QRF dispatched to shadow convoy")}>Dispatch QRF</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Live Route Tracking</h3>
            <div className="relative w-full h-[360px] bg-muted/30 rounded-lg overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <defs><pattern id="escort-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" /></pattern></defs>
                <rect width="100%" height="100%" fill="url(#escort-grid)" />
              </svg>
              <svg className="absolute inset-0 w-full h-full">
                <path d="M 100 200 L 200 180 L 350 170 L 500 160 L 650 150" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeDasharray="10,5" className="animate-pulse" />
              </svg>
              <div className="absolute" style={{ left: "35%", top: "43%", transform: "translate(-50%, -50%)" }}>
                <div className="w-6 h-6 rounded-full bg-primary shadow-glow animate-pulse flex items-center justify-center"><Car className="w-4 h-4 text-primary-foreground" /></div>
              </div>
              <div className="absolute" style={{ left: "10%", top: "50%" }}><div className="w-4 h-4 rounded-full bg-alert-normal" /><p className="text-xs mt-1">Start</p></div>
              <div className="absolute" style={{ left: "80%", top: "37%" }}><div className="w-4 h-4 rounded-full bg-alert-critical" /><p className="text-xs mt-1">Destination</p></div>
            </div>
          </Card>
        </TabsContent>

        {/* MISSION LOG */}
        <TabsContent value="missions" className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search client, ID, route..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="caution">Caution</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2" onClick={exportMissions}><Download className="w-4 h-4" />Export</Button>
            </div>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading missions...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No missions match current filters.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((m) => (
                  <div key={m.id} className="p-3 border rounded-lg flex flex-wrap items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{m.escort_id}</span><Badge className={statusConfig[m.status] || ""}>{m.status}</Badge>{m.priority === "critical" && <Badge variant="destructive">CRITICAL</Badge>}</div>
                      <p className="font-medium mt-1">{m.client_name}</p>
                      <p className="text-xs text-muted-foreground">{m.route_start} → {m.route_end}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{m.vehicles_count} veh · {m.officers_count} off</p>
                      <p>{m.lead_officer_name || "Unassigned"}</p>
                      <p>{m.scheduled_time ? new Date(m.scheduled_time).toLocaleString() : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* VIP ROSTER */}
        <TabsContent value="vips" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Protected Principal Roster</h3>
            <div className="space-y-3">
              {vipClients.map((v) => (
                <div key={v.name} className="p-3 border rounded-lg flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Crown className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.category} · {v.missions} missions · last {v.lastEscort}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{v.tier}</Badge>
                    <Badge className={v.risk === "Critical" ? "bg-alert-critical text-primary-foreground" : v.risk === "High" ? "bg-alert-caution text-primary-foreground" : "bg-secondary text-secondary-foreground"}>{v.risk}</Badge>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info(`Calling ${v.contact}`)}><Phone className="w-3 h-3" />Liaison</Button>
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Opening profile for ${v.name}`)}>Profile</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ROUTE LIBRARY */}
        <TabsContent value="routes" className="space-y-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Pre-planned Route Library</h3>
              <Button size="sm" variant="outline" onClick={() => toast.info("Route planner opening...")}>+ New Route</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {routeLibrary.map(r => (
                <div key={r.code} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.code}</p>
                    </div>
                    <Badge variant={r.status === "Primary" ? "default" : "outline"}>{r.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Distance</p><p className="font-medium">{r.distance}</p></div>
                    <div><p className="text-muted-foreground">Avg Time</p><p className="font-medium">{r.avgTime}</p></div>
                    <div><p className="text-muted-foreground">Risk Zones</p><p className={`font-medium ${r.riskZones > 2 ? "text-alert-critical" : r.riskZones > 0 ? "text-alert-caution" : "text-alert-normal"}`}>{r.riskZones}</p></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info(`Loading recce for ${r.code}`)}>Recce</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success(`${r.code} selected as primary`)}>Use</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* THREAT ADVISORIES */}
        <TabsContent value="threats" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Active Threat Advisories Affecting VIP Movements</h3>
            <div className="space-y-3">
              {threatAdvisories.map(t => (
                <div key={t.id} className="p-3 border-l-4 border-alert-caution bg-alert-caution/5 rounded">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={t.level === "High" ? "bg-alert-critical text-primary-foreground" : "bg-alert-caution text-primary-foreground"}>{t.level}</Badge>
                        <span className="font-medium">{t.area}</span>
                        <span className="text-xs text-muted-foreground font-mono">{t.id}</span>
                      </div>
                      <p className="text-sm">{t.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">Valid until: {t.validUntil}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toast.info(`Re-routing affected missions away from ${t.area}`)}>Reroute</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Risk Heat Index</h3>
            <div className="space-y-2">
              {[{ z: "CBD / Uhuru Highway", v: 78 }, { z: "Mombasa Road corridor", v: 62 }, { z: "Eastleigh sector", v: 48 }, { z: "Karen / Langata", v: 22 }, { z: "Westlands / Diplomatic Q.", v: 18 }].map(z => (
                <div key={z.z}>
                  <div className="flex justify-between text-xs mb-1"><span>{z.z}</span><span className="font-medium">{z.v}</span></div>
                  <Progress value={z.v} className="h-2" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* COMMS & SITREP */}
        <TabsContent value="comms" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 md:col-span-2">
              <h3 className="font-semibold mb-4">Live Incident & Comms Log</h3>
              <div className="space-y-2">
                {incidentLog.map((e, i) => (
                  <div key={i} className="flex gap-3 p-2 border-l-2 border-primary/40 bg-muted/30 rounded-r">
                    <span className="text-xs font-mono text-muted-foreground w-12">{e.ts}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{e.convoy}</Badge>
                        <span className="text-xs font-medium">{e.type}</span>
                      </div>
                      <p className="text-sm mt-1">{e.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Quick Comms</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.success("Broadcast sent on CH-1")}><Radio className="w-4 h-4" />Broadcast all convoys</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.success("Sitrep requested from leads")}><FileText className="w-4 h-4" />Request Sitrep</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.info("Linking to Control Room MDT")}><MapPin className="w-4 h-4" />Sync to Control Room</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.info("Hospital network on standby")}><Building2 className="w-4 h-4" />Alert Hospital Net</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.info("JKIA tower notified")}><Plane className="w-4 h-4" />Notify JKIA Tower</Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* SOP & BRIEFINGS */}
        <TabsContent value="sop" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Pre-Mission SOP Checklist</h3>
              <div className="space-y-2">
                {sopChecklist.map((s, i) => (
                  <label key={i} className="flex items-start gap-2 p-2 hover:bg-muted/40 rounded cursor-pointer">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
              <Button className="w-full mt-3" onClick={() => toast.success("Pre-mission checklist signed off")}>Sign Off</Button>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Scheduled Escorts — Next 24h</h3>
              <div className="space-y-3">
                {[
                  { time: "16:00", client: "Hon. Senator", route: "Parliament → Serena Hotel", vehicles: 4 },
                  { time: "18:30", client: "CEO - Oil Company", route: "JKIA → Villa Rosa", vehicles: 3 },
                  { time: "20:00", client: "Ambassador", route: "State House → Diplomatic Quarter", vehicles: 5 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{s.time}</Badge>
                      <div><p className="font-medium text-sm">{s.client}</p><p className="text-xs text-muted-foreground">{s.route}</p></div>
                    </div>
                    <span className="text-xs">{s.vehicles} veh</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Convoy Composition Templates</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { name: "Diamond (Head of State)", veh: 7, off: 18, desc: "Lead recce + 2 PSD + principal + 2 follow + ambulance + comms" },
                { name: "Platinum (Diplomat / Minister)", veh: 5, off: 12, desc: "Lead + PSD + principal + follow + medic" },
                { name: "Gold (Corporate VIP)", veh: 3, off: 6, desc: "Lead + principal + follow" },
              ].map(c => (
                <div key={c.name} className="p-3 border rounded">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{c.veh} vehicles · {c.off} officers</p>
                  <p className="text-xs">{c.desc}</p>
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => toast.success(`${c.name} template loaded`)}>Use Template</Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Route Details - {selectedConvoy?.id}</DialogTitle></DialogHeader>
          {selectedConvoy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Client</p><p className="font-medium">{selectedConvoy.client}</p></div>
                <div><p className="text-muted-foreground">Lead Officer</p><p className="font-medium">{selectedConvoy.lead}</p></div>
                <div><p className="text-muted-foreground">Route</p><p className="font-medium">{selectedConvoy.route}</p></div>
                <div><p className="text-muted-foreground">ETA</p><p className="font-medium">{selectedConvoy.eta}</p></div>
                <div><p className="text-muted-foreground">Vehicles</p><p className="font-medium">{selectedConvoy.vehicles}</p></div>
                <div><p className="text-muted-foreground">Officers</p><p className="font-medium">{selectedConvoy.officers}</p></div>
              </div>
              <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground"><Navigation className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Live GPS route visualization</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Escort;
