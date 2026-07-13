import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GitBranch, User, Phone, Mail, Clock, AlertTriangle,
  CheckCircle, ArrowDown, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EscalationLevel {
  level: number;
  role: string;
  name: string;
  contact: string;
  responseTime: string;
  status: 'pending' | 'notified' | 'acknowledged' | 'bypassed';
}

interface EscalationChain {
  id: string;
  incidentType: string;
  severity: string;
  levels: EscalationLevel[];
  currentLevel: number;
}

const escalationTemplates: Record<string, EscalationLevel[]> = {
  critical: [
    { level: 1, role: 'Control Room Operator', name: 'On Duty', contact: 'Internal', responseTime: '2 min', status: 'pending' },
    { level: 2, role: 'Shift Supervisor', name: 'Supervisor', contact: 'Radio', responseTime: '5 min', status: 'pending' },
    { level: 3, role: 'Operations Manager', name: 'Ops Manager', contact: 'Phone', responseTime: '10 min', status: 'pending' },
    { level: 4, role: 'COO', name: 'Chief Operating Officer', contact: 'Phone/SMS', responseTime: '15 min', status: 'pending' },
    { level: 5, role: 'CEO', name: 'Chief Executive Officer', contact: 'Phone/SMS', responseTime: '30 min', status: 'pending' }
  ],
  high: [
    { level: 1, role: 'Control Room Operator', name: 'On Duty', contact: 'Internal', responseTime: '5 min', status: 'pending' },
    { level: 2, role: 'Shift Supervisor', name: 'Supervisor', contact: 'Radio', responseTime: '10 min', status: 'pending' },
    { level: 3, role: 'Operations Manager', name: 'Ops Manager', contact: 'Phone', responseTime: '20 min', status: 'pending' }
  ],
  normal: [
    { level: 1, role: 'Control Room Operator', name: 'On Duty', contact: 'Internal', responseTime: '10 min', status: 'pending' },
    { level: 2, role: 'Shift Supervisor', name: 'Supervisor', contact: 'Radio', responseTime: '30 min', status: 'pending' }
  ]
};

const EscalationChainVisualizer = () => {
  const [activeEscalations, setActiveEscalations] = useState<EscalationChain[]>([]);
  const [selectedChain, setSelectedChain] = useState<EscalationChain | null>(null);

  useEffect(() => {
    fetchActiveEscalations();
  }, []);

  const fetchActiveEscalations = async () => {
    // Fetch critical/high incidents that may need escalation
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, incident_number, incident_type, severity, created_at')
      .in('severity', ['critical', 'high'])
      .in('status', ['open', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (incidents) {
      const escalations: EscalationChain[] = incidents.map(inc => {
        const template = escalationTemplates[inc.severity] || escalationTemplates.normal;
        const minutesSinceCreation = Math.floor(
          (Date.now() - new Date(inc.created_at).getTime()) / 60000
        );
        
        // Simulate escalation progress based on time
        let currentLevel = 1;
        let totalTime = 0;
        const levels = template.map((level, idx) => {
          const responseMinutes = parseInt(level.responseTime);
          totalTime += responseMinutes;
          let status: 'pending' | 'notified' | 'acknowledged' | 'bypassed' = 'pending';
          
          if (minutesSinceCreation >= totalTime) {
            status = Math.random() > 0.3 ? 'acknowledged' : 'bypassed';
            if (status === 'bypassed') currentLevel = Math.min(currentLevel + 1, template.length);
          } else if (minutesSinceCreation >= totalTime - responseMinutes) {
            status = 'notified';
            currentLevel = idx + 1;
          }
          
          return { ...level, status };
        });

        return {
          id: inc.id,
          incidentType: inc.incident_type,
          severity: inc.severity,
          levels,
          currentLevel
        };
      });

      setActiveEscalations(escalations);
      if (escalations.length > 0 && !selectedChain) {
        setSelectedChain(escalations[0]);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acknowledged': return 'bg-alert-normal text-white';
      case 'notified': return 'bg-alert-caution text-black';
      case 'bypassed': return 'bg-alert-critical text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'acknowledged': return CheckCircle;
      case 'notified': return Clock;
      case 'bypassed': return AlertTriangle;
      default: return User;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-alert-critical text-white';
      case 'high': return 'bg-alert-caution text-black';
      default: return 'bg-alert-normal text-white';
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="w-5 h-5 text-primary" />
          Escalation Chain Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Active Escalations List */}
          <div className="space-y-2">
            <p className="text-sm font-medium mb-2">Active Escalations</p>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {activeEscalations.map((chain) => (
                  <div
                    key={chain.id}
                    onClick={() => setSelectedChain(chain)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChain?.id === chain.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{chain.incidentType}</span>
                      <Badge className={getSeverityColor(chain.severity)}>
                        {chain.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>Level {chain.currentLevel} of {chain.levels.length}</span>
                    </div>
                  </div>
                ))}
                {activeEscalations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active escalations</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chain Visualization */}
          <div className="col-span-2">
            {selectedChain ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedChain.incidentType}</h4>
                    <p className="text-xs text-muted-foreground">
                      Escalation Path for {selectedChain.severity} severity
                    </p>
                  </div>
                  <Badge className={getSeverityColor(selectedChain.severity)}>
                    Level {selectedChain.currentLevel}
                  </Badge>
                </div>

                <ScrollArea className="h-56">
                  <div className="space-y-1">
                    {selectedChain.levels.map((level, idx) => {
                      const Icon = getStatusIcon(level.status);
                      const isActive = idx + 1 === selectedChain.currentLevel;
                      
                      return (
                        <div key={level.level}>
                          <div
                            className={`p-3 rounded-lg border ${
                              isActive 
                                ? 'border-primary bg-primary/10' 
                                : level.status === 'acknowledged'
                                  ? 'bg-alert-normal/10 border-alert-normal/30'
                                  : level.status === 'bypassed'
                                    ? 'bg-alert-critical/10 border-alert-critical/30'
                                    : 'bg-background'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}>
                                <span className="text-sm font-bold">{level.level}</span>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{level.role}</span>
                                  <Badge className={`text-xs ${getStatusColor(level.status)}`}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {level.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {level.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {level.contact}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {level.responseTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {idx < selectedChain.levels.length - 1 && (
                            <div className="flex justify-center py-1">
                              <ArrowDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select an escalation to view chain</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EscalationChainVisualizer;
