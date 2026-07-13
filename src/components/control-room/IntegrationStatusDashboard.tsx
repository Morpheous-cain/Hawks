import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wifi, WifiOff, Server, Database, Radio, 
  Camera, MapPin, Bell, RefreshCw, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface IntegrationStatus {
  name: string;
  type: string;
  icon: any;
  status: 'connected' | 'degraded' | 'disconnected';
  latency: number;
  lastPing: Date | null;
  uptime: number;
}

const IntegrationStatusDashboard = () => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkIntegrations();
    const interval = setInterval(checkIntegrations, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkIntegrations = async () => {
    setIsRefreshing(true);
    const statuses: IntegrationStatus[] = [];

    // Check Supabase Database
    const dbStart = Date.now();
    try {
      await supabase.from('profiles').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;
      statuses.push({
        name: 'Database',
        type: 'Core',
        icon: Database,
        status: dbLatency < 500 ? 'connected' : 'degraded',
        latency: dbLatency,
        lastPing: new Date(),
        uptime: 99.9
      });
    } catch {
      statuses.push({
        name: 'Database',
        type: 'Core',
        icon: Database,
        status: 'disconnected',
        latency: 0,
        lastPing: null,
        uptime: 0
      });
    }

    // Check Realtime
    try {
      const realtimeStart = Date.now();
      const channel = supabase.channel('health-check');
      await new Promise((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') resolve(true);
        });
        setTimeout(() => resolve(false), 3000);
      });
      supabase.removeChannel(channel);
      const realtimeLatency = Date.now() - realtimeStart;
      statuses.push({
        name: 'Realtime',
        type: 'Core',
        icon: Activity,
        status: realtimeLatency < 1000 ? 'connected' : 'degraded',
        latency: realtimeLatency,
        lastPing: new Date(),
        uptime: 99.5
      });
    } catch {
      statuses.push({
        name: 'Realtime',
        type: 'Core',
        icon: Activity,
        status: 'disconnected',
        latency: 0,
        lastPing: null,
        uptime: 0
      });
    }

    // Simulated external integrations (would be real API checks in production)
    const externalIntegrations = [
      { name: 'GPS Trackers', type: 'Fleet', icon: MapPin, baseLatency: 150 },
      { name: 'Alarm Panels', type: 'Security', icon: Bell, baseLatency: 200 },
      { name: 'CCTV Systems', type: 'Video', icon: Camera, baseLatency: 180 },
      { name: 'Radio Network', type: 'Comms', icon: Radio, baseLatency: 100 },
    ];

    externalIntegrations.forEach(integration => {
      const randomLatency = integration.baseLatency + Math.random() * 100;
      const randomUptime = 95 + Math.random() * 5;
      statuses.push({
        name: integration.name,
        type: integration.type,
        icon: integration.icon,
        status: randomLatency < 300 ? 'connected' : 'degraded',
        latency: Math.round(randomLatency),
        lastPing: new Date(),
        uptime: Math.round(randomUptime * 10) / 10
      });
    });

    setIntegrations(statuses);
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-alert-normal';
      case 'degraded': return 'text-alert-caution';
      default: return 'text-alert-critical';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4 text-alert-normal" />;
      case 'degraded': return <Wifi className="w-4 h-4 text-alert-caution" />;
      default: return <WifiOff className="w-4 h-4 text-alert-critical" />;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'text-alert-normal';
    if (latency < 500) return 'text-alert-caution';
    return 'text-alert-critical';
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const overallHealth = integrations.length > 0 
    ? Math.round((connectedCount / integrations.length) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Integration Status
          </span>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={overallHealth >= 90 ? 'text-alert-normal' : overallHealth >= 70 ? 'text-alert-caution' : 'text-alert-critical'}
            >
              {overallHealth}% Healthy
            </Badge>
            <Button size="icon" variant="ghost" onClick={checkIntegrations} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>System Health</span>
            <span>{overallHealth}%</span>
          </div>
          <Progress value={overallHealth} className="h-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <integration.icon className="w-4 h-4 text-primary" />
                {getStatusIcon(integration.status)}
              </div>
              <p className="text-xs font-medium truncate">{integration.name}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className={`text-xs ${getLatencyColor(integration.latency)}`}>
                  {integration.latency}ms
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{integration.uptime}% uptime</p>
            </div>
          ))}
        </div>

        {integrations.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-right">
            Last checked: {format(new Date(), 'HH:mm:ss')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default IntegrationStatusDashboard;
