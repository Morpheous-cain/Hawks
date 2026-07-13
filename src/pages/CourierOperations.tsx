import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Package, MapPin, AlertTriangle, Users, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import StatsCard from "@/components/StatsCard";
import { CourierEntryDialog } from "@/components/courier/CourierEntryDialog";
import { DispatchBoard } from "@/components/courier/DispatchBoard";
import { RidersManagement } from "@/components/courier/RidersManagement";
import { ParcelManager } from "@/components/courier/ParcelManager";
import { LiveTrackingPanel } from "@/components/courier/LiveTrackingPanel";
import { supabase } from "@/integrations/supabase/client";

type LiveStats = {
  deliveriesToday: number;
  activeRiders: number;
  totalRiders: number;
  avgMin: number;
  inTransit: number;
  pending: number;
  delivered: number;
  failed: number;
  onTimePct: number;
  utilPct: number;
  codOutstanding: number;
};

const CourierOperations = () => {
  const [s, setS] = useState<LiveStats>({
    deliveriesToday: 0, activeRiders: 0, totalRiders: 0, avgMin: 0,
    inTransit: 0, pending: 0, delivered: 0, failed: 0, onTimePct: 0, utilPct: 0, codOutstanding: 0,
  });

  const load = async () => {
    const [d, r] = await Promise.all([
      supabase.from("courier_deliveries").select("status,priority,assigned_rider_id,picked_up_at,delivered_at,created_at,cod_amount").limit(1000),
      supabase.from("courier_riders").select("id,status").limit(500),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = (d.data ?? []) as any[];
    const riders = (r.data ?? []) as any[];
    const todays = rows.filter((x) => new Date(x.created_at) >= today);
    const delivered = todays.filter((x) => x.status === "delivered");
    const failed = todays.filter((x) => x.status === "failed");
    const pending = rows.filter((x) => x.status === "pending");
    const inTransit = rows.filter((x) => ["picked_up", "in_transit", "assigned"].includes(x.status));
    const active = rows.filter((x) => !["delivered", "cancelled", "failed"].includes(x.status));
    const dwithTimes = delivered.filter((x) => x.delivered_at && x.picked_up_at);
    const avg = dwithTimes.length ? Math.round(
      dwithTimes.reduce((sum, x) => sum + (new Date(x.delivered_at).getTime() - new Date(x.picked_up_at).getTime()) / 60000, 0) / dwithTimes.length,
    ) : 0;
    const totalActiveR = riders.filter((x) => x.status === "active").length;
    const utilised = new Set(active.map((x) => x.assigned_rider_id).filter(Boolean)).size;
    setS({
      deliveriesToday: todays.length,
      activeRiders: totalActiveR,
      totalRiders: riders.length,
      avgMin: avg,
      inTransit: inTransit.length,
      pending: pending.length,
      delivered: delivered.length,
      failed: failed.length,
      onTimePct: todays.length ? Math.round((delivered.length / todays.length) * 100) : 0,
      utilPct: totalActiveR ? Math.round((utilised / totalActiveR) * 100) : 0,
      codOutstanding: active.reduce((sum, x) => sum + Number(x.cod_amount ?? 0), 0),
    });
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("courier-ops-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_deliveries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_riders" }, load)
      .subscribe();
    const t = setInterval(load, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Courier Operations"
          description="Black Hawk Courier Command 2025 - End-to-end courier business operations"
          icon={Truck}
        />
        <CourierEntryDialog />
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Deliveries Today" value={s.deliveriesToday} icon={Package}
          trend={`${s.delivered} delivered · ${s.failed} failed`} status={s.failed > 0 ? "caution" : "normal"} />
        <StatsCard title="Active Riders" value={`${s.activeRiders}/${s.totalRiders}`} icon={Users}
          trend={`${s.utilPct}% utilised`} status="normal" />
        <StatsCard title="Avg Delivery Time" value={`${s.avgMin} min`} icon={Clock}
          trend={s.avgMin > 0 ? "From pickup to drop-off" : "No completed deliveries yet"} status="normal" />
        <StatsCard title="On-Time %" value={`${s.onTimePct}%`} icon={TrendingUp}
          trend={`COD outstanding KES ${s.codOutstanding.toLocaleString()}`}
          status={s.onTimePct >= 90 ? "normal" : s.onTimePct >= 75 ? "caution" : "critical"} />
      </div>


      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card flex-wrap">
          <TabsTrigger value="overview">Overview Dashboard</TabsTrigger>
          <TabsTrigger value="riders">Riders & Drivers</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch Board</TabsTrigger>
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="parcels">Parcel Management</TabsTrigger>
        </TabsList>

        {/* Overview Dashboard Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pickup Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" /> Pickup Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PipeRow label="Pending" value={s.pending} />
                <PipeRow label="In Transit / Picked Up" value={s.inTransit} />
                <PipeRow label="Delivered Today" value={s.delivered} tone="normal" />
                <PipeRow label="Failed Today" value={s.failed} tone={s.failed > 0 ? "critical" : "muted"} />
              </CardContent>
            </Card>

            {/* Operational health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Operational Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PipeRow label="Active Riders" value={`${s.activeRiders}/${s.totalRiders}`} />
                <PipeRow label="Fleet Utilisation" value={`${s.utilPct}%`} tone={s.utilPct > 90 ? "caution" : "normal"} />
                <PipeRow label="On-Time %" value={`${s.onTimePct}%`} tone={s.onTimePct >= 90 ? "normal" : "caution"} />
                <PipeRow label="COD Outstanding" value={`KES ${s.codOutstanding.toLocaleString()}`} />
              </CardContent>
            </Card>
          </div>

          {/* Live Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-alert-caution" /> Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {s.failed === 0 && s.pending === 0 ? (
                <p className="text-sm text-muted-foreground">No active alerts. All deliveries within SLA.</p>
              ) : (
                <div className="space-y-2">
                  {s.pending > 0 && (
                    <div className="flex items-center justify-between p-3 bg-alert-caution/10 border border-alert-caution/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{s.pending} unassigned pickup{s.pending > 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted-foreground">Open the dispatch board to assign riders.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toast.info("Switch to Dispatch Board tab to assign riders.")}>Action</Button>
                    </div>
                  )}
                  {s.failed > 0 && (
                    <div className="flex items-center justify-between p-3 bg-alert-critical/10 border border-alert-critical/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{s.failed} failed deliver{s.failed > 1 ? "ies" : "y"} today</p>
                        <p className="text-xs text-muted-foreground">Investigate causes and trigger re-attempts.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toast.warning("Failed deliveries flagged for review.")}>Review</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Riders & Drivers Management Tab */}
        <TabsContent value="riders" className="space-y-4">
          <RidersManagement />
        </TabsContent>

        {/* Dispatch Board Tab */}
        <TabsContent value="dispatch" className="space-y-4">
          <DispatchBoard />
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          <LiveTrackingPanel />
        </TabsContent>

        {/* Parcel Management Tab */}
        <TabsContent value="parcels" className="space-y-4">
          <ParcelManager />
        </TabsContent>

      </Tabs>
    </div>
  );
};

const PipeRow = ({ label, value, tone }: { label: string; value: number | string; tone?: "normal" | "caution" | "critical" | "muted" }) => (
  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
    <span className="text-sm">{label}</span>
    <Badge
      variant="outline"
      className={
        tone === "normal" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
        tone === "caution" ? "bg-amber-500/15 text-amber-600 border-amber-500/30" :
        tone === "critical" ? "bg-rose-500/15 text-rose-600 border-rose-500/30" : ""
      }
    >
      {value}
    </Badge>
  </div>
);

export default CourierOperations;
