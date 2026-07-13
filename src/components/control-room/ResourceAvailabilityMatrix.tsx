import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Grid3X3, Car, Users, Shield, Wrench, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Resource {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  location?: string;
  lastUpdate?: string;
}

const ResourceAvailabilityMatrix = () => {
  const [vehicles, setVehicles] = useState<Resource[]>([]);
  const [guards, setGuards] = useState<Resource[]>([]);
  const [equipment, setEquipment] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchResources = async () => {
    try {
      // Fetch vehicles
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('id, call_sign, status, vehicle_type')
        .eq('is_active', true);

      const vehicleResources: Resource[] = vehicleData?.map(v => ({
        id: v.id,
        name: v.call_sign,
        type: v.vehicle_type || 'vehicle',
        status: mapStatus(v.status)
      })) || [];

      // Fetch guards/staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, full_name, position, status')
        .eq('status', 'active');

      const guardResources: Resource[] = staffData?.map(s => ({
        id: s.id,
        name: s.full_name,
        type: s.position || 'guard',
        status: mapStatus(s.status)
      })) || [];

      // Fetch equipment
      const { data: equipData } = await supabase
        .from('technical_equipment')
        .select('id, equipment_id, equipment_type, status')
        .limit(20);

      const equipResources: Resource[] = equipData?.map(e => ({
        id: e.id,
        name: e.equipment_id,
        type: e.equipment_type,
        status: mapStatus(e.status)
      })) || [];

      setVehicles(vehicleResources);
      setGuards(guardResources);
      setEquipment(equipResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapStatus = (status: string | null): 'available' | 'busy' | 'offline' | 'maintenance' => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'on_duty':
      case 'active':
      case 'operational':
        return 'available';
      case 'busy':
      case 'assigned':
      case 'in_use':
        return 'busy';
      case 'maintenance':
      case 'under_repair':
        return 'maintenance';
      default:
        return 'offline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return CheckCircle;
      case 'busy': return Clock;
      case 'maintenance': return Wrench;
      default: return XCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-alert-normal text-white';
      case 'busy': return 'bg-alert-caution text-black';
      case 'maintenance': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'available': return 'bg-alert-normal/10 border-alert-normal/30';
      case 'busy': return 'bg-alert-caution/10 border-alert-caution/30';
      case 'maintenance': return 'bg-primary/10 border-primary/30';
      default: return 'bg-muted/50 border-border';
    }
  };

  const countByStatus = (resources: Resource[]) => {
    return {
      available: resources.filter(r => r.status === 'available').length,
      busy: resources.filter(r => r.status === 'busy').length,
      maintenance: resources.filter(r => r.status === 'maintenance').length,
      offline: resources.filter(r => r.status === 'offline').length
    };
  };

  const renderResourceGrid = (resources: Resource[]) => (
    <div className="grid grid-cols-4 gap-2">
      {resources.map((resource) => {
        const Icon = getStatusIcon(resource.status);
        return (
          <div
            key={resource.id}
            className={`p-2 rounded-lg border text-center ${getStatusBg(resource.status)}`}
          >
            <Icon className={`w-4 h-4 mx-auto mb-1 ${
              resource.status === 'available' ? 'text-alert-normal' :
              resource.status === 'busy' ? 'text-alert-caution' :
              resource.status === 'maintenance' ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <p className="text-xs font-medium truncate">{resource.name}</p>
            <Badge className={`text-xs mt-1 ${getStatusColor(resource.status)}`}>
              {resource.status}
            </Badge>
          </div>
        );
      })}
      {resources.length === 0 && (
        <p className="col-span-4 text-center text-sm text-muted-foreground py-4">
          No resources found
        </p>
      )}
    </div>
  );

  const renderSummary = (resources: Resource[]) => {
    const counts = countByStatus(resources);
    return (
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center p-2 bg-alert-normal/10 rounded">
          <p className="text-lg font-bold text-alert-normal">{counts.available}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="text-center p-2 bg-alert-caution/10 rounded">
          <p className="text-lg font-bold text-alert-caution">{counts.busy}</p>
          <p className="text-xs text-muted-foreground">Busy</p>
        </div>
        <div className="text-center p-2 bg-primary/10 rounded">
          <p className="text-lg font-bold text-primary">{counts.maintenance}</p>
          <p className="text-xs text-muted-foreground">Maintenance</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded">
          <p className="text-lg font-bold text-muted-foreground">{counts.offline}</p>
          <p className="text-xs text-muted-foreground">Offline</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="w-5 h-5 text-primary" />
            Resource Availability Matrix
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchResources}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vehicles">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="vehicles" className="gap-1">
              <Car className="w-3 h-3" />
              Vehicles ({vehicles.length})
            </TabsTrigger>
            <TabsTrigger value="guards" className="gap-1">
              <Users className="w-3 h-3" />
              Guards ({guards.length})
            </TabsTrigger>
            <TabsTrigger value="equipment" className="gap-1">
              <Wrench className="w-3 h-3" />
              Equipment ({equipment.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles">
            {renderSummary(vehicles)}
            <ScrollArea className="h-48">
              {renderResourceGrid(vehicles)}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="guards">
            {renderSummary(guards)}
            <ScrollArea className="h-48">
              {renderResourceGrid(guards)}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="equipment">
            {renderSummary(equipment)}
            <ScrollArea className="h-48">
              {renderResourceGrid(equipment)}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResourceAvailabilityMatrix;
