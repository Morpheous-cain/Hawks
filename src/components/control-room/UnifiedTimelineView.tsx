import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, Shield, Bell, MapPin, Camera, Radio, 
  Users, FileText, Wrench, Eye, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subHours, isWithinInterval } from "date-fns";

interface TimelineEvent {
  id: string;
  module: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}

const UnifiedTimelineView = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [timeRange, setTimeRange] = useState('24');
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    fetchTimelineEvents();
  }, [timeRange, moduleFilter]);

  const fetchTimelineEvents = async () => {
    const allEvents: TimelineEvent[] = [];
    const cutoffTime = subHours(new Date(), parseInt(timeRange));

    try {
      // Fetch incidents
      if (moduleFilter === 'all' || moduleFilter === 'incidents') {
        const { data: incidents } = await supabase
          .from('incidents')
          .select('*')
          .gte('created_at', cutoffTime.toISOString())
          .order('created_at', { ascending: false });

        incidents?.forEach(i => allEvents.push({
          id: `incident-${i.id}`,
          module: 'Incidents',
          type: 'incident',
          title: i.incident_number,
          description: `${i.incident_type} at ${i.location}`,
          timestamp: new Date(i.created_at),
          severity: i.severity === 'critical' ? 'critical' : i.severity === 'high' ? 'warning' : 'info'
        }));
      }

      // Fetch alarms
      if (moduleFilter === 'all' || moduleFilter === 'alarms') {
        const { data: alarms } = await supabase
          .from('alarm_activations')
          .select('*')
          .gte('triggered_at', cutoffTime.toISOString())
          .order('triggered_at', { ascending: false });

        alarms?.forEach(a => allEvents.push({
          id: `alarm-${a.id}`,
          module: 'Alarms',
          type: 'alarm',
          title: a.alarm_number,
          description: `${a.alarm_type} - ${a.location}`,
          timestamp: new Date(a.triggered_at),
          severity: a.priority === 'high' ? 'critical' : a.priority === 'medium' ? 'warning' : 'info'
        }));
      }

      // Fetch patrol checkpoints
      if (moduleFilter === 'all' || moduleFilter === 'patrols') {
        const { data: patrols } = await supabase
          .from('patrol_checkpoints')
          .select('*, patrols(site_name)')
          .gte('scanned_at', cutoffTime.toISOString())
          .order('scanned_at', { ascending: false });

        patrols?.forEach(p => allEvents.push({
          id: `patrol-${p.id}`,
          module: 'Patrols',
          type: 'patrol',
          title: p.entry_number || 'Checkpoint',
          description: `Scan at ${p.patrols?.site_name || 'Unknown'}`,
          timestamp: new Date(p.scanned_at || p.created_at),
          severity: p.incident_flag ? 'warning' : 'info'
        }));
      }

      // Fetch advisories
      if (moduleFilter === 'all' || moduleFilter === 'strategic') {
        const { data: advisories } = await supabase
          .from('strategic_advisories')
          .select('*')
          .gte('timestamp_detected', cutoffTime.toISOString())
          .order('timestamp_detected', { ascending: false });

        advisories?.forEach(a => allEvents.push({
          id: `advisory-${a.id}`,
          module: 'Strategic',
          type: 'advisory',
          title: a.incident_id,
          description: `${a.category}: ${a.title}`,
          timestamp: new Date(a.timestamp_detected),
          severity: a.severity === 'CRITICAL' ? 'critical' : a.severity === 'CAUTION' ? 'warning' : 'info'
        }));
      }

      // Fetch work orders
      if (moduleFilter === 'all' || moduleFilter === 'technical') {
        const { data: workOrders } = await supabase
          .from('technical_work_orders')
          .select('*')
          .gte('created_at', cutoffTime.toISOString())
          .order('created_at', { ascending: false });

        workOrders?.forEach((w: any) => allEvents.push({
          id: `work-${w.id}`,
          module: 'Technical',
          type: 'work_order',
          title: w.work_order_number,
          description: `${w.fault_type || 'Work Order'} - ${w.status}`,
          timestamp: new Date(w.created_at),
          severity: w.priority === 'critical' || w.priority === 'urgent' ? 'critical' : 'info'
        }));
      }

      // Sort by timestamp
      allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Incidents': return <Shield className="w-4 h-4" />;
      case 'Alarms': return <Bell className="w-4 h-4" />;
      case 'Patrols': return <MapPin className="w-4 h-4" />;
      case 'Strategic': return <Eye className="w-4 h-4" />;
      case 'Technical': return <Wrench className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-alert-critical bg-alert-critical/10';
      case 'warning': return 'border-alert-caution bg-alert-caution/10';
      default: return 'border-border bg-muted/30';
    }
  };

  // Group events by hour
  const groupedEvents = events.reduce((acc, event) => {
    const hourKey = format(event.timestamp, 'yyyy-MM-dd HH:00');
    if (!acc[hourKey]) {
      acc[hourKey] = [];
    }
    acc[hourKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Unified Timeline
          </span>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 Hours</SelectItem>
                <SelectItem value="12">12 Hours</SelectItem>
                <SelectItem value="24">24 Hours</SelectItem>
                <SelectItem value="48">48 Hours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="incidents">Incidents</SelectItem>
                <SelectItem value="alarms">Alarms</SelectItem>
                <SelectItem value="patrols">Patrols</SelectItem>
                <SelectItem value="strategic">Strategic</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[420px]">
          <div className="p-4">
            {Object.entries(groupedEvents).map(([hourKey, hourEvents]) => (
              <div key={hourKey} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {format(new Date(hourKey), 'MMM d, HH:mm')}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 rounded-lg border-l-2 ${getSeverityColor(event.severity)}`}
                    >
                      <div className="flex items-center gap-2">
                        {getModuleIcon(event.module)}
                        <span className="text-sm font-medium">{event.title}</span>
                        <Badge variant="outline" className="text-xs ml-auto">{event.module}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(event.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 pl-6">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {events.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No events in selected time range</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UnifiedTimelineView;
