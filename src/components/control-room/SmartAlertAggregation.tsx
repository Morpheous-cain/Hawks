import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, AlertTriangle, Shield, Radio, Eye, 
  CheckCircle, XCircle, Clock, Volume2, VolumeX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AggregatedAlert {
  id: string;
  type: string;
  source: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  count: number;
  acknowledged: boolean;
}

const SmartAlertAggregation = () => {
  const [alerts, setAlerts] = useState<AggregatedAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchAndAggregateAlerts();
    subscribeToAlerts();
  }, []);

  const fetchAndAggregateAlerts = async () => {
    const aggregatedAlerts: AggregatedAlert[] = [];

    try {
      // Fetch unacknowledged alarms
      const { data: alarms } = await supabase
        .from('alarm_activations')
        .select('*')
        .in('status', ['active', 'dispatched'])
        .order('triggered_at', { ascending: false });

      // Group alarms by type and location
      const alarmGroups = new Map<string, any[]>();
      alarms?.forEach(alarm => {
        const key = `${alarm.alarm_type}-${alarm.location}`;
        if (!alarmGroups.has(key)) {
          alarmGroups.set(key, []);
        }
        alarmGroups.get(key)?.push(alarm);
      });

      alarmGroups.forEach((group, key) => {
        const latest = group[0];
        aggregatedAlerts.push({
          id: latest.id,
          type: 'alarm',
          source: 'Alarms',
          title: `${latest.alarm_type} at ${latest.location}`,
          priority: latest.priority === 'high' ? 'critical' : latest.priority === 'medium' ? 'high' : 'medium',
          timestamp: new Date(latest.triggered_at),
          count: group.length,
          acknowledged: latest.acknowledged_at !== null
        });
      });

      // Fetch critical incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .in('severity', ['critical', 'high'])
        .in('status', ['open', 'assigned'])
        .order('created_at', { ascending: false });

      incidents?.forEach(incident => {
        aggregatedAlerts.push({
          id: incident.id,
          type: 'incident',
          source: 'Incidents',
          title: `${incident.incident_type}: ${incident.incident_number}`,
          priority: incident.severity === 'critical' ? 'critical' : 'high',
          timestamp: new Date(incident.created_at),
          count: 1,
          acknowledged: incident.status !== 'open'
        });
      });

      // Fetch critical advisories
      const { data: advisories } = await supabase
        .from('strategic_advisories')
        .select('*')
        .eq('severity', 'CRITICAL')
        .eq('status', 'Active')
        .order('timestamp_detected', { ascending: false });

      advisories?.forEach((advisory: any) => {
        aggregatedAlerts.push({
          id: advisory.id,
          type: 'advisory',
          source: 'Strategic',
          title: `${advisory.category}: ${advisory.title}`,
          priority: 'critical',
          timestamp: new Date(advisory.timestamp_detected),
          count: 1,
          acknowledged: advisory.acknowledged_at !== null
        });
      });

      // Sort by priority and timestamp
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      aggregatedAlerts.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setAlerts(aggregatedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const subscribeToAlerts = () => {
    const channels = [
      supabase.channel('smart-alarms').on('postgres_changes', { event: '*', schema: 'public', table: 'alarm_activations' }, fetchAndAggregateAlerts),
      supabase.channel('smart-incidents').on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchAndAggregateAlerts),
      supabase.channel('smart-advisories').on('postgres_changes', { event: '*', schema: 'public', table: 'strategic_advisories' }, fetchAndAggregateAlerts),
    ];

    channels.forEach(c => c.subscribe());
    return () => channels.forEach(c => supabase.removeChannel(c));
  };

  const acknowledgeAlert = async (alert: AggregatedAlert) => {
    try {
      if (alert.type === 'alarm') {
        await supabase.from('alarm_activations').update({ acknowledged_at: new Date().toISOString() }).eq('id', alert.id);
      } else if (alert.type === 'incident') {
        await supabase.from('incidents').update({ status: 'assigned' }).eq('id', alert.id);
      } else if (alert.type === 'advisory') {
        await supabase.from('strategic_advisories').update({ acknowledged_at: new Date().toISOString() }).eq('id', alert.id);
      }
      fetchAndAggregateAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-alert-critical text-alert-critical-foreground border-alert-critical';
      case 'high': return 'bg-alert-caution text-alert-caution-foreground border-alert-caution';
      case 'medium': return 'bg-primary/20 text-primary border-primary';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Alarms': return <Bell className="w-4 h-4" />;
      case 'Incidents': return <Shield className="w-4 h-4" />;
      case 'Strategic': return <Eye className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const criticalCount = alerts.filter(a => a.priority === 'critical' && !a.acknowledged).length;

  return (
    <Card className={criticalCount > 0 ? 'border-alert-critical/50' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${criticalCount > 0 ? 'text-alert-critical animate-pulse' : 'text-primary'}`} />
            Smart Alerts
          </span>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-alert-critical animate-pulse">{criticalCount} Critical</Badge>
            )}
            <Badge variant="outline">{alerts.length} Total</Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={`${alert.type}-${alert.id}`}
                className={`p-3 rounded-lg border-l-4 ${getPriorityColor(alert.priority)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(alert.source)}
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{alert.source}</Badge>
                        {alert.count > 1 && <Badge variant="secondary">{alert.count}x</Badge>}
                        <Clock className="w-3 h-3" />
                        {format(alert.timestamp, 'HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert)}
                      className="h-7 text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ack
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-alert-normal" />
                <p className="text-sm">All clear - no active alerts</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SmartAlertAggregation;
