import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Link2, AlertTriangle, Bell, Shield, MapPin, 
  Camera, Radio, ChevronRight, Unlink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CorrelatedEvent {
  id: string;
  primaryEvent: {
    type: string;
    id: string;
    title: string;
    timestamp: Date;
  };
  linkedEvents: {
    type: string;
    id: string;
    title: string;
    timestamp: Date;
  }[];
  correlationType: 'location' | 'time' | 'client' | 'severity';
}

const CrossModuleEventCorrelation = () => {
  const [correlatedEvents, setCorrelatedEvents] = useState<CorrelatedEvent[]>([]);

  useEffect(() => {
    findCorrelations();
  }, []);

  const findCorrelations = async () => {
    const correlations: CorrelatedEvent[] = [];

    try {
      // Fetch recent incidents with location
      const { data: incidents } = await supabase
        .from('incidents')
        .select('id, incident_number, location, created_at, site_id')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch recent alarms
      const { data: alarms } = await supabase
        .from('alarm_activations')
        .select('id, alarm_number, location, triggered_at, site_id')
        .order('triggered_at', { ascending: false })
        .limit(20);

      // Fetch patrol checkpoints
      const { data: patrols } = await supabase
        .from('patrol_checkpoints')
        .select('id, entry_number, gps_coordinates, scanned_at, patrol_id')
        .eq('incident_flag', true)
        .order('scanned_at', { ascending: false })
        .limit(20);

      // Find correlations by site/location
      incidents?.forEach(incident => {
        const linkedEvents: any[] = [];

        // Find alarms at same site
        alarms?.forEach(alarm => {
          if (alarm.site_id === incident.site_id || 
              (alarm.location && incident.location && 
               alarm.location.toLowerCase().includes(incident.location.toLowerCase().split(' ')[0]))) {
            linkedEvents.push({
              type: 'alarm',
              id: alarm.alarm_number,
              title: `Alarm: ${alarm.alarm_number}`,
              timestamp: new Date(alarm.triggered_at)
            });
          }
        });

        // Find patrols with incidents nearby
        patrols?.forEach(patrol => {
          if (patrol.gps_coordinates && incident.location) {
            linkedEvents.push({
              type: 'patrol',
              id: patrol.entry_number || patrol.id,
              title: `Patrol Incident: ${patrol.entry_number || 'N/A'}`,
              timestamp: new Date(patrol.scanned_at || patrol.id)
            });
          }
        });

        if (linkedEvents.length > 0) {
          correlations.push({
            id: incident.id,
            primaryEvent: {
              type: 'incident',
              id: incident.incident_number,
              title: `Incident: ${incident.incident_number}`,
              timestamp: new Date(incident.created_at)
            },
            linkedEvents: linkedEvents.slice(0, 3),
            correlationType: 'location'
          });
        }
      });

      // Time-based correlations (events within 30 minutes)
      alarms?.forEach(alarm => {
        const alarmTime = new Date(alarm.triggered_at).getTime();
        const linkedIncidents = incidents?.filter(i => {
          const incidentTime = new Date(i.created_at).getTime();
          return Math.abs(alarmTime - incidentTime) < 30 * 60 * 1000; // 30 minutes
        });

        if (linkedIncidents && linkedIncidents.length > 0) {
          const existing = correlations.find(c => c.primaryEvent.id === alarm.alarm_number);
          if (!existing) {
            correlations.push({
              id: alarm.id,
              primaryEvent: {
                type: 'alarm',
                id: alarm.alarm_number,
                title: `Alarm: ${alarm.alarm_number}`,
                timestamp: new Date(alarm.triggered_at)
              },
              linkedEvents: linkedIncidents.slice(0, 3).map(i => ({
                type: 'incident',
                id: i.incident_number,
                title: `Incident: ${i.incident_number}`,
                timestamp: new Date(i.created_at)
              })),
              correlationType: 'time'
            });
          }
        }
      });

      setCorrelatedEvents(correlations.slice(0, 10));
    } catch (error) {
      console.error('Error finding correlations:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return <Shield className="w-3 h-3" />;
      case 'alarm': return <Bell className="w-3 h-3" />;
      case 'patrol': return <MapPin className="w-3 h-3" />;
      case 'cctv': return <Camera className="w-3 h-3" />;
      default: return <Radio className="w-3 h-3" />;
    }
  };

  const getCorrelationBadge = (type: string) => {
    switch (type) {
      case 'location': return <Badge variant="outline" className="text-xs">Location Match</Badge>;
      case 'time': return <Badge variant="outline" className="text-xs">Time Proximity</Badge>;
      case 'client': return <Badge variant="outline" className="text-xs">Same Client</Badge>;
      case 'severity': return <Badge variant="outline" className="text-xs">Severity Pattern</Badge>;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-5 h-5 text-primary" />
          Event Correlation
          <Badge variant="outline" className="ml-auto">{correlatedEvents.length} Linked</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {correlatedEvents.map((correlation) => (
              <div
                key={correlation.id}
                className="p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(correlation.primaryEvent.type)}
                    <span className="text-sm font-medium">{correlation.primaryEvent.title}</span>
                  </div>
                  {getCorrelationBadge(correlation.correlationType)}
                </div>
                
                <div className="pl-4 border-l-2 border-primary/30 space-y-1">
                  {correlation.linkedEvents.map((event, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="w-3 h-3" />
                      {getTypeIcon(event.type)}
                      <span>{event.title}</span>
                      <span className="ml-auto">{format(event.timestamp, 'HH:mm')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7">
                    View Chain
                  </Button>
                </div>
              </div>
            ))}

            {correlatedEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Unlink className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No correlations found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CrossModuleEventCorrelation;
