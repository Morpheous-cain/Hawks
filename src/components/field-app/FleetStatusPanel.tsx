import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, Activity, Radio, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * FleetStatusPanel - View-only fleet status for Supervisors
 * Shows fleet availability and vehicle locations without dispatch controls
 */
const FleetStatusPanel = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState({
    available: 0,
    deployed: 0,
    enRoute: 0,
    onScene: 0
  });

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 15000); // Refresh every 15s
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
      setStats({
        available: data.filter(v => !v.current_assignment || v.current_assignment === '').length,
        deployed: data.filter(v => v.current_assignment && v.current_assignment !== '').length,
        enRoute: 0,
        onScene: 0
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
      case 'available': return 'bg-alert-normal text-white';
      case 'deployed': return 'bg-primary text-primary-foreground';
      case 'en_route': return 'bg-alert-caution text-white';
      case 'on_scene': return 'bg-alert-caution text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Fleet Status</h2>
            <p className="text-sm text-muted-foreground">View-only fleet monitoring</p>
          </div>
        </div>
        <Badge variant="outline" className="border-cyan-500/50 text-cyan-500">
          <Clock className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-alert-normal/30">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-alert-normal mx-auto mb-2" />
            <p className="text-2xl font-bold text-alert-normal">{stats.available}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="p-4 text-center">
            <Car className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{stats.deployed}</p>
            <p className="text-xs text-muted-foreground">Deployed</p>
          </CardContent>
        </Card>
        <Card className="border-alert-caution/30">
          <CardContent className="p-4 text-center">
            <Radio className="w-6 h-6 text-alert-caution mx-auto mb-2" />
            <p className="text-2xl font-bold text-alert-caution">{stats.enRoute}</p>
            <p className="text-xs text-muted-foreground">En Route</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-500">{stats.onScene}</p>
            <p className="text-xs text-muted-foreground">On Scene</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active vehicles found
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => {
                const status = getVehicleStatus(vehicle);
                return (
                  <div 
                    key={vehicle.id} 
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{vehicle.callsign || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.registration_number || 'No Reg'} • {vehicle.vehicle_type || 'Vehicle'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                      {vehicle.current_assignment && (
                        <span className="text-xs text-muted-foreground max-w-32 truncate">
                          {vehicle.current_assignment}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetStatusPanel;
