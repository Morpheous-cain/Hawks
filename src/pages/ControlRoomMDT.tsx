import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map as MapIcon, Radio, AlertTriangle, Activity } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import ControlRoomMap from "@/components/control-room-mdt/ControlRoomMap";
import ControlRoomAssignments from "@/components/control-room-mdt/ControlRoomAssignments";
import ControlRoomAlerts from "@/components/control-room-mdt/ControlRoomAlerts";
import ControlRoomStats from "@/components/control-room-mdt/ControlRoomStats";

const ControlRoomMDT = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    subscribeToUpdates();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, sosRes] = await Promise.all([
        supabase.from("vehicles").select("*").eq("is_active", true),
        supabase
          .from("sos_alerts")
          .select("*, vehicles(*), profiles(*)")
          .in("status", ["active", "responding"])
          .order("triggered_at", { ascending: false }),
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (sosRes.error) throw sosRes.error;

      setVehicles(vehiclesRes.data || []);
      setSosAlerts(sosRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load control room data");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const vehicleChannel = supabase
      .channel("control-room-vehicles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const sosChannel = supabase
      .channel("control-room-sos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sos_alerts",
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new.status === "active") {
            toast.error(`🚨 SOS ALERT: ${payload.new.alert_number}`, {
              duration: 10000,
            });
          }
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehicleChannel);
      supabase.removeChannel(sosChannel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading control room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Control Room - Mobile Response Network"
        description="Real-time vehicle tracking, dispatch, and emergency response"
        icon={Radio}
      />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <ControlRoomStats vehicles={vehicles} sosAlerts={sosAlerts} />

        {sosAlerts.length > 0 && (
          <Card className="p-3 sm:p-4 border-destructive bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-bold text-destructive">Active SOS Alerts</h3>
            </div>
            <ControlRoomAlerts alerts={sosAlerts} />
          </Card>
        )}

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="map" className="gap-1 sm:gap-2 py-2 sm:py-3 flex-col sm:flex-row">
              <MapIcon className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Map</span>
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="gap-1 sm:gap-2 py-2 sm:py-3 flex-col sm:flex-row">
              <Radio className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Dispatch</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1 sm:gap-2 py-2 sm:py-3 flex-col sm:flex-row">
              <Activity className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4 sm:mt-6">
            <ControlRoomMap vehicles={vehicles} />
          </TabsContent>

          <TabsContent value="dispatch" className="mt-4 sm:mt-6">
            <ControlRoomAssignments vehicles={vehicles} />
          </TabsContent>

          <TabsContent value="alerts" className="mt-4 sm:mt-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">All SOS Alerts</h2>
              {sosAlerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No SOS alerts at this time
                </p>
              ) : (
                <ControlRoomAlerts alerts={sosAlerts} />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ControlRoomMDT;
