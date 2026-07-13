import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, AlertTriangle, Bell, Camera, Shield, Radio, 
  MapPin, Truck, Users, FileText, Wrench, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface FeedItem {
  id: string;
  module: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  metadata?: any;
}

const UnifiedModuleActivityFeed = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    fetchAllModuleData();
    subscribeToAllModules();
  }, []);

  const fetchAllModuleData = async () => {
    const items: FeedItem[] = [];

    // Fetch incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    incidents?.forEach(i => items.push({
      id: `incident-${i.id}`,
      module: 'Incidents',
      type: 'incident',
      message: `${i.incident_number}: ${i.incident_type} at ${i.location}`,
      severity: i.severity === 'critical' ? 'critical' : i.severity === 'high' ? 'warning' : 'info',
      timestamp: new Date(i.created_at),
      metadata: i
    }));

    // Fetch alarms
    const { data: alarms } = await supabase
      .from('alarm_activations')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(10);

    alarms?.forEach(a => items.push({
      id: `alarm-${a.id}`,
      module: 'Alarms',
      type: 'alarm',
      message: `${a.alarm_number}: ${a.alarm_type} - ${a.location}`,
      severity: a.priority === 'high' ? 'critical' : a.priority === 'medium' ? 'warning' : 'info',
      timestamp: new Date(a.triggered_at),
      metadata: a
    }));

    // Fetch patrols
    const { data: patrols } = await supabase
      .from('patrol_checkpoints')
      .select('*, patrols(patrol_id, site_name)')
      .order('scanned_at', { ascending: false })
      .limit(10);

    patrols?.forEach(p => items.push({
      id: `patrol-${p.id}`,
      module: 'Patrols',
      type: 'patrol',
      message: `Checkpoint scanned: ${p.patrols?.site_name || 'Unknown Site'}`,
      severity: p.incident_flag ? 'warning' : 'info',
      timestamp: new Date(p.scanned_at || p.created_at),
      metadata: p
    }));

    // Fetch strategic advisories
    const { data: advisories } = await supabase
      .from('strategic_advisories')
      .select('*')
      .order('timestamp_detected', { ascending: false })
      .limit(10);

    advisories?.forEach(a => items.push({
      id: `advisory-${a.id}`,
      module: 'Strategic',
      type: 'advisory',
      message: `${a.category}: ${a.title}`,
      severity: a.severity === 'CRITICAL' ? 'critical' : a.severity === 'CAUTION' ? 'warning' : 'info',
      timestamp: new Date(a.timestamp_detected),
      metadata: a
    }));

    // Fetch work orders
    const { data: workOrders } = await supabase
      .from('technical_work_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    workOrders?.forEach((w: any) => items.push({
      id: `workorder-${w.id}`,
      module: 'Technical',
      type: 'work_order',
      message: `${w.work_order_number}: ${w.fault_type || 'Work Order'} - ${w.status}`,
      severity: w.priority === 'urgent' || w.priority === 'critical' ? 'critical' : 'info',
      timestamp: new Date(w.created_at),
      metadata: w
    }));

    // Sort by timestamp
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setFeedItems(items.slice(0, 50));
  };

  const subscribeToAllModules = () => {
    const channels = [
      supabase.channel('unified-incidents').on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchAllModuleData),
      supabase.channel('unified-alarms').on('postgres_changes', { event: '*', schema: 'public', table: 'alarm_activations' }, fetchAllModuleData),
      supabase.channel('unified-patrols').on('postgres_changes', { event: '*', schema: 'public', table: 'patrol_checkpoints' }, fetchAllModuleData),
      supabase.channel('unified-advisories').on('postgres_changes', { event: '*', schema: 'public', table: 'strategic_advisories' }, fetchAllModuleData),
      supabase.channel('unified-workorders').on('postgres_changes', { event: '*', schema: 'public', table: 'technical_work_orders' }, fetchAllModuleData),
    ];

    channels.forEach(c => c.subscribe());

    return () => channels.forEach(c => supabase.removeChannel(c));
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Incidents': return <Shield className="w-4 h-4" />;
      case 'Alarms': return <Bell className="w-4 h-4" />;
      case 'Patrols': return <MapPin className="w-4 h-4" />;
      case 'Strategic': return <Eye className="w-4 h-4" />;
      case 'Technical': return <Wrench className="w-4 h-4" />;
      case 'CCTV': return <Camera className="w-4 h-4" />;
      case 'Dispatch': return <Truck className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-alert-critical text-alert-critical-foreground';
      case 'warning': return 'bg-alert-caution text-alert-caution-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-primary" />
          Unified Activity Feed
          <Badge variant="outline" className="ml-auto">{feedItems.length} Events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[420px]">
          <div className="space-y-2 p-4">
            {feedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className={`p-2 rounded-full ${getSeverityColor(item.severity)}`}>
                  {getModuleIcon(item.module)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{item.module}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(item.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                  <p className="text-sm truncate">{item.message}</p>
                </div>
              </div>
            ))}
            {feedItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No activity to display</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UnifiedModuleActivityFeed;
