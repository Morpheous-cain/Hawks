import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, Clock, MapPin,
  Package, Radio, Truck, Users, Zap, TrendingUp, Timer, Navigation,
  RefreshCw, Download, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CourierEntryDialog } from "@/components/courier/CourierEntryDialog";

type Delivery = {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_address: string;
  priority: string | null;
  status: string | null;
  assigned_rider_id: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cod_amount: number | null;
  created_at: string;
};

type Rider = {
  id: string;
  rider_id: string;
  rider_name: string;
  vehicle_type: string;
  zone: string | null;
  status: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  assigned: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  picked_up: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  in_transit: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  delivered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const PRIO_COLORS: Record<string, string> = {
  urgent: "bg-rose-500 text-white",
  critical: "bg-rose-600 text-white",
  high: "bg-orange-500 text-white",
  normal: "bg-muted text-muted-foreground",
  low: "bg-muted text-muted-foreground",
};

const NEXT_STATUS: Record<string, string> = {
  pending: "assigned",
  assigned: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

const formatRel = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

type Window = "today" | "7d" | "all";
const sinceDate = (w: Window) => {
  if (w === "all") return null;
  const d = new Date();
  if (w === "today") d.setHours(0, 0, 0, 0);
  else d.setDate(d.getDate() - 7);
  return d;
};

const CourierCockpit = () => {
  const { platformId = "courier-manager" } = useParams();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [windowSel, setWindowSel] = useState<Window>("today");
  const [acting, setActing] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setRefreshing(true);
    const [d, r] = await Promise.all([
      supabase
        .from("courier_deliveries")
        .select("id,tracking_number,recipient_name,recipient_address,priority,status,assigned_rider_id,picked_up_at,delivered_at,cod_amount,created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("courier_riders")
        .select("id,rider_id,rider_name,vehicle_type,zone,status")
        .order("rider_name"),
    ]);
    if (d.data) setDeliveries(d.data as Delivery[]);
    if (r.data) setRiders(r.data as Rider[]);
    setLoading(false);
    setRefreshing(false);
    setLastSync(new Date());
  };

  useEffect(() => {
    load(true);
    const ch = supabase
      .channel("courier-cockpit")
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_deliveries" }, () => load(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_riders" }, () => load(true))
      .subscribe();
    const t = setInterval(() => load(true), 30000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Window-scoped deliveries
  const scoped = useMemo(() => {
    const since = sinceDate(windowSel);
    if (!since) return deliveries;
    return deliveries.filter((d) => new Date(d.created_at) >= since);
  }, [deliveries, windowSel]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isToday = (iso: string) => new Date(iso).getTime() >= today.getTime();

    const active = scoped.filter((d) => !["delivered", "cancelled", "failed"].includes(d.status ?? ""));
    const pending = scoped.filter((d) => d.status === "pending");
    const inTransit = scoped.filter((d) => ["picked_up", "in_transit", "assigned"].includes(d.status ?? ""));
    const deliveredToday = scoped.filter((d) => d.status === "delivered" && d.delivered_at && isToday(d.delivered_at));
    const failedToday = scoped.filter((d) => d.status === "failed" && isToday(d.created_at));
    const urgent = active.filter((d) => ["urgent", "critical", "high"].includes(d.priority ?? ""));

    const totalToday = scoped.filter((d) => isToday(d.created_at)).length;
    const onTime = totalToday ? Math.round((deliveredToday.length / Math.max(totalToday, 1)) * 100) : 0;

    const activeRiders = riders.filter((r) => r.status === "active");
    const utilised = new Set(active.map((d) => d.assigned_rider_id).filter(Boolean)).size;
    const utilPct = activeRiders.length ? Math.round((utilised / activeRiders.length) * 100) : 0;

    const codOutstanding = active.reduce((s, d) => s + Number(d.cod_amount ?? 0), 0);
    const codCollectedToday = deliveredToday.reduce((s, d) => s + Number(d.cod_amount ?? 0), 0);

    const deliveredAll = scoped.filter((d) => d.status === "delivered" && d.delivered_at && d.picked_up_at);
    const avgMin = deliveredAll.length
      ? Math.round(
          deliveredAll.reduce((s, d) =>
            s + (new Date(d.delivered_at!).getTime() - new Date(d.picked_up_at!).getTime()) / 60000, 0,
          ) / deliveredAll.length,
        )
      : 0;

    // Zone breakdown
    const zoneMap = new Map<string, number>();
    active.forEach((d) => {
      const r = riders.find((rr) => rr.id === d.assigned_rider_id);
      const zone = r?.zone ?? "Unassigned";
      zoneMap.set(zone, (zoneMap.get(zone) ?? 0) + 1);
    });
    const zones = [...zoneMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

    return {
      active, pending, inTransit, deliveredToday, failedToday, urgent,
      totalToday, onTime, activeRiders, utilised, utilPct,
      codOutstanding, codCollectedToday, avgMin, zones,
    };
  }, [scoped, riders]);

  const liveQueue = useMemo(() => {
    const base = [...stats.pending, ...stats.inTransit];
    const filtered = statusFilter === "all" ? base : base.filter((d) => d.status === statusFilter);
    return filtered.slice(0, 12);
  }, [stats, statusFilter]);

  const recent = scoped.slice(0, 8);

  // Mutations
  const advance = async (d: Delivery) => {
    const next = NEXT_STATUS[d.status ?? ""];
    if (!next) return;
    setActing(d.id);
    const patch: any = { status: next };
    if (next === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (next === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("courier_deliveries").update(patch).eq("id", d.id);
    setActing(null);
    if (error) toast.error(error.message);
    else { toast.success(`${d.tracking_number} → ${next}`); load(true); }
  };

  const autoAssign = async (d: Delivery) => {
    const pool = stats.activeRiders;
    if (!pool.length) return toast.error("No active riders");
    // pick least-loaded rider
    const jobsByRider = new Map<string, number>();
    deliveries.forEach((x) => {
      if (x.assigned_rider_id && !["delivered", "cancelled", "failed"].includes(x.status ?? "")) {
        jobsByRider.set(x.assigned_rider_id, (jobsByRider.get(x.assigned_rider_id) ?? 0) + 1);
      }
    });
    const best = pool.slice().sort((a, b) => (jobsByRider.get(a.id) ?? 0) - (jobsByRider.get(b.id) ?? 0))[0];
    setActing(d.id);
    const { error } = await supabase.from("courier_deliveries")
      .update({ assigned_rider_id: best.id, status: "assigned" })
      .eq("id", d.id);
    setActing(null);
    if (error) toast.error(error.message);
    else { toast.success(`${d.tracking_number} → ${best.rider_name}`); load(true); }
  };

  const exportCsv = () => {
    const header = ["tracking", "status", "priority", "recipient", "address", "rider", "cod", "created"];
    const rows = scoped.map((d) => {
      const r = riders.find((rr) => rr.id === d.assigned_rider_id);
      return [
        d.tracking_number, d.status ?? "", d.priority ?? "",
        d.recipient_name, d.recipient_address.replace(/\n/g, " "),
        r?.rider_name ?? "", String(d.cod_amount ?? 0),
        new Date(d.created_at).toISOString(),
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `courier-deliveries-${windowSel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const riderLoad = useMemo(() => {
    return stats.activeRiders.map((r) => {
      const jobs = deliveries.filter(
        (d) => d.assigned_rider_id === r.id && !["delivered", "cancelled", "failed"].includes(d.status ?? ""),
      ).length;
      const doneToday = deliveries.filter(
        (d) => d.assigned_rider_id === r.id && d.status === "delivered" && d.delivered_at &&
        new Date(d.delivered_at).toDateString() === new Date().toDateString(),
      ).length;
      return { r, jobs, doneToday };
    }).sort((a, b) => b.jobs - a.jobs);
  }, [deliveries, stats.activeRiders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Courier Cockpit"
          description="Live last-mile command — deliveries, riders, SLAs and exceptions in one view."
          icon={Activity}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={windowSel} onValueChange={(v) => setWindowSel(v as Window)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="7d">7 days</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <CourierEntryDialog />
        </div>
      </div>

      <div className="text-xs text-muted-foreground -mt-2">
        Last sync {formatRel(lastSync.toISOString())} · Auto-refresh 30s · {scoped.length} records in window
      </div>

      {/* Hero KPI strip */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Package} label="Active Deliveries" value={stats.active.length}
          hint={`${stats.pending.length} pending • ${stats.inTransit.length} in transit`}
          accent="from-teal-500/15 to-cyan-500/5" />
        <KpiCard icon={CheckCircle2} label="Delivered Today" value={stats.deliveredToday.length}
          hint={`On-time ${stats.onTime}% · Avg ${stats.avgMin}m`}
          accent="from-emerald-500/15 to-green-500/5" />
        <KpiCard icon={Users} label="Riders Utilised" value={`${stats.utilised}/${stats.activeRiders.length}`}
          hint={`${stats.utilPct}% of active fleet`}
          accent="from-blue-500/15 to-indigo-500/5" />
        <KpiCard icon={AlertTriangle} label="Exceptions" value={stats.failedToday.length + stats.urgent.length}
          hint={`${stats.urgent.length} urgent • ${stats.failedToday.length} failed`}
          accent="from-rose-500/15 to-orange-500/5" />
      </div>

      {/* Quick launch */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to={`/platform/${platformId}/m/courier-dispatch`} icon={Zap} label="Dispatch Board" sub="Assign live jobs" />
        <QuickLink to={`/platform/${platformId}/m/courier-riders`} icon={Users} label="Riders" sub="Roster & status" />
        <QuickLink to={`/platform/${platformId}/m/map`} icon={Navigation} label="Live Map" sub="GPS tracking" />
        <QuickLink to={`/platform/${platformId}/m/incidents`} icon={AlertTriangle} label="Incidents" sub="Exceptions desk" />
      </div>

      {/* Operational columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" /> Live Operations Queue
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Click a row to advance status or auto-assign.</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="picked_up">Picked up</SelectItem>
                    <SelectItem value="in_transit">In transit</SelectItem>
                  </SelectContent>
                </Select>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/platform/${platformId}/m/courier-dispatch`}>Open Dispatch</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : liveQueue.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Queue clear" sub="No matching deliveries." />
            ) : (
              <ScrollArea className="max-h-[460px] pr-2">
                <ul className="space-y-2">
                  {liveQueue.map((d) => {
                    const rider = riders.find((r) => r.id === d.assigned_rider_id);
                    const canAdvance = !!NEXT_STATUS[d.status ?? ""];
                    return (
                      <li key={d.id} className="flex items-center gap-3 rounded-lg border bg-card/60 p-3 hover:bg-accent/40 transition">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium truncate">{d.tracking_number}</span>
                            <Badge variant="outline" className={STATUS_COLORS[d.status ?? ""] ?? ""}>{d.status ?? "—"}</Badge>
                            {d.priority && d.priority !== "normal" && (
                              <Badge className={PRIO_COLORS[d.priority] ?? ""}>{d.priority}</Badge>
                            )}
                            {Number(d.cod_amount) > 0 && (
                              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                                COD {Number(d.cod_amount).toLocaleString()}
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            → {d.recipient_name} · {d.recipient_address}
                            {rider && <> · <span className="text-foreground/70">{rider.rider_name}</span></>}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRel(d.created_at)}</div>
                          <div className="flex items-center gap-1.5">
                            {!d.assigned_rider_id && (
                              <Button size="sm" variant="outline" className="h-7" disabled={acting === d.id}
                                onClick={() => autoAssign(d)}>
                                Auto-assign
                              </Button>
                            )}
                            {canAdvance && (
                              <Button size="sm" className="h-7" disabled={acting === d.id} onClick={() => advance(d)}>
                                {NEXT_STATUS[d.status ?? ""]} <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Side: performance + zones */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Metric label="On-Time Delivery" value={`${stats.onTime}%`} progress={stats.onTime} />
              <Metric label="Fleet Utilisation" value={`${stats.utilPct}%`} progress={stats.utilPct} />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <MiniStat icon={Package} label="Created" value={stats.totalToday} />
                <MiniStat icon={CheckCircle2} label="Delivered" value={stats.deliveredToday.length} />
                <MiniStat icon={Timer} label="Avg Time" value={`${stats.avgMin}m` as any} />
                <MiniStat icon={AlertTriangle} label="Failed" value={stats.failedToday.length} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">COD Outstanding</div>
                  <div className="text-base font-semibold">KES {stats.codOutstanding.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">COD Collected</div>
                  <div className="text-base font-semibold">KES {stats.codCollectedToday.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" /> Active by Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.zones.length === 0 ? (
                <EmptyState icon={MapPin} title="No active load" sub="Zone breakdown appears when riders carry jobs." />
              ) : (
                <ul className="space-y-2">
                  {stats.zones.map(([zone, n]) => {
                    const max = stats.zones[0][1] || 1;
                    return (
                      <li key={zone}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="truncate">{zone}</span>
                          <span className="text-muted-foreground">{n}</span>
                        </div>
                        <Progress value={(n / max) * 100} className="h-1.5" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rider Load + Recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Rider Load
            </CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to={`/platform/${platformId}/m/courier-riders`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> :
              riderLoad.length === 0 ? <EmptyState icon={Users} title="No active riders" sub="Add riders from the Riders module." /> :
              <ul className="space-y-2">
                {riderLoad.slice(0, 8).map(({ r, jobs, doneToday }) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{r.rider_name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{r.rider_id}</span><span>·</span>
                        <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" />{r.vehicle_type}</span>
                        {r.zone && <><span>·</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.zone}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">{doneToday} done</Badge>
                      <Badge variant={jobs > 0 ? "default" : "outline"}>{jobs} live</Badge>
                    </div>
                  </li>
                ))}
              </ul>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> :
              recent.length === 0 ? <EmptyState icon={Package} title="No deliveries yet" sub="Created deliveries will appear here." /> :
              <ul className="space-y-2">
                {recent.map((d) => (
                  <li key={d.id} className="flex items-start justify-between gap-2 rounded-md border p-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{d.tracking_number}</span>
                        <Badge variant="outline" className={STATUS_COLORS[d.status ?? ""] ?? ""}>{d.status ?? "—"}</Badge>
                      </div>
                      <div className="truncate text-sm">{d.recipient_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{d.recipient_address}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{formatRel(d.created_at)}</div>
                  </li>
                ))}
              </ul>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, hint, accent }: { icon: any; label: string; value: number | string; hint?: string; accent?: string }) => (
  <Card className={`relative overflow-hidden bg-gradient-to-br ${accent ?? ""}`}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-lg bg-background/60 p-2 border"><Icon className="h-5 w-5 text-primary" /></div>
      </div>
    </CardContent>
  </Card>
);

const QuickLink = ({ to, icon: Icon, label, sub }: { to: string; icon: any; label: string; sub: string }) => (
  <Link to={to} className="group rounded-xl border bg-card p-4 hover:bg-accent/50 hover:border-primary/40 transition flex items-center gap-3">
    <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition"><Icon className="h-5 w-5 text-primary" /></div>
    <div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  </Link>
);

const Metric = ({ label, value, progress }: { label: string; value: string; progress: number }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
    <Progress value={progress} className="h-2" />
  </div>
);

const MiniStat = ({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) => (
  <div className="rounded-md border bg-card/60 p-2.5">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3 w-3" />{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Icon className="h-8 w-8 text-muted-foreground/60" />
    <div className="mt-2 text-sm font-medium">{title}</div>
    <div className="text-xs text-muted-foreground">{sub}</div>
  </div>
);

export default CourierCockpit;
