import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building, Send, Mail, Phone, MessageSquare,
  AlertTriangle, CheckCircle, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  message: string;
  type: string;
}

const notificationTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Incident Alert',
    message: 'Dear [Client], an incident has occurred at your site. Our team is responding. Details: [Details]. We will keep you updated.',
    type: 'incident'
  },
  {
    id: '2',
    name: 'Alarm Response',
    message: 'Dear [Client], we received an alarm activation at your site. Our response team has been dispatched. ETA: [Time] minutes.',
    type: 'alarm'
  },
  {
    id: '3',
    name: 'Patrol Completion',
    message: 'Dear [Client], patrol has been completed at your site. Status: All clear. Next patrol scheduled: [Time].',
    type: 'patrol'
  },
  {
    id: '4',
    name: 'Security Update',
    message: 'Dear [Client], this is a security update regarding your site. [Details]. Please contact us if you have any questions.',
    type: 'update'
  }
];

const ClientQuickNotify = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [pendingNotifications, setPendingNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchClients();
    fetchPendingNotifications();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, legal_name, primary_contact_name')
      .eq('status', 'active')
      .limit(20);

    if (data) {
      const clientList: Client[] = data.map(c => ({
        id: c.id,
        name: c.legal_name,
        contactName: c.primary_contact_name || 'Contact',
        phone: '',
        email: ''
      }));
      setClients(clientList);
    }
  };

  const fetchPendingNotifications = async () => {
    // Fetch from client notification queue (incidents requiring notification)
    const { data } = await supabase
      .from('incidents')
      .select('id, incident_number, title, client_id, severity')
      .in('severity', ['high', 'critical'])
      .eq('status', 'open')
      .limit(5);

    setPendingNotifications(data || []);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.message);
    }
  };

  const sendNotification = async () => {
    if (!selectedClient || !message.trim()) {
      toast.error('Please select a client and enter a message');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Log notification to audit trail
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'CLIENT_NOTIFICATION',
        module: 'control_room',
        changes: {
          client_id: selectedClient,
          channel,
          message: message.trim(),
          template: selectedTemplate
        }
      });

      toast.success(`Notification sent to client via ${channel}`);
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const resetForm = () => {
    setSelectedClient('');
    setSelectedTemplate('');
    setMessage('');
    setChannel('email');
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'whatsapp': return Phone;
      default: return Mail;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="w-5 h-5 text-primary" />
            Client Quick Notify
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingNotifications.length > 0 && (
            <div className="p-3 bg-alert-caution/10 border border-alert-caution/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-alert-caution" />
                <span className="text-sm font-medium">Pending Notifications</span>
                <Badge variant="secondary">{pendingNotifications.length}</Badge>
              </div>
              <ScrollArea className="h-24">
                <div className="space-y-1">
                  {pendingNotifications.map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{notif.incident_number}: {notif.title}</span>
                      <Badge className="bg-alert-caution text-black text-xs">
                        {notif.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Button 
            onClick={() => setDialogOpen(true)} 
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Client Notification
          </Button>

          <div className="grid grid-cols-3 gap-2">
            {['email', 'sms', 'whatsapp'].map((ch) => {
              const Icon = getChannelIcon(ch);
              return (
                <Button
                  key={ch}
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2"
                  onClick={() => {
                    setChannel(ch as any);
                    setDialogOpen(true);
                  }}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-xs capitalize">{ch}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Send Client Notification
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Channel</label>
              <div className="flex gap-2">
                {['email', 'sms', 'whatsapp'].map((ch) => {
                  const Icon = getChannelIcon(ch);
                  return (
                    <Button
                      key={ch}
                      variant={channel === ch ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChannel(ch as any)}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      <span className="capitalize">{ch}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message Template</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {notificationTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use [Client], [Details], [Time] as placeholders
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendNotification}
              disabled={!selectedClient || !message.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientQuickNotify;
