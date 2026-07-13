import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, Phone, MapPin, Users, Siren, 
  Ambulance, Shield, Clock, CheckCircle, Radio, X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EmergencyAlert {
  id: string;
  type: 'panic' | 'medical' | 'security' | 'evacuation';
  location: string;
  triggeredBy: string;
  triggeredAt: Date;
  status: 'active' | 'responding' | 'resolved';
  responders: string[];
}

interface EventEmergencyPanelProps {
  eventId: string;
  eventName: string;
}

const EventEmergencyPanel = ({ eventId, eventName }: EventEmergencyPanelProps) => {
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [confirmPanic, setConfirmPanic] = useState(false);

  const handlePanicButton = () => {
    if (!confirmPanic) {
      setConfirmPanic(true);
      setTimeout(() => setConfirmPanic(false), 3000);
      return;
    }

    setIsPanicActive(true);
    const newAlert: EmergencyAlert = {
      id: Date.now().toString(),
      type: 'panic',
      location: 'Control Room',
      triggeredBy: 'Operator',
      triggeredAt: new Date(),
      status: 'active',
      responders: []
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
    toast.error('PANIC ALERT ACTIVATED - All units notified');
    
    // Auto-resolve after demo
    setTimeout(() => {
      setIsPanicActive(false);
      setActiveAlerts(prev => prev.map(a => 
        a.id === newAlert.id ? { ...a, status: 'responding', responders: ['Alpha Team', 'Medical Unit'] } : a
      ));
    }, 3000);
  };

  const triggerEmergency = (type: EmergencyAlert['type']) => {
    const locations: Record<string, string> = {
      panic: 'Main Entrance',
      medical: 'Section B',
      security: 'VIP Area',
      evacuation: 'All Zones'
    };

    const newAlert: EmergencyAlert = {
      id: Date.now().toString(),
      type,
      location: locations[type],
      triggeredBy: 'Control Room',
      triggeredAt: new Date(),
      status: 'active',
      responders: []
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
    toast.warning(`${type.toUpperCase()} alert triggered`);
  };

  const resolveAlert = (id: string) => {
    setActiveAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'resolved' } : a
    ));
    toast.success('Alert resolved');
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'panic': return <Siren className="w-5 h-5" />;
      case 'medical': return <Ambulance className="w-5 h-5" />;
      case 'security': return <Shield className="w-5 h-5" />;
      case 'evacuation': return <Users className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type: string, status: string) => {
    if (status === 'resolved') return 'bg-green-500/20 border-green-500/30 text-green-500';
    switch (type) {
      case 'panic': return 'bg-alert-critical/20 border-alert-critical/30 text-alert-critical';
      case 'medical': return 'bg-blue-500/20 border-blue-500/30 text-blue-500';
      case 'security': return 'bg-amber-500/20 border-amber-500/30 text-amber-500';
      case 'evacuation': return 'bg-purple-500/20 border-purple-500/30 text-purple-500';
      default: return 'bg-muted';
    }
  };

  const emergencyContacts = [
    { name: 'Police Emergency', number: '999', icon: Shield },
    { name: 'Ambulance', number: '999', icon: Ambulance },
    { name: 'Fire Department', number: '999', icon: Siren },
    { name: 'Control Room', number: '+254 700 000 000', icon: Radio },
  ];

  return (
    <div className="space-y-6">
      {/* Main Panic Button */}
      <Card className={`border-2 transition-all ${
        isPanicActive 
          ? 'bg-alert-critical/20 border-alert-critical animate-pulse' 
          : 'bg-card/50 border-primary/20'
      }`}>
        <CardContent className="p-8 text-center">
          <Button
            size="lg"
            className={`h-32 w-32 rounded-full text-xl font-bold shadow-lg transition-all ${
              isPanicActive 
                ? 'bg-green-500 hover:bg-green-600 animate-none' 
                : confirmPanic
                ? 'bg-amber-500 hover:bg-amber-600 animate-pulse'
                : 'bg-alert-critical hover:bg-red-700'
            }`}
            onClick={isPanicActive ? () => {
              setIsPanicActive(false);
              setActiveAlerts(prev => prev.map(a => ({ ...a, status: 'resolved' })));
              toast.success('Panic alert cancelled');
            } : handlePanicButton}
          >
            {isPanicActive ? (
              <X className="w-12 h-12" />
            ) : confirmPanic ? (
              'CONFIRM'
            ) : (
              <Siren className="w-12 h-12" />
            )}
          </Button>
          <p className="mt-4 text-lg font-semibold">
            {isPanicActive ? 'EMERGENCY ACTIVE - Click to Cancel' : confirmPanic ? 'Click Again to Confirm' : 'PANIC BUTTON'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isPanicActive 
              ? 'All units have been notified' 
              : 'Press to trigger emergency alert to all units'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Emergency Actions */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-alert-caution" />
              Quick Response Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-blue-500/30 hover:bg-blue-500/10"
                onClick={() => triggerEmergency('medical')}
              >
                <Ambulance className="w-6 h-6 text-blue-500" />
                <span className="text-xs">Medical Emergency</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => triggerEmergency('security')}
              >
                <Shield className="w-6 h-6 text-amber-500" />
                <span className="text-xs">Security Threat</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-purple-500/30 hover:bg-purple-500/10"
                onClick={() => triggerEmergency('evacuation')}
              >
                <Users className="w-6 h-6 text-purple-500" />
                <span className="text-xs">Evacuation</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2 border-green-500/30 hover:bg-green-500/10"
                onClick={() => toast.success('All clear broadcast sent')}
              >
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-xs">All Clear</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyContacts.map((contact, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <contact.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.number}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Phone className="w-3 h-3" />
                    Call
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Siren className="w-5 h-5 text-alert-critical" />
            Active Emergency Alerts
            {activeAlerts.filter(a => a.status !== 'resolved').length > 0 && (
              <Badge className="bg-alert-critical/20 text-alert-critical ml-2">
                {activeAlerts.filter(a => a.status !== 'resolved').length} Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
              <p className="text-muted-foreground">No active emergency alerts</p>
              <p className="text-sm text-muted-foreground mt-1">All systems operational</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border ${getAlertColor(alert.type, alert.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-background/50">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold capitalize">{alert.type} Alert</p>
                          <Badge variant="outline" className="text-xs">
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alert.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(alert.triggeredAt, 'HH:mm:ss')}
                          </span>
                        </div>
                        {alert.responders.length > 0 && (
                          <p className="text-xs mt-2">
                            Responders: {alert.responders.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    {alert.status !== 'resolved' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventEmergencyPanel;
