import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutGrid, Car, AlertTriangle, MapPin, Clock, 
  CheckCircle, ArrowRight, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DispatchItem {
  id: string;
  type: 'incident' | 'alarm';
  title: string;
  location: string;
  severity: string;
  status: string;
  assignedUnit?: string;
}

interface Unit {
  id: string;
  callSign: string;
  status: string;
  type: string;
}

const DragDropDispatchBoard = () => {
  const [unassignedItems, setUnassignedItems] = useState<DispatchItem[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [assignedItems, setAssignedItems] = useState<DispatchItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<DispatchItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch unassigned incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('id, title, location, severity, status')
        .in('status', ['open', 'assigned'])
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch unassigned alarms
      const { data: alarms } = await supabase
        .from('alarm_activations')
        .select('id, alarm_number, location, priority, status')
        .in('status', ['active', 'acknowledged'])
        .order('triggered_at', { ascending: false })
        .limit(10);

      // Fetch available vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, call_sign, status, vehicle_type')
        .eq('is_active', true);

      const items: DispatchItem[] = [];
      const assigned: DispatchItem[] = [];

      incidents?.forEach(inc => {
        const item = {
          id: inc.id,
          type: 'incident' as const,
          title: inc.title,
          location: inc.location || 'Unknown',
          severity: inc.severity,
          status: inc.status
        };
        if (inc.status === 'assigned') {
          assigned.push(item);
        } else {
          items.push(item);
        }
      });

      alarms?.forEach(alarm => {
        const item = {
          id: alarm.id,
          type: 'alarm' as const,
          title: alarm.alarm_number,
          location: alarm.location,
          severity: alarm.priority,
          status: alarm.status
        };
        if (alarm.status === 'dispatched') {
          assigned.push(item);
        } else {
          items.push(item);
        }
      });

      const units: Unit[] = vehicles?.map(v => ({
        id: v.id,
        callSign: v.call_sign,
        status: v.status || 'available',
        type: v.vehicle_type || 'vehicle'
      })) || [];

      setUnassignedItems(items);
      setAssignedItems(assigned);
      setAvailableUnits(units.filter(u => u.status === 'available'));
    } catch (error) {
      console.error('Error fetching dispatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (item: DispatchItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnUnit = async (unit: Unit) => {
    if (!draggedItem) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (draggedItem.type === 'incident') {
        await supabase
          .from('incidents')
          .update({ 
            status: 'assigned',
            assigned_to: user?.id
          })
          .eq('id', draggedItem.id);
      } else {
        await supabase
          .from('alarm_activations')
          .update({ 
            status: 'dispatched',
            assigned_vehicle_id: unit.id,
            dispatched_at: new Date().toISOString()
          })
          .eq('id', draggedItem.id);
      }

      // Update vehicle status
      await supabase
        .from('vehicles')
        .update({ status: 'assigned' })
        .eq('id', unit.id);

      toast.success(`${draggedItem.title} assigned to ${unit.callSign}`);
      fetchData();
    } catch (error) {
      console.error('Error assigning item:', error);
      toast.error('Failed to assign item');
    }

    setDraggedItem(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': case 'high': return 'border-alert-critical bg-alert-critical/10';
      case 'medium': return 'border-alert-caution bg-alert-caution/10';
      default: return 'border-alert-normal bg-alert-normal/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-alert-normal text-white';
      case 'assigned': case 'busy': return 'bg-alert-caution text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Dispatch Board
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Unassigned Queue */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-alert-caution" />
              <span className="font-medium text-sm">Unassigned ({unassignedItems.length})</span>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-2">
                {unassignedItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    className={`p-3 rounded-lg border-l-4 cursor-move hover:shadow-md transition-shadow ${getSeverityColor(item.severity)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {item.type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.severity}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>
                ))}
                {unassignedItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending items
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Available Units */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Available Units ({availableUnits.length})</span>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-2">
                {availableUnits.map((unit) => (
                  <div
                    key={unit.id}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnUnit(unit)}
                    className={`p-3 rounded-lg border-2 border-dashed transition-colors ${
                      draggedItem ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span className="font-medium text-sm">{unit.callSign}</span>
                      </div>
                      <Badge className={getStatusColor(unit.status)}>
                        {unit.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {unit.type}
                    </p>
                    {draggedItem && (
                      <div className="mt-2 text-xs text-primary flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Drop to assign
                      </div>
                    )}
                  </div>
                ))}
                {availableUnits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No units available
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Assigned/In Progress */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-alert-normal" />
              <span className="font-medium text-sm">Assigned ({assignedItems.length})</span>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-2">
                {assignedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-alert-normal/10 border border-alert-normal/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {item.type}
                      </span>
                      <Badge className="bg-alert-normal text-white text-xs">
                        In Progress
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>En route</span>
                    </div>
                  </div>
                ))}
                {assignedItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active assignments
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DragDropDispatchBoard;
