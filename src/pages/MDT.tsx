import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation, MessageSquare, FileText, QrCode, Map as MapIcon, AlertTriangle, Truck, Signal, Battery, Wifi } from "lucide-react";
import MDTPatrols from "@/components/mdt/MDTPatrols";
import MDTMessages from "@/components/mdt/MDTMessages";
import MDTIncidents from "@/components/mdt/MDTIncidents";
import MDTCheckpoints from "@/components/mdt/MDTCheckpoints";
import MDTMap from "@/components/mdt/MDTMap";
import SOSButton from "@/components/mdt/SOSButton";
import MDTStatusBar from "@/components/mdt/MDTStatusBar";
import { vehicleStatusColors } from "@/lib/colors";

const MDT = () => {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("patrols");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchVehicleData();
    const unsubscribe = subscribeToUpdates();
    return () => unsubscribe?.();
  }, [user]);

  const fetchVehicleData = async () => {
    try {
      // Fetch first available vehicle or user's assigned vehicle
      let query = supabase.from("vehicles").select("*");
      
      if (user?.id) {
        query = query.eq("current_officer_id", user.id);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();

      if (error) throw error;
      
      if (data) {
        setVehicle(data);
      } else {
        // Fetch any active vehicle for display
        const { data: anyVehicle } = await supabase
          .from("vehicles")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        
        setVehicle(anyVehicle);
      }
    } catch (error: any) {
      console.error("Error fetching vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel("mdt-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        () => {
          fetchVehicleData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateGPS = async () => {
    if (!navigator.geolocation || !vehicle) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await supabase
            .from("vehicles")
            .update({
              last_gps_lat: position.coords.latitude,
              last_gps_lng: position.coords.longitude,
              last_gps_update: new Date().toISOString(),
            })
            .eq("id", vehicle.id);
        } catch (error) {
          console.error("GPS update error:", error);
        }
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (vehicle) {
      updateGPS();
      const interval = setInterval(updateGPS, 30000);
      return () => clearInterval(interval);
    }
  }, [vehicle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading MDT...</p>
        </div>
      </div>
    );
  }

  const defaultVehicle = {
    id: null,
    vehicle_id: "AP-RT-01",
    vehicle_type: "Response Vehicle",
    registration_number: "KDH 456X",
    status: "available",
    current_assignment: "Unassigned",
    fuel_level: 100,
    last_gps_lat: -1.2921,
    last_gps_lng: 36.8219,
  };

  const displayVehicle = vehicle || defaultVehicle;
  const statusColor = vehicleStatusColors[displayVehicle.status || "available"] || vehicleStatusColors.available;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* MDT Header */}
      <Card className="p-4 mb-4 bg-card/80 backdrop-blur border-primary/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{displayVehicle.vehicle_id}</h1>
                <Badge className={statusColor}>
                  {(displayVehicle.status || "available").replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {displayVehicle.vehicle_type} • {displayVehicle.registration_number}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Assignment: {displayVehicle.current_assignment || "Unassigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-alert-normal" />
              <span className="text-alert-normal">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-alert-normal" />
              <span>4G</span>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-alert-normal" />
              <span>{displayVehicle.fuel_level || 100}%</span>
            </div>
            <div className="font-mono text-lg font-bold text-primary">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Card>

      <div className="max-w-7xl mx-auto space-y-4">
        <MDTStatusBar vehicle={displayVehicle} onChanged={fetchVehicleData} />
        <SOSButton vehicleId={displayVehicle.id} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-6 w-full">
            <TabsTrigger value="patrols" className="gap-2">
              <Navigation className="w-4 h-4" />
              <span className="hidden sm:inline">Patrols</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Incidents</span>
            </TabsTrigger>
            <TabsTrigger value="checkpoints" className="gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Checkpoints</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="sos" className="gap-2 lg:hidden">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">SOS</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patrols" className="mt-4">
            <MDTPatrols vehicleId={displayVehicle.id} />
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <MDTMessages vehicleId={displayVehicle.id} />
          </TabsContent>

          <TabsContent value="incidents" className="mt-4">
            <MDTIncidents vehicleId={displayVehicle.id} />
          </TabsContent>

          <TabsContent value="checkpoints" className="mt-4">
            <MDTCheckpoints vehicleId={displayVehicle.id} />
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <MDTMap vehicle={displayVehicle} />
          </TabsContent>


          <TabsContent value="sos" className="mt-4 lg:hidden">
            <Card className="p-8">
              <SOSButton vehicleId={displayVehicle.id} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MDT;
