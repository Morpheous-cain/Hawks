import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Radio, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DispatchFleetControl = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState({
    available: 0,
    deployed: 0,
    enRoute: 0,
    onScene: 0
  });

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true)
      .order('callsign', { ascending: true });

    if (data) {
      setVehicles(data);
      // Using vehicle_status or creating a default status field
      setStats({
        available: data.filter(v => v.current_assignment === null || v.current_assignment === '').length,
        deployed: data.filter(v => v.current_assignment !== null && v.current_assignment !== '').length,
        enRoute: 0, // Would need status tracking
        onScene: 0  // Would need status tracking
      });
    }
  };

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
                  <Button size="sm" variant="outline" className="text-xs">
                    Track
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Dispatch
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
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