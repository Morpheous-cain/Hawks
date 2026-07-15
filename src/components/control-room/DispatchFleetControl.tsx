import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Radio, Activity } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useDispatch } from "@/hooks/useDispatch";
import { RequirePermission } from "@/components/auth/RequirePermission";

const DispatchFleetControl = () => {
  const { vehicles, isLoading, updateVehicle } = useVehicles();
  const { createDispatchRequest, isCreatingDispatchRequest } = useDispatch();
  const [stats, setStats] = useState({
    available: 0,
    deployed: 0,
    enRoute: 0,
    onScene: 0
  });

  // Update stats when vehicles change
  useEffect(() => {
    if (vehicles) {
      setStats({
        available: vehicles.filter(v => !v.current_assignment || v.current_assignment === '').length,
        deployed: vehicles.filter(v => v.current_assignment && v.current_assignment !== '').length,
        enRoute: 0,
        onScene: 0
      });
    }
  }, [vehicles]);

  const getVehicleStatus = (vehicle: any) => {
    if (!vehicle.current_assignment || vehicle.current_assignment === '') {
      return 'available';
    }
    return 'deployed';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-alert-normal';
      case 'deployed': return 'bg-primary';
      case 'en_route': return 'bg-alert-caution';
      case 'on_scene': return 'bg-alert-caution';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return <Activity className="w-4 h-4" />;
      case 'en_route': return <Radio className="w-4 h-4" />;
      case 'on_scene': return <MapPin className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const handleDispatch = async (vehicle: any) => {
    const dispatchNumber = `DSP-${Date.now().toString(36).toUpperCase()}`;
    try {
      await createDispatchRequest({
        request_number: dispatchNumber,
        description: `Dispatch ${vehicle.call_sign || vehicle.registration_number}`,
        location: vehicle.last_gps_lat && vehicle.last_gps_lng
          ? `${vehicle.last_gps_lat},${vehicle.last_gps_lng}`
          : "Unknown",
        dispatch_type: "vehicle",
        priority: "medium" as any,
        requested_by: "", // Will be filled by backend or useAuth
        ticket_id: "",   // Placeholder — wire to an incident/alarm context
        assigned_unit: vehicle.id,
      });
      // Mark vehicle as dispatched
      await updateVehicle({ id: vehicle.id, current_assignment: dispatchNumber });
    } catch (err) {
      console.error("Dispatch failed:", err);
    }
  };

  const handleTrack = (vehicle: any) => {
    if (vehicle.last_gps_lat && vehicle.last_gps_lng) {
      window.open(
        `https://www.google.com/maps?q=${vehicle.last_gps_lat},${vehicle.last_gps_lng}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleContact = (vehicle: any) => {
    // ponytail: replace with real contact info — vehicle.crew_mobile or similar
    const msg = `Unit: ${vehicle.call_sign || vehicle.registration_number}`;
    alert(`Contact dispatch for ${msg}`);
  };

  return (
    <div className="space-y-6">
      {/* Fleet Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-alert-normal/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available</p>
                <p className="text-2xl font-bold text-alert-normal">{stats.available}</p>
              </div>
              <Activity className="w-8 h-8 text-alert-normal" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deployed</p>
                <p className="text-2xl font-bold text-primary">{stats.deployed}</p>
              </div>
              <Car className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-alert-caution/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">En Route</p>
                <p className="text-2xl font-bold text-alert-caution">{stats.enRoute}</p>
              </div>
              <Radio className="w-8 h-8 text-alert-caution" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-alert-caution/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">On Scene</p>
                <p className="text-2xl font-bold text-alert-caution">{stats.onScene}</p>
              </div>
              <MapPin className="w-8 h-8 text-alert-caution" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => {
              const status = getVehicleStatus(vehicle);
              return (
              <div
                key={vehicle.id}
                className="p-4 bg-muted/30 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{vehicle.call_sign}</h3>
                    <p className="text-sm text-muted-foreground">{vehicle.registration_number}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.vehicle_type}</p>
                  </div>
                  <Badge className={getStatusColor(status)}>
                    {getStatusIcon(status)}
                    <span className="ml-1">{status}</span>
                  </Badge>
                </div>
                
                {vehicle.last_gps_lat && vehicle.last_gps_lng && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    GPS: {vehicle.last_gps_lat.toFixed(4)}, {vehicle.last_gps_lng.toFixed(4)}
                  </p>
                )}

                {vehicle.current_assignment && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Assignment: {vehicle.current_assignment}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => handleTrack(vehicle)}>
                    Track
                  </Button>
                  <RequirePermission module="ops.dispatch" level="edit">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={isCreatingDispatchRequest || !!vehicle.current_assignment}
                      onClick={() => handleDispatch(vehicle)}
                    >
                      {isCreatingDispatchRequest && !vehicle.current_assignment ? "Dispatching..." : "Dispatch"}
                    </Button>
                  </RequirePermission>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => handleContact(vehicle)}>
                    Contact
                  </Button>
                </div>
              </div>
            )}
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DispatchFleetControl;