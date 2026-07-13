import { useEffect, useState, useMemo, useRef, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Truck,
  Radio,
  AlertTriangle,
  Send,
  MapPin,
  Activity,
  Clock,
  CheckCircle2,
  MessageSquare,
  Gauge,
  Navigation,
  Users,
  Zap,
  Pin,
  Map as MapIcon,
  BarChart3,
  PhoneCall,
  Paperclip,
  Target,
  Keyboard,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import ControlRoomAssignments from "@/components/control-room-mdt/ControlRoomAssignments";

import MDTLiveMap from "@/components/mdt-mgmt/MDTLiveMap";
import VehicleDetailDrawer from "@/components/mdt-mgmt/VehicleDetailDrawer";
import MDTAnalytics from "@/components/mdt-mgmt/MDTAnalytics";
import {
  dispatchTemplates,
  findNearestUnits,
  getPinned,
  gpsStaleness,
  slaStatus,
  statusGroups,
  togglePinned,
} from "@/components/mdt-mgmt/helpers";
import { useMDTKeyboard } from "@/components/mdt-mgmt/useMDTKeyboard";

import { useAudioAlerts } from "@/hooks/useAudioAlerts";
import { useMdtManagement } from "@/hooks/useMdtManagement";

const statusBadge: Record<string, string> = {
  available: "bg-emerald-600",
  on_patrol: "bg-blue-600",
  en_route: "bg-amber-600",
  on_scene: "bg-orange-600",
  break: "bg-slate-500",
  off_duty: "bg-zinc-700",
  emergency: "bg-red-600 animate-pulse",
};

const priorityClass: Record<string, string> = {
  normal: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
  critical: "bg-red-700",
};

type ChipKey = "all" | "available" | "engaged" | "emergency" | "offline";

const MDTManagement = () => {
  const { user } = useAuth();
  // ─── UI state (page-owned) ───
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState<ChipKey>("all");
  const [activeTab, setActiveTab] = useState("fleet");
  const [pinned, setPinned] = useState<string[]>(getPinned());
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [drawerVehicle, setDrawerVehicle] = useState<any | null>(null);
  const [msgText, setMsgText] = useState("");
  const [msgPriority, setMsgPriority] = useState("normal");
  const [msgType, setMsgType] = useState("dispatch");
  const [sending, setSending] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<string>("all");
  const [multiSelectIds, setMultiSelectIds] = useState<string[]>([]);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [nearestPanelAlert, setNearestPanelAlert] = useState<any | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { playAlert } = useAudioAlerts();

  // ─── Data layer (hook-owned) ───
  const { data, loading, actions } = useMdtManagement(user?.id, {
    onIncomingMessage: (msg) => {
      toast.info(`📡 New transmission`);
      if (["urgent", "critical"].includes(msg?.priority)) playAlert?.("warning");
    },
    onIncomingSos: (sosRow) => {
      toast.error(`🚨 SOS: ${sosRow.alert_number}`, { duration: 12000 });
      playAlert?.("sos");
      setNearestPanelAlert(sosRow);
    },
  });
  const { vehicles, messages, sos, patrols } = data;


  // Keyboard shortcuts
  useMDTKeyboard({
    onDispatch: () => setActiveTab("dispatch"),
    onBroadcast: () => {
      setActiveTab("dispatch");
      setTimeout(() => document.getElementById("broadcast-area")?.focus(), 50);
    },
    onSearch: () => searchRef.current?.focus(),
    onMap: () => setActiveTab("map"),
    onAnalytics: () => setActiveTab("analytics"),
  });

  // Derived KPIs
  const total = vehicles.length;
  const available = vehicles.filter((v) => v.status === "available").length;
  const engaged = vehicles.filter((v) => ["on_patrol", "en_route", "on_scene"].includes(v.status)).length;
  const emergency = vehicles.filter((v) => v.status === "emergency").length;
  const activeSos = sos.filter((s) => ["active", "responding"].includes(s.status)).length;
  const unreadFromUnits = messages.filter((m) => !m.is_read && m.message_type !== "dispatch").length;
  const activePatrols = patrols.filter((p) => p.status === "in_progress").length;

  const messagesByVehicle = useCallback(
    (vid: string) => messages.filter((m) => m.vehicle_id === vid),
    [messages]
  );
  const unreadByVehicle = (vid: string) =>
    messagesByVehicle(vid).filter((m) => !m.is_read && m.message_type !== "dispatch").length;

  const filteredVehicles = useMemo(() => {
    const s = search.toLowerCase();
    let list = vehicles.filter((v) => {
      const matchSearch =
        !s ||
        v.vehicle_id?.toLowerCase().includes(s) ||
        v.registration_number?.toLowerCase().includes(s) ||
        v.region?.toLowerCase().includes(s) ||
        v.current_assignment?.toLowerCase().includes(s);
      const matchChip =
        activeChip === "all" ||
        (statusGroups as any)[activeChip]?.includes(v.status);
      return matchSearch && matchChip;
    });
    // Pinned first
    list = [
      ...list.filter((v) => pinned.includes(v.id)),
      ...list.filter((v) => !pinned.includes(v.id)),
    ];
    return list;
  }, [vehicles, search, activeChip, pinned]);

  const handlePin = (id: string) => setPinned(togglePinned(id));

  const applyTemplate = (t: typeof dispatchTemplates[number]) => {
    setMsgText(`[${t.code}] ${t.label}`);
    setMsgPriority(t.priority);
    setMsgType(t.type);
  };

  // Thin presentation wrappers — actual logic lives in useMdtManagement.
  const sendDirect = async () => {
    setSending(true);
    const ok = await actions.sendDirect(selectedVehicle, msgText, {
      priority: msgPriority, type: msgType, attachedName,
    });
    setSending(false);
    if (ok) { setMsgText(""); setAttachedName(null); }
  };

  const broadcast = async () => {
    setSending(true);
    const ok = await actions.broadcast(broadcastChannel, msgText, msgPriority);
    setSending(false);
    if (ok) setMsgText("");
  };

  const dispatchMulti = async () => {
    setSending(true);
    const ok = await actions.dispatchMulti(multiSelectIds, msgText, msgPriority);
    setSending(false);
    if (ok) { setMultiSelectIds([]); setMsgText(""); }
  };

  const respondSos = (id: string) => actions.respondSos(id);
  const resolveSos = (id: string) => actions.resolveSos(id, window.prompt("Resolution notes:") || "");

  const regions = useMemo(
    () => [...new Set(vehicles.map((v) => v.region).filter(Boolean))],
    [vehicles]
  );

  // Nearest-unit suggestions for active panel alert
  const nearestUnits = useMemo(() => {
    if (!nearestPanelAlert?.gps_lat) return [];
    return findNearestUnits(
      Number(nearestPanelAlert.gps_lat),
      Number(nearestPanelAlert.gps_lng),
      vehicles
    );
  }, [nearestPanelAlert, vehicles]);

  const dispatchNearest = async (vehicle: any) => {
    await actions.dispatchNearest(vehicle, nearestPanelAlert);
    setNearestPanelAlert(null);
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="MDT Management Console"
        description="Live fleet oversight, dispatch, SLA, analytics — full situational awareness"
        icon={Radio}
      />

      <div className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
        <Keyboard className="w-3 h-3" /> Shortcuts: <kbd className="px-1 border rounded">D</kbd> Dispatch ·{" "}
        <kbd className="px-1 border rounded">B</kbd> Broadcast · <kbd className="px-1 border rounded">M</kbd> Map ·{" "}
        <kbd className="px-1 border rounded">A</kbd> Analytics · <kbd className="px-1 border rounded">/</kbd> Search
      </div>

      {/* DISPATCHER-ONLY CONSOLE */}
      {/* Dispatcher console */}
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Fleet" value={total} icon={Truck} tone="default" />
        <KpiCard label="Available" value={available} icon={CheckCircle2} tone="success" />
        <KpiCard label="Engaged" value={engaged} icon={Navigation} tone="info" />
        <KpiCard label="On Patrol" value={activePatrols} icon={Activity} tone="info" />
        <KpiCard label="Unread (from units)" value={unreadFromUnits} icon={MessageSquare} tone={unreadFromUnits ? "warn" : "muted"} />
        <KpiCard label="Active SOS" value={activeSos} icon={AlertTriangle} tone={activeSos ? "danger" : "muted"} />
        <KpiCard label="Emergency Units" value={emergency} icon={Zap} tone={emergency ? "danger" : "muted"} />
      </div>

      {/* Nearest-unit panel */}
      {nearestPanelAlert && nearestUnits.length > 0 && (
        <Card className="p-4 border-primary bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-bold">
              Nearest-Unit Suggestion · SOS {nearestPanelAlert.alert_number}
            </h3>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setNearestPanelAlert(null)}>
              Dismiss
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            {nearestUnits.map(({ vehicle, km, etaMin }) => (
              <Card key={vehicle.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{vehicle.vehicle_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {km.toFixed(1)} km · ETA ~{etaMin} min
                  </p>
                </div>
                <Button size="sm" onClick={() => dispatchNearest(vehicle)}>
                  Dispatch
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* SOS Strip */}
      {sos.filter((s) => s.status !== "resolved" && s.status !== "closed").length > 0 && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="font-bold text-destructive">Active SOS Alerts</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {sos
              .filter((s) => s.status !== "resolved" && s.status !== "closed")
              .map((s) => (
                <Card key={s.id} className="p-3 border-destructive/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{s.alert_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.vehicles?.vehicle_id} · {s.profiles?.full_name || "Officer"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {s.gps_lat?.toFixed(5)}, {s.gps_lng?.toFixed(5)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(s.triggered_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="destructive">{s.status.toUpperCase()}</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNearestPanelAlert(s)}
                      className="gap-1"
                    >
                      <Target className="w-3 h-3" /> Nearest
                    </Button>
                    {s.status === "active" && (
                      <Button size="sm" onClick={() => respondSos(s.id)} className="flex-1">
                        Acknowledge & Respond
                      </Button>
                    )}
                    {s.status === "responding" && (
                      <Button size="sm" variant="outline" onClick={() => resolveSos(s.id)} className="flex-1">
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>


        <TabsContent value="map" className="mt-4">
          <MDTLiveMap
            vehicles={vehicles}
            sosAlerts={sos}
            onSelectVehicle={(v) => setDrawerVehicle(v)}
            onDispatchToLocation={(loc) => {
              setMsgText(`Respond to ${loc.label || "pin"} @ ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
              setActiveTab("dispatch");
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <MDTAnalytics />
        </TabsContent>

        {/* FLEET */}
        <TabsContent value="fleet" className="mt-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <Input
                ref={searchRef}
                placeholder="Search vehicle, plate, region, assignment… (press /)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="outline" className="ml-auto">
                {filteredVehicles.length} units
              </Badge>
            </div>
            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(["all", "available", "engaged", "emergency", "offline"] as ChipKey[]).map((c) => (
                <Badge
                  key={c}
                  variant={activeChip === c ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setActiveChip(c)}
                >
                  {c}
                  {c !== "all" && (
                    <span className="ml-1 opacity-70">
                      ({vehicles.filter((v) => (statusGroups as any)[c]?.includes(v.status)).length})
                    </span>
                  )}
                </Badge>
              ))}
              {multiSelectIds.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="default" className="ml-auto gap-1">
                      <Users className="w-3 h-3" /> Convoy Dispatch ({multiSelectIds.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Multi-Unit / Convoy Dispatch</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Targets: {multiSelectIds.map((id) => vehicles.find((v) => v.id === id)?.vehicle_id).join(", ")}
                      </p>
                      <Select value={msgPriority} onValueChange={setMsgPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        rows={4}
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        placeholder="Convoy / QRF orders…"
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={dispatchMulti} disabled={sending || !msgText.trim()}>
                        Dispatch Convoy
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading fleet…</p>
            ) : filteredVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No vehicles match.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVehicles.map((v) => {
                  const unread = unreadByVehicle(v.id);
                  const lastMsg = messagesByVehicle(v.id)[0];
                  const stale = gpsStaleness(v.last_gps_update);
                  const isPinned = pinned.includes(v.id);
                  const isMulti = multiSelectIds.includes(v.id);
                  return (
                    <Card
                      key={v.id}
                      className={`p-3 hover:border-primary transition-colors ${isPinned ? "ring-1 ring-primary/40" : ""} ${isMulti ? "border-primary" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={isMulti}
                            onCheckedChange={(checked) => {
                              setMultiSelectIds((prev) =>
                                checked ? [...prev, v.id] : prev.filter((id) => id !== v.id)
                              );
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">{v.vehicle_id}</h3>
                              <Badge className={`${statusBadge[v.status] || "bg-muted"} text-white text-[10px]`}>
                                {(v.status || "").replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {v.vehicle_type} · {v.registration_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button onClick={() => handlePin(v.id)} title="Pin to top">
                            <Pin className={`w-4 h-4 ${isPinned ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          </button>
                          {unread > 0 && (
                            <Badge variant="destructive" className="text-[10px]">
                              {unread} NEW
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                        <div>
                          <span className="text-muted-foreground">Assignment:</span>
                          <p className="font-medium truncate">{v.current_assignment || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Region:</span>
                          <p className="font-medium truncate">{v.region || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">GPS:</span>
                          <p
                            className={`font-medium ${
                              stale.tone === "red"
                                ? "text-red-500"
                                : stale.tone === "amber"
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {stale.label}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fuel:</span>
                          <p className="font-medium">{v.fuel_level ?? "—"}%</p>
                        </div>
                      </div>
                      {lastMsg && (
                        <p className="text-[11px] text-muted-foreground bg-muted p-2 rounded mb-2 truncate">
                          💬 {lastMsg.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => setDrawerVehicle(v)}
                        >
                          <Activity className="w-3 h-3" /> Details
                        </Button>
                        <Dialog onOpenChange={(o) => o && setSelectedVehicle(v)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="default" className="flex-1 gap-1">
                              <Send className="w-3 h-3" /> Transmit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Transmit to {v.vehicle_id} · {v.registration_number}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              {/* Templates */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Quick templates</p>
                                <div className="flex flex-wrap gap-1">
                                  {dispatchTemplates.map((t) => (
                                    <Button
                                      key={t.code}
                                      size="sm"
                                      variant="outline"
                                      className="text-[10px] h-7"
                                      onClick={() => applyTemplate(t)}
                                    >
                                      {t.code}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Select value={msgType} onValueChange={setMsgType}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="dispatch">Dispatch Order</SelectItem>
                                    <SelectItem value="update">Update / Info</SelectItem>
                                    <SelectItem value="request">Status Request</SelectItem>
                                    <SelectItem value="status">Status Change</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select value={msgPriority} onValueChange={setMsgPriority}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Textarea
                                rows={4}
                                value={msgText}
                                onChange={(e) => setMsgText(e.target.value)}
                                placeholder="Instructions, dispatch details, or status request…"
                              />
                              <div className="flex gap-2">
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) setAttachedName(f.name);
                                    }}
                                  />
                                  <Button asChild size="sm" variant="outline" className="gap-1">
                                    <span>
                                      <Paperclip className="w-3 h-3" /> Attach
                                    </span>
                                  </Button>
                                </label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => toast.info("PTT voice channel — coming via Comms module")}
                                >
                                  <PhoneCall className="w-3 h-3" /> PTT
                                </Button>
                                {attachedName && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    📎 {attachedName}
                                  </Badge>
                                )}
                              </div>
                              <div className="border-t pt-3">
                                <p className="text-xs text-muted-foreground mb-2">Recent thread</p>
                                <ScrollArea className="h-48 border rounded p-2">
                                  {messagesByVehicle(v.id).length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                      No prior transmissions
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {messagesByVehicle(v.id)
                                        .slice(0, 25)
                                        .map((m) => {
                                          const ack = !!m.read_at;
                                          const sla = slaStatus(m.created_at, m.priority || "normal", ack);
                                          return (
                                            <div key={m.id} className="text-[11px] border-l-2 pl-2 border-primary/40">
                                              <div className="flex justify-between text-muted-foreground items-center gap-2">
                                                <span className="flex items-center gap-1 flex-wrap">
                                                  {(m.message_type || "").toUpperCase()} ·
                                                  <Badge className={`${priorityClass[m.priority] || "bg-blue-500"} text-[9px]`}>
                                                    {(m.priority || "").toUpperCase()}
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-[9px] ${
                                                      sla.tone === "ok"
                                                        ? "border-emerald-500 text-emerald-500"
                                                        : sla.tone === "warn"
                                                        ? "border-amber-500 text-amber-500"
                                                        : "border-red-500 text-red-500"
                                                    }`}
                                                  >
                                                    SLA {sla.label}
                                                  </Badge>
                                                  {ack && (
                                                    <Badge variant="secondary" className="text-[9px]">
                                                      ✓ ACK
                                                    </Badge>
                                                  )}
                                                </span>
                                                <span>{format(new Date(m.created_at), "HH:mm")}</span>
                                              </div>
                                              <p>{m.message}</p>
                                              {m.reply && (
                                                <p className="text-muted-foreground italic mt-1">↳ {m.reply}</p>
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={sendDirect} disabled={sending || !msgText.trim()} className="gap-2">
                                <Send className="w-4 h-4" /> {sending ? "Sending…" : "Transmit"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* DISPATCH */}
        <TabsContent value="dispatch" className="mt-4 space-y-4">
          <ControlRoomAssignments vehicles={vehicles} />
          <Card className="p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Channel Broadcast
            </h3>
            <div className="flex gap-2 mb-2 flex-wrap">
              <Select value={broadcastChannel} onValueChange={setBroadcastChannel}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="qrf">QRF / Response Only</SelectItem>
                  <SelectItem value="supervisors">Supervisors</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r as string}>Region: {r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={msgPriority} onValueChange={setMsgPriority}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                id="broadcast-area"
                rows={2}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Message to channel…"
                className="flex-1 min-w-[200px]"
              />
            </div>
            <Button onClick={broadcast} disabled={sending || !msgText.trim()} className="gap-2">
              <Radio className="w-4 h-4" /> Broadcast
            </Button>
          </Card>
        </TabsContent>

        {/* MESSAGES */}
        <TabsContent value="messages" className="mt-4">
          <Card className="p-4">
            <h3 className="font-bold mb-3">Live Message Log (last 200)</h3>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-2">
                {messages.map((m) => {
                  const v = vehicles.find((x) => x.id === m.vehicle_id);
                  const ack = !!m.read_at;
                  const sla = slaStatus(m.created_at, m.priority || "normal", ack);
                  return (
                    <div key={m.id} className="border rounded p-2 text-sm">
                      <div className="flex justify-between items-start mb-1 gap-2 flex-wrap">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{v?.vehicle_id || "Unit"}</Badge>
                          <Badge className={`${priorityClass[m.priority] || "bg-blue-500"} text-[10px]`}>
                            {(m.priority || "normal").toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">{(m.message_type || "").toUpperCase()}</Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              sla.tone === "ok"
                                ? "border-emerald-500 text-emerald-500"
                                : sla.tone === "warn"
                                ? "border-amber-500 text-amber-500"
                                : "border-red-500 text-red-500"
                            }`}
                          >
                            SLA {sla.label}
                          </Badge>
                          {ack ? (
                            <Badge variant="secondary" className="text-[10px]">✓ ACK</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">UNREAD</Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(m.created_at), "MMM d HH:mm")}
                        </span>
                      </div>
                      <p>{m.message}</p>
                      {m.reply && <p className="text-muted-foreground italic mt-1">↳ {m.reply}</p>}
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No transmissions yet</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> SOS History
            </h3>
            <ScrollArea className="h-[55vh]">
              <div className="space-y-2">
                {sos.map((s) => (
                  <div key={s.id} className="border rounded p-2 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{s.alert_number}</span>
                      <Badge variant={s.status === "resolved" ? "secondary" : "destructive"} className="text-[10px]">
                        {s.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.vehicles?.vehicle_id} · {s.profiles?.full_name || "—"} ·{" "}
                      {format(new Date(s.triggered_at), "MMM d HH:mm")}
                    </p>
                    {s.resolution_notes && <p className="text-xs italic mt-1">{s.resolution_notes}</p>}
                  </div>
                ))}
                {sos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No SOS records</p>}
              </div>
            </ScrollArea>
          </Card>
          <Card className="p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Patrol History
            </h3>
            <ScrollArea className="h-[55vh]">
              <div className="space-y-2">
                {patrols.map((p) => (
                  <div key={p.id} className="border rounded p-2 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{p.patrol_id}</span>
                      <Badge className={`text-[10px] ${p.status === "completed" ? "bg-emerald-600" : "bg-blue-600"}`}>
                        {p.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.site_name} · {p.client_name || "—"} · {p.patrol_type}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Started: {p.actual_start ? format(new Date(p.actual_start), "MMM d HH:mm") : "—"}
                      {p.actual_end && ` · Ended: ${format(new Date(p.actual_end), "HH:mm")}`}
                    </p>
                  </div>
                ))}
                {patrols.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No patrols recorded</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
      


      {/* Mobile Response Network - ALPHA QRF Teams */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
            Mobile Response Network — ALPHA QRF Teams
          </h2>
          <Badge variant="outline" className="text-amber-400 border-amber-400/30">LIVE</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Quick Reaction Force — immediate response capability</p>
        {/* QRF officers are shown in the main MDT officer list above */}
      </div>

        <VehicleDetailDrawer
        vehicle={drawerVehicle}
        open={!!drawerVehicle}
        onOpenChange={(o) => !o && setDrawerVehicle(null)}
      />
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: "default" | "success" | "info" | "warn" | "danger" | "muted";
}) => {
  const toneClass = {
    default: "text-foreground",
    success: "text-emerald-500",
    info: "text-blue-500",
    warn: "text-amber-500",
    danger: "text-destructive",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${toneClass}`} />
      </div>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </Card>
  );
};

export default MDTManagement;
