import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Bell, Radio, Phone, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  user: string;
  module: string;
}

const CommandHistoryTimeline = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    fetchCommandHistory();
    subscribeToUpdates();
  }, []);

  const fetchCommandHistory = async () => {
    const { data } = await supabase
      .from('audit_trail')
      .select('*, profiles(full_name)')
      .in('module', ['incidents', 'alarm_activations', 'patrols', 'comms_records'])
      .order('timestamp', { ascending: false })
      .limit(50);

    if (data) {
      const formattedEvents: TimelineEvent[] = data.map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp,
        type: item.action,
        description: getEventDescription(item),
        user: item.profiles?.full_name || 'System',
        module: item.module
      }));
      setEvents(formattedEvents);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('command-history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_trail'
        },
        () => {
          fetchCommandHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getEventDescription = (item: any) => {
    const action = item.action;
    const module = item.module;
    
    if (module === 'incidents') {
      return `${action} incident ${item.record_id?.substring(0, 8)}`;
    }
    if (module === 'alarm_activations') {
      return `${action} alarm ${item.record_id?.substring(0, 8)}`;
    }
    return `${action} in ${module}`;
  };

  const getEventIcon = (module: string) => {
    switch (module) {
      case 'incidents': return AlertTriangle;
      case 'alarm_activations': return Bell;
      case 'patrols': return Radio;
      case 'comms_records': return Phone;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    if (type.includes('create') || type.includes('INSERT')) return 'text-alert-normal';
    if (type.includes('update') || type.includes('UPDATE')) return 'text-primary';
    if (type.includes('delete') || type.includes('DELETE')) return 'text-alert-critical';
    return 'text-muted-foreground';
  };

  return (
    <Card className="h-[calc(100vh-12rem)] overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Command History Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 overflow-y-auto h-[calc(100%-5rem)]">
        {events.map((event) => {
          const Icon = getEventIcon(event.module);
          return (
            <div
              key={event.id}
              className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary/50 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-start gap-2 flex-1">
                  <Icon className={`w-4 h-4 mt-0.5 ${getEventColor(event.type)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      by {event.user}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground ml-6">
                {new Date(event.timestamp).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CommandHistoryTimeline;
