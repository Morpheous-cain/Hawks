import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowRightLeft, CheckCircle, AlertTriangle, Clock, 
  FileText, User, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingItem {
  id: string;
  type: string;
  title: string;
  severity: string;
  module: string;
}

const ShiftHandoverAssistant = () => {
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    fetchPendingItems();
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use audit_trail to track current shift status since shift_logs may not exist
    const { data } = await supabase
      .from('audit_trail')
      .select('id, user_id, action, timestamp, changes')
      .eq('user_id', user.id)
      .eq('action', 'SHIFT_START')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setCurrentShift({ id: data.id, status: 'active', start_time: data.timestamp });
    }
  };

  const fetchPendingItems = async () => {
    const items: PendingItem[] = [];

    // Fetch open incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, title, severity')
      .in('status', ['open', 'assigned', 'in_progress'])
      .limit(5);

    incidents?.forEach(inc => {
      items.push({
        id: inc.id,
        type: 'Incident',
        title: inc.title,
        severity: inc.severity,
        module: 'incidents'
      });
    });

    // Fetch active alarms
    const { data: alarms } = await supabase
      .from('alarm_activations')
      .select('id, alarm_number, priority')
      .in('status', ['active', 'acknowledged', 'dispatched'])
      .limit(5);

    alarms?.forEach(alarm => {
      items.push({
        id: alarm.id,
        type: 'Alarm',
        title: alarm.alarm_number,
        severity: alarm.priority,
        module: 'alarms'
      });
    });

    // Fetch active SOS
    const { data: sos } = await supabase
      .from('sos_alerts')
      .select('id, alert_number')
      .in('status', ['active', 'responding'])
      .limit(5);

    sos?.forEach(s => {
      items.push({
        id: s.id,
        type: 'SOS',
        title: s.alert_number,
        severity: 'critical',
        module: 'sos'
      });
    });

    setPendingItems(items);
  };

  const handleStartHandover = () => {
    setHandoverDialogOpen(true);
  };

  const handleCompleteHandover = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Log handover to audit trail
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'SHIFT_HANDOVER',
        module: 'control_room',
        changes: {
          pending_items: pendingItems.length,
          notes: handoverNotes,
          acknowledged
        }
      });

      // Log shift end to audit trail
      if (currentShift) {
        await supabase.from('audit_trail').insert({
          user_id: user.id,
          action: 'SHIFT_END',
          module: 'control_room',
          changes: {
            shift_start: currentShift.start_time,
            handover_notes: handoverNotes
          }
        });
      }

      toast.success('Shift handover completed successfully');
      setHandoverDialogOpen(false);
      setHandoverNotes('');
      setAcknowledged(false);
    } catch (error) {
      console.error('Error completing handover:', error);
      toast.error('Failed to complete handover');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-alert-critical text-white';
      case 'high': return 'bg-alert-caution text-black';
      case 'medium': return 'bg-alert-normal text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Shift Handover
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Current Shift</span>
            </div>
            <Badge variant="outline">
              {currentShift ? 'Active' : 'No Active Shift'}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Items</span>
              <Badge variant="secondary">{pendingItems.length}</Badge>
            </div>
            
            {pendingItems.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-alert-caution" />
                  <span className="text-xs">{item.type}: {item.title}</span>
                </div>
                <Badge className={`text-xs ${getSeverityColor(item.severity)}`}>
                  {item.severity}
                </Badge>
              </div>
            ))}
            
            {pendingItems.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{pendingItems.length - 3} more items
              </p>
            )}
          </div>

          <Button onClick={handleStartHandover} className="w-full" variant="outline">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Start Shift Handover
          </Button>
        </CardContent>
      </Card>

      <Dialog open={handoverDialogOpen} onOpenChange={setHandoverDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Shift Handover Checklist
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-alert-caution" />
                Pending Items to Handover ({pendingItems.length})
              </h4>
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {pendingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{item.type}: {item.title}</span>
                      </div>
                      <Badge className={getSeverityColor(item.severity)}>
                        {item.severity}
                      </Badge>
                    </div>
                  ))}
                  {pendingItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending items - All clear for handover
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                <FileText className="w-4 h-4 inline mr-2" />
                Handover Notes
              </label>
              <Textarea
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Add any important notes for the incoming operator..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">
                I confirm that all pending items have been reviewed and documented
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHandoverDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteHandover}
              disabled={!acknowledged}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Handover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShiftHandoverAssistant;
