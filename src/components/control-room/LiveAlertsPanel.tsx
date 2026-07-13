import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Phone, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Alert {
  id: string;
  type: 'missed' | 'delayed';
  checkpoint: string;
  patrolId: string;
  site: string;
  supervisor: string;
  dueTime?: string;
  overdueBy?: string;
  delay?: string;
  status?: string;
}

interface LiveAlertsPanelProps {
  alerts: Alert[];
}

const LiveAlertsPanel = ({ alerts }: LiveAlertsPanelProps) => {
  return (
    <Card className="h-full border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          Active Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`border-2 ${alert.type === 'missed' ? 'border-destructive/50' : 'border-yellow-500/50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {alert.type === 'missed' ? (
                        <AlertTriangle className="w-5 h-5 text-destructive mt-1" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={alert.type === 'missed' ? 'destructive' : 'secondary'}>
                            {alert.type === 'missed' ? 'Missed Checkpoint' : 'Delayed Scan'}
                          </Badge>
                        </div>
                        <p className="font-semibold text-foreground mb-1">{alert.checkpoint}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Patrol: {alert.patrolId} – {alert.site}</p>
                          <p>Supervisor: {alert.supervisor}</p>
                          {alert.dueTime && (
                            <p className="text-destructive">
                              Due Time: {alert.dueTime} – Overdue by {alert.overdueBy}
                            </p>
                          )}
                          {alert.delay && (
                            <p className="text-yellow-500">Delay: {alert.delay}</p>
                          )}
                          {alert.status && (
                            <p className="text-muted-foreground italic">{alert.status}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        SMS
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Escalate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveAlertsPanel;
