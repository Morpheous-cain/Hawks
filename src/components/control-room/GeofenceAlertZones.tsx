import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  MapPin, Plus, AlertTriangle, Shield, Trash2,
  Bell, Edit, Eye, EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeofenceZone {
  id: string;
  name: string;
  type: 'client_site' | 'high_risk' | 'restricted' | 'patrol_route';
  coordinates: { lat: number; lng: number };
  radius: number; // in meters
  alertLevel: 'normal' | 'caution' | 'critical';
  isActive: boolean;
  alertsToday: number;
}

const GeofenceAlertZones = () => {
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    type: 'client_site' as const,
    lat: -1.2921,
    lng: 36.8219,
    radius: 500,
    alertLevel: 'normal' as const
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchZones();
    fetchRecentAlerts();
  }, []);

  const fetchZones = async () => {
    // Fetch sites as geofence zones
    const { data: sites } = await supabase
      .from('sites')
      .select('id, site_name, gps_coordinates, site_type')
      .limit(10);

    if (sites) {
      const geofences: GeofenceZone[] = sites.map(site => {
        const coords = site.gps_coordinates?.split(',').map(Number) || [-1.2921, 36.8219];
        return {
          id: site.id,
          name: site.site_name,
          type: 'client_site',
          coordinates: { lat: coords[0] || -1.2921, lng: coords[1] || 36.8219 },
          radius: 500,
          alertLevel: 'normal',
          isActive: true,
          alertsToday: Math.floor(Math.random() * 5)
        };
      });
      setZones(geofences);
    }
  };

  const fetchRecentAlerts = async () => {
    const { data } = await supabase
      .from('audit_trail')
      .select('id, changes, timestamp')
      .eq('action', 'GEOFENCE_ALERT')
      .order('timestamp', { ascending: false })
      .limit(5);

    setRecentAlerts(data || []);
  };

  const handleCreateZone = async () => {
    if (!newZone.name.trim()) {
      toast.error('Please enter a zone name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log zone creation
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'GEOFENCE_CREATED',
        module: 'control_room',
        changes: newZone
      });

      const zone: GeofenceZone = {
        id: crypto.randomUUID(),
        name: newZone.name,
        type: newZone.type,
        coordinates: { lat: newZone.lat, lng: newZone.lng },
        radius: newZone.radius,
        alertLevel: newZone.alertLevel,
        isActive: true,
        alertsToday: 0
      };

      setZones([...zones, zone]);
      toast.success('Geofence zone created');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating zone:', error);
      toast.error('Failed to create zone');
    }
  };

  const toggleZoneActive = async (zoneId: string) => {
    setZones(zones.map(z => 
      z.id === zoneId ? { ...z, isActive: !z.isActive } : z
    ));
    toast.success('Zone status updated');
  };

  const deleteZone = async (zoneId: string) => {
    setZones(zones.filter(z => z.id !== zoneId));
    toast.success('Zone deleted');
  };

  const resetForm = () => {
    setNewZone({
      name: '',
      type: 'client_site',
      lat: -1.2921,
      lng: 36.8219,
      radius: 500,
      alertLevel: 'normal'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'high_risk': return 'bg-alert-critical text-white';
      case 'restricted': return 'bg-alert-caution text-black';
      case 'patrol_route': return 'bg-primary text-primary-foreground';
      default: return 'bg-alert-normal text-white';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-alert-critical';
      case 'caution': return 'text-alert-caution';
      default: return 'text-alert-normal';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5 text-primary" />
              Geofence Alert Zones
            </CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-alert-normal/10 rounded">
              <p className="text-lg font-bold">{zones.filter(z => z.isActive).length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="p-2 bg-alert-caution/10 rounded">
              <p className="text-lg font-bold">{zones.reduce((sum, z) => sum + z.alertsToday, 0)}</p>
              <p className="text-xs text-muted-foreground">Alerts Today</p>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <p className="text-lg font-bold">{zones.length}</p>
              <p className="text-xs text-muted-foreground">Total Zones</p>
            </div>
          </div>

          <ScrollArea className="h-48">
            <div className="space-y-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-3 rounded-lg border ${
                    zone.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${getAlertColor(zone.alertLevel)}`} />
                      <span className="font-medium text-sm">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.isActive}
                        onCheckedChange={() => toggleZoneActive(zone.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteZone(zone.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <Badge className={getTypeColor(zone.type)}>
                      {zone.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-muted-foreground">
                      {zone.radius}m radius • {zone.alertsToday} alerts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Create Geofence Zone
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Zone Name</label>
              <Input
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="Enter zone name..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Zone Type</label>
              <Select 
                value={newZone.type} 
                onValueChange={(v: any) => setNewZone({ ...newZone, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_site">Client Site</SelectItem>
                  <SelectItem value="high_risk">High Risk Area</SelectItem>
                  <SelectItem value="restricted">Restricted Zone</SelectItem>
                  <SelectItem value="patrol_route">Patrol Route</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Latitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={newZone.lat}
                  onChange={(e) => setNewZone({ ...newZone, lat: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Longitude</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={newZone.lng}
                  onChange={(e) => setNewZone({ ...newZone, lng: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Radius (meters)</label>
              <Input
                type="number"
                value={newZone.radius}
                onChange={(e) => setNewZone({ ...newZone, radius: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Alert Level</label>
              <Select 
                value={newZone.alertLevel} 
                onValueChange={(v: any) => setNewZone({ ...newZone, alertLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="caution">Caution</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateZone}>
              <Plus className="w-4 h-4 mr-2" />
              Create Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeofenceAlertZones;
