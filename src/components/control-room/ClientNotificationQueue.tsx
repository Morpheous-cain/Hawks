import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

interface NotificationItem {
  id: string;
  incident_id: string;
  client_name: string;
  incident_type: string;
  severity: string;
  notification_sent: boolean;
  created_at: string;
}

const ClientNotificationQueue = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*, clients(legal_name), sites(site_name)')
      .in('severity', ['high', 'critical'])
      .in('status', ['open', 'in_progress'])
      .order('occurred_at', { ascending: false })
      .limit(20);

    if (data) {
      // Look up which incidents already have a sent notification ticket
      const incidentNumbers = data.map((d: any) => d.incident_number).filter(Boolean);
      const { data: sentTickets } = await supabase
        .from('communication_tickets')
        .select('subject')
        .ilike('subject', 'Client Notification:%')
        .in('subject', incidentNumbers.map(n => `Client Notification: ${n}`));
      const sentSet = new Set((sentTickets || []).map((t: any) => t.subject.replace('Client Notification: ', '')));

      const items: NotificationItem[] = data.map((item: any) => ({
        id: item.id,
        incident_id: item.incident_number,
        client_name: item.clients?.legal_name || 'Unknown Client',
        incident_type: item.incident_type,
        severity: item.severity,
        notification_sent: sentSet.has(item.incident_number),
        created_at: item.occurred_at,
        client_id: item.client_id,
      } as any));
      setNotifications(items);
    }
  };

  const sendNotification = async (notification: any) => {
    try {
      const { error } = await supabase.from('communication_tickets').insert([{
        ticket_number: `TKT-${Date.now()}`,
        client_id: notification.client_id,
        channel: 'web_form' as const,
        subject: `Client Notification: ${notification.incident_id}`,
        message: `A ${notification.severity.toUpperCase()} severity ${notification.incident_type} incident has been recorded and is being actioned by our control room.`,
        status: 'new' as const,
        priority: (notification.severity === 'critical' ? 'high' : 'normal') as any,
        sender_contact: 'control-room@blackhawk',
      }]);
      if (error) throw error;
      toast.success(`Notification sent to ${notification.client_name}`);
      fetchNotifications();
    } catch (e: any) {
      toast.error(`Failed to send: ${e.message}`);
    }
  };

  const getPendingCount = () => notifications.filter(n => !n.notification_sent).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Client Notification Queue
          </span>
          <Badge variant="outline">{getPendingCount()} Pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Inbox is clear"
            description="Client notifications for incidents, alarms, and dispatches will appear here as soon as Control Room operators trigger them."
          />
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 bg-muted/30 rounded-lg border-2 border-primary/20"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{notification.client_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {notification.incident_id} - {notification.incident_type}
                  </p>
                </div>
                <Badge className={
                  notification.severity === 'critical' ? 'bg-alert-critical' : 'bg-alert-caution'
                }>
                  {notification.severity}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(notification.created_at).toLocaleTimeString()}
                </span>
                {notification.notification_sent ? (
                  <Badge className="bg-alert-normal">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Sent
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => sendNotification(notification)}
                    className="bg-primary"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ClientNotificationQueue;
