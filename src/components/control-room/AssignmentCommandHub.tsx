import { lazy, Suspense, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Shield, Bell, Truck, Wrench, MapPin, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DispatchFleetControl = lazy(() => import("@/components/control-room/DispatchFleetControl"));
const SupervisorPlatform = lazy(() => import("@/components/patrol/SupervisorPlatform"));
const MobileResponseOfficerPlatform = lazy(() => import("@/components/alarms/MobileResponseOfficerPlatform"));
const EscortOfficerPlatform = lazy(() => import("@/components/escort/EscortOfficerPlatform"));
const RiderDriverApp = lazy(() => import("@/components/courier/RiderDriverApp"));
const TIMUPlatform = lazy(() => import("@/components/technical/TIMUPlatform"));

const Loader = () => <div className="p-12 text-center text-sm text-muted-foreground">Loading workstation…</div>;

interface Counts { dispatch: number; patrols: number; alarms: number; escort: number; courier: number; tech: number; }

export const AssignmentCommandHub = () => {
  const [c, setC] = useState<Counts>({ dispatch: 0, patrols: 0, alarms: 0, escort: 0, courier: 0, tech: 0 });

  const load = async () => {
    const [d, p, a, e, co, t] = await Promise.all([
      supabase.from("dispatch_requests").select("*", { count: "exact", head: true }).in("status", ["pending", "dispatched"]),
      supabase.from("patrols").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("alarm_activations").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("escort_missions").select("*", { count: "exact", head: true }).in("status", ["assigned", "in_progress"]),
      supabase.from("courier_deliveries").select("*", { count: "exact", head: true }).in("status", ["pending", "in_transit"]),
      supabase.from("technical_work_orders").select("*", { count: "exact", head: true }).in("status", ["pending", "in_progress"]),
    ]);
    setC({
      dispatch: d.count || 0, patrols: p.count || 0, alarms: a.count || 0,
      escort: e.count || 0, courier: co.count || 0, tech: t.count || 0,
    });
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("assignment-hub-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "patrols" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alarm_activations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "escort_missions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_deliveries" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const kpi = (label: string, val: number, Icon: React.ElementType, accent = "primary") => (
    <Card className="hud-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent === "primary" ? "text-primary" : "text-amber-400"}`} />
      </div>
      <p className={`mt-1 font-mono text-3xl ${accent === "primary" ? "text-primary kpi-glow" : "text-foreground"}`}>{val}</p>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-2"><LayoutGrid className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="font-display text-2xl text-foreground">Assignment Command Hub</h2>
          <p className="text-sm text-muted-foreground">Unified workstation: dispatch, patrols, QRF, escort, courier & tech jobs in one screen.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {kpi("Dispatch Open", c.dispatch, Radio)}
        {kpi("Active Patrols", c.patrols, Shield)}
        {kpi("Live Alarms", c.alarms, Bell, "amber")}
        {kpi("Escort Missions", c.escort, MapPin)}
        {kpi("Courier Active", c.courier, Truck)}
        {kpi("Tech Jobs", c.tech, Wrench)}
      </div>

      <Tabs defaultValue="dispatch" className="space-y-4">
        <TabsList className="flex w-full flex-wrap gap-1 bg-card p-1">
          <TabsTrigger value="dispatch" className="data-[state=active]:bg-gradient-command data-[state=active]:text-primary-foreground">Dispatch</TabsTrigger>
          <TabsTrigger value="patrols" className="data-[state=active]:bg-gradient-command data-[state=active]:text-primary-foreground">Patrols</TabsTrigger>
          <TabsTrigger value="alarms" className="data-[state=active]:bg-gradient-command data-[state=active]:text-primary-foreground">QRF / Alarms</TabsTrigger>
          <TabsTrigger value="escort" className="data-[state=active]:bg-gradient-command data-[state=active]:text-primary-foreground">Escort</TabsTrigger>
          <TabsTrigger value="courier" className="data-[state=active]:bg-gradient-command data-[state=active]:text-primary-foreground">Courier</TabsTrigger>
          <TabsTrigger value="tech" className="data-[state=active]:bg-gradient-command data-[state=active]:text-primary-foreground">Tech Jobs</TabsTrigger>
        </TabsList>

        <Suspense fallback={<Loader />}>
          <TabsContent value="dispatch"><DispatchFleetControl /></TabsContent>
          <TabsContent value="patrols"><SupervisorPlatform /></TabsContent>
          <TabsContent value="alarms"><MobileResponseOfficerPlatform /></TabsContent>
          <TabsContent value="escort"><EscortOfficerPlatform /></TabsContent>
          <TabsContent value="courier"><RiderDriverApp /></TabsContent>
          <TabsContent value="tech"><TIMUPlatform /></TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
};

export default AssignmentCommandHub;
