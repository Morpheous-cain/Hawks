import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WelfareHSEMonitor = () => {
  const [welfareEvents, setWelfareEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchWelfareEvents();
    subscribeToWelfareEvents();
  }, []);

  const fetchWelfareEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('welfare_events')
        .select('*, staff(full_name, mobile_number), sites(site_name)')
        .in('status', ['active', 'investigating'])
        .order('triggered_at', { ascending: false });

      if (error) throw error;
      setWelfareEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching welfare events:', error);
      toast.error('Failed to fetch welfare events');
    }
  };

  const subscribeToWelfareEvents = () => {
    const channel = supabase
      .channel('welfare-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'welfare_events'
        },
        (payload) => {
          toast.error(`⚠️ WELFARE ALERT: ${payload.new.event_type}`, {
            duration: 10000
          });
          fetchWelfareEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleWelfareCheck = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('welfare_events')
        .update({
          handled_by_operator: user.id,
          status: 'investigating',
          action_taken: 'Welfare check initiated by control room'
        })
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Welfare check logged');
      fetchWelfareEvents();
    } catch (error: any) {
      toast.error('Failed to log welfare check');
      console.error(error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-alert-critical';
      case 'high': return 'bg-alert-caution';
      case 'medium': return 'bg-alert-caution/70';
      default: return 'bg-muted';
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Welfare & HSE Monitor
            </span>
            <Badge variant="outline">{welfareEvents.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {welfareEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active welfare concerns
            </p>
          ) : (
            welfareEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border-2 ${
                  event.severity === 'critical'
                    ? 'bg-alert-critical/10 border-alert-critical/30'
                    : 'bg-muted/30 border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <h3 className="font-bold">{event.event_type.replace('_', ' ').toUpperCase()}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Guard:</strong> {event.staff?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Site:</strong> {event.sites?.site_name || 'Unknown'}
                    </p>
                    {event.gps_location && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Location:</strong> {event.gps_location}
                      </p>
                    )}
                    {event.last_known_activity && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Last Activity:</strong> {getTimeSince(event.last_known_activity)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 text-right">
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {getTimeSince(event.triggered_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {event.status === 'active' && (
                    <Button
                      size="sm"
                      className="bg-primary"
                      onClick={() => handleWelfareCheck(event.id)}
                    >
                      Log Welfare Check
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Call Guard
                  </Button>
                  <Button size="sm" variant="outline">
                    Dispatch Supervisor
                  </Button>
                  <Button size="sm" variant="outline">
                    Escalate
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WelfareHSEMonitor;