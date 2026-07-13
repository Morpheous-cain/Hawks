import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Radio, MapPin, Navigation, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const GPSPatrolTracking = () => {
  const [patrols, setPatrols] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [patrolRes, vehicleRes] = await Promise.all([
        supabase
          .from("patrols")
          .select("*, staff(full_name)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("vehicles")
          .select("*")
          .order("vehicle_id", { ascending: true }),
      ]);

      setPatrols(patrolRes.data || []);
      setVehicles(vehicleRes.data || []);
    } catch (error) {
      console.error("Error fetching patrol data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("gps-patrol-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "patrols" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const activePatrols = patrols.filter(p => p.status === "active").length;
  const vehiclePatrols = vehicles.filter(v => v.status === "on_patrol" || v.status === "available").length;
  const totalVehicles = vehicles.length;

  const statusColors: Record<string, string> = {
    active: "bg-alert-normal",
    completed: "bg-muted",
    scheduled: "bg-primary",
    break: "bg-alert-caution",
    on_patrol: "bg-alert-normal",
    available: "bg-primary",
    offline: "bg-alert-critical",
    maintenance: "bg-alert-caution",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GPS Patrol Tracking"
        description="Real-time vehicle and foot patrol monitoring via geo-fencing"
        icon={Radio}
      />

      {/* Summary Stats from DB */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-alert-normal" />
            <div>
              <p className="text-sm text-primary font-semibold">Active Patrols</p>
              <p className="text-3xl font-bold text-foreground">{activePatrols}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-primary font-semibold">Total Vehicles</p>
              <p className="text-3xl font-bold text-foreground">{totalVehicles}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-primary font-semibold">On Patrol</p>
              <p className="text-3xl font-bold text-foreground">{vehiclePatrols}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <Navigation className="w-8 h-8 text-alert-caution" />
            <div>
              <p className="text-sm text-primary font-semibold">Total Patrols</p>
              <p className="text-3xl font-bold text-foreground">{patrols.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Tracking Map */}
      <Card className="p-4 border-border">
        <h3 className="font-semibold text-foreground mb-4">Live GPS Tracking - Nairobi Metro</h3>

        <div className="relative w-full h-[500px] bg-muted/30 rounded-lg overflow-hidden mb-4">
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="patrol-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#patrol-grid)" />
          </svg>

          {/* Geo-fence Zones */}
          <div className="absolute top-[30%] left-[20%] w-[200px] h-[150px] border-2 border-primary/30 rounded-lg bg-primary/5" />
          <div className="absolute top-[50%] left-[60%] w-[180px] h-[120px] border-2 border-accent/30 rounded-lg bg-accent/5" />

          {/* Vehicle markers from DB */}
          {vehicles.map((vehicle, idx) => {
            const xPos = `${15 + ((idx * 37) % 70)}%`;
            const yPos = `${15 + ((idx * 23) % 60)}%`;
            const vehicleStatus = vehicle.status || "available";
            return (
              <div
                key={vehicle.id}
                className="absolute group cursor-pointer z-10"
                style={{ left: xPos, top: yPos, transform: "translate(-50%, -50%)" }}
              >
                <div className={`w-5 h-5 rounded-full ${statusColors[vehicleStatus] || "bg-muted"} shadow-glow animate-pulse`} />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-card border border-border rounded-lg p-3 shadow-elevated whitespace-nowrap">
                    <p className="text-sm font-bold text-foreground mb-2">{vehicle.vehicle_id}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="text-foreground/70 font-medium">Type:</span>
                        <span className="text-foreground">{vehicle.vehicle_type}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-foreground/70 font-medium">Status:</span>
                        <Badge className={`${statusColors[vehicleStatus] || "bg-muted"} text-primary-foreground text-xs`}>
                          {vehicleStatus.toUpperCase().replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {vehicles.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No vehicles registered
            </div>
          )}
        </div>
      </Card>

      {/* Patrol Units List from DB */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground animate-pulse">Loading patrols...</div>
      ) : patrols.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patrols.map((patrol) => (
            <Card key={patrol.id} className="p-4 border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-foreground">{patrol.patrol_id || "Patrol"}</p>
                  <p className="text-sm text-foreground/70 font-medium">{patrol.site_name}</p>
                </div>
                <Badge className={`${statusColors[patrol.status] || "bg-muted"} text-primary-foreground`}>
                  {(patrol.status || "unknown").toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-primary/70 font-semibold text-xs">Officer</p>
                  <p className="text-foreground">{patrol.staff?.full_name || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-primary/70 font-semibold text-xs">Type</p>
                  <p className="text-foreground">{patrol.patrol_type || "Routine"}</p>
                </div>
                <div>
                  <p className="text-primary/70 font-semibold text-xs">Client</p>
                  <p className="text-foreground">{patrol.client_name || "—"}</p>
                </div>
                <div>
                  <p className="text-primary/70 font-semibold text-xs">Route</p>
                  <p className="text-foreground">{patrol.route_name || "—"}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground border-border">
          No patrols recorded yet. Create patrols from the Supervision Patrol module.
        </Card>
      )}
    </div>
  );
};

export default GPSPatrolTracking;
