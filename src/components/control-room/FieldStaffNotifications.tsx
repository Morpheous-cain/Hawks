import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, Send, Users, Car, Shield, AlertTriangle,
  CheckCircle, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FieldUnit {
  id: string;
  name: string;
  type: 'vehicle' | 'guard' | 'supervisor';
  status: string;
  location?: string;
}

interface SentNotification {
  id: string;
  message: string;
  recipients: number;
  sentAt: string;
  priority: string;
}

const FieldStaffNotifications = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [fieldUnits, setFieldUnits] = useState<FieldUnit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<SentNotification[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchFieldUnits();
    fetchRecentNotifications();
  }, []);

  const fetchFieldUnits = async () => {
    const units: FieldUnit[] = [];

    // Fetch vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, call_sign, status')
      .eq('is_active', true);

    vehicles?.forEach(v => {
      units.push({
        id: v.id,
        name: v.call_sign,
        type: 'vehicle',
        status: v.status || 'available'
      });
    });

    // Fetch staff on duty
    const { data: staff } = await supabase
      .from('staff')
      .select('id, full_name, position, status')
      .eq('status', 'active');

    staff?.forEach(s => {
      units.push({
        id: s.id,
        name: s.full_name,
        type: s.position?.toLowerCase().includes('supervisor') ? 'supervisor' : 'guard',
        status: s.status || 'active'
      });
    });

    setFieldUnits(units);
  };

  const fetchRecentNotifications = async () => {
    const { data } = await supabase
      .from('audit_trail')
      .select('id, changes, timestamp')
      .eq('action', 'FIELD_NOTIFICATION')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (data) {
      const notifications: SentNotification[] = data.map(n => ({
        id: n.id,
        message: (n.changes as any)?.message || '',
        recipients: (n.changes as any)?.recipients || 0,
        sentAt: n.timestamp || '',
        priority: (n.changes as any)?.priority || 'normal'
      }));
      setRecentNotifications(notifications);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUnits(fieldUnits.map(u => u.id));
    } else {
      setSelectedUnits([]);
    }
  };

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits(prev => 
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const sendNotification = async () => {
    if (!message.trim() || selectedUnits.length === 0) {
      toast.error('Please enter a message and select recipients');
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
        action: 'FIELD_NOTIFICATION',
        module: 'control_room',
        changes: {
          message: message.trim(),
          priority,
          recipients: selectedUnits.length,
          unit_ids: selectedUnits
        }
      });

      // In production, this would send actual push notifications
      // For now, we simulate the notification being sent

      toast.success(`Notification sent to ${selectedUnits.length} field units`);
      setDialogOpen(false);
      setMessage('');
      setPriority('normal');
      setSelectedUnits([]);
      setSelectAll(false);
      fetchRecentNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return Car;
      case 'supervisor': return Shield;
      default: return Users;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-alert-critical text-white';
      case 'high': return 'bg-alert-caution text-black';
      default: return 'bg-alert-normal text-white';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-primary" />
            Field Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </Button>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Recent Notifications</p>
            {recentNotifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <Badge className={`text-xs ${getPriorityColor(notif.priority)}`}>
                    {notif.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notif.sentAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs truncate">{notif.message}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="w-3 h-3" />
                  <span>{notif.recipients} recipients</span>
                </div>
              </div>
            ))}
            {recentNotifications.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No recent notifications
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Send Field Notification
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message..."
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Recipients</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </div>
              <ScrollArea className="h-40 border rounded-lg p-2">
                <div className="space-y-2">
                  {fieldUnits.map((unit) => {
                    const Icon = getUnitIcon(unit.type);
                    return (
                      <div
                        key={unit.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded"
                      >
                        <Checkbox
                          checked={selectedUnits.includes(unit.id)}
                          onCheckedChange={() => handleUnitToggle(unit.id)}
                        />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1">{unit.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {unit.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedUnits.length} of {fieldUnits.length} selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendNotification}
              disabled={!message.trim() || selectedUnits.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Send to {selectedUnits.length} Units
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FieldStaffNotifications;
