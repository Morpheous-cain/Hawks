import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Clock, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AlarmSOSDesk = () => {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchAlarmData();
    subscribeToAlarms();
  }, []);

  const fetchAlarmData = async () => {
    try {
      // Fetch active alarms with related data
      const { data: alarmsData } = await supabase
        .from('alarm_activations')
        .select('*, sites(site_name), clients(legal_name)')
        .in('status', ['active', 'dispatched', 'acknowledged'])
        .order('triggered_at', { ascending: false });

      // Fetch active SOS alerts with related data
      const { data: sosData } = await supabase
        .from('sos_alerts')
        .select('*, vehicles(callsign, registration_number), profiles(full_name)')
        .in('status', ['active', 'responding'])
        .order('triggered_at', { ascending: false });

      setAlarms(alarmsData || []);
      setSosAlerts(sosData || []);
    } catch (error) {
      console.error('Error fetching alarm data:', error);
      toast.error('Failed to fetch alarm data');
    }
  };

  const subscribeToAlarms = () => {
    const alarmChannel = supabase
      .channel('alarm-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarm_activations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.priority === 'high') {
            toast.error(`🚨 NEW ALARM: ${payload.new.alarm_number}`, {
              duration: 10000
            });
          }
          fetchAlarmData();
        }
      )
      .subscribe();

    const sosChannel = supabase
      .channel('sos-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.error(`🚨 SOS ALERT: ${payload.new.alert_number}`, {
              duration: 10000
            });
          }
          fetchAlarmData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alarmChannel);
      supabase.removeChannel(sosChannel);
    };
  };

  const acknowledgeAlarm = async (alarmId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('alarm_activations')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
          status: 'acknowledged'
        })
        .eq('id', alarmId);

      if (error) throw error;
      toast.success('Alarm acknowledged');
      fetchAlarmData();
    } catch (error: any) {
      toast.error('Failed to acknowledge alarm');
      console.error(error);
    }
  };

  const getTimeSince = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-alert-critical';
      case 'medium': return 'bg-alert-caution';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Critical SOS Alerts */}
      {sosAlerts.length > 0 && (
        <Card className="border-2 border-alert-critical bg-alert-critical/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-alert-critical">
              <AlertTriangle className="w-5 h-5" />
              ACTIVE SOS ALERTS - CRITICAL PRIORITY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sosAlerts.map((sos) => (
              <div
                key={sos.id}
                className="p-4 bg-background rounded-lg border-2 border-alert-critical"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{sos.alert_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {sos.profiles?.full_name || 'Unknown Officer'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vehicle: {sos.vehicles?.callsign || 'Unknown'}
                    </p>
                  </div>
                  <Badge className="bg-alert-critical">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeSince(sos.triggered_at)}
                  </Badge>
                </div>
                {sos.gps_lat && sos.gps_lng && (
                  <p className="text-sm mb-2">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    GPS: {sos.gps_lat.toFixed(4)}, {sos.gps_lng.toFixed(4)}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="bg-alert-critical">
                    <Phone className="w-3 h-3 mr-1" />
                    Call Officer
                  </Button>
                  <Button size="sm" variant="outline">Dispatch Backup</Button>
                  <Button size="sm" variant="outline">View on Map</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alarm Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Active Alarm Queue
            </span>
            <Badge variant="outline">{alarms.length} Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {alarms.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active alarms</p>
          ) : (
            alarms.map((alarm) => (
              <div
                key={alarm.id}
                className="p-4 bg-muted/30 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold">{alarm.alarm_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {alarm.clients?.legal_name || 'Unknown Client'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {alarm.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type: {alarm.alarm_type}
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <Badge className={getPriorityColor(alarm.priority)}>
                      {alarm.priority}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {getTimeSince(alarm.triggered_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {alarm.status === 'active' && (
                    <Button 
                      size="sm" 
                      className="bg-primary"
                      onClick={() => acknowledgeAlarm(alarm.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                  <Button size="sm" variant="outline">View CCTV</Button>
                  <Button size="sm" variant="outline">Dispatch Unit</Button>
                  <Button size="sm" variant="outline">False Alarm</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlarmSOSDesk;