import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, CheckCircle, AlertTriangle, XCircle, 
  Database, Radio, Camera, MapPin, Shield, Bell,
  Truck, Users, FileText, Wrench, Eye, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ModuleStatus {
  name: string;
  icon: any;
  status: 'online' | 'degraded' | 'offline';
  lastUpdate: Date | null;
  recordCount: number;
}

const ModuleHealthMonitor = () => {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkModuleHealth();
    const interval = setInterval(checkModuleHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkModuleHealth = async () => {
    setIsRefreshing(true);
    const moduleChecks: ModuleStatus[] = [];

    // Check Incidents Module
    try {
      const { data, error } = await supabase.from('incidents').select('created_at').order('created_at', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'Incidents',
        icon: Shield,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.created_at ? new Date(data[0].created_at) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'Incidents', icon: Shield, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    // Check Alarms Module
    try {
      const { data, error } = await supabase.from('alarm_activations').select('triggered_at').order('triggered_at', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'Alarms',
        icon: Bell,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.triggered_at ? new Date(data[0].triggered_at) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'Alarms', icon: Bell, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    // Check Patrols Module
    try {
      const { data, error } = await supabase.from('patrols').select('created_at').order('created_at', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'Patrols',
        icon: MapPin,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.created_at ? new Date(data[0].created_at) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'Patrols', icon: MapPin, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    // Check Vehicles Module
    try {
      const { data, error } = await supabase.from('vehicles').select('updated_at').order('updated_at', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'Fleet',
        icon: Truck,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.updated_at ? new Date(data[0].updated_at) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'Fleet', icon: Truck, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    // Check Staff Module
    try {
      const { data, error } = await supabase.from('staff').select('updated_at').order('updated_at', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'Staff',
        icon: Users,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.updated_at ? new Date(data[0].updated_at) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'Staff', icon: Users, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    // Check Strategic Advisory Module
    try {
      const { data, error } = await supabase.from('strategic_advisories').select('timestamp_updated').order('timestamp_updated', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'Strategic',
        icon: Eye,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.timestamp_updated ? new Date(data[0].timestamp_updated) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'Strategic', icon: Eye, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    // Check Technical Module
    try {
      const { data, error } = await supabase.from('technical_work_orders').select('updated_at').order('updated_at', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'Technical',
        icon: Wrench,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.updated_at ? new Date(data[0].updated_at) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'Technical', icon: Wrench, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    // Check DOB Module
    try {
      const { data, error } = await supabase.from('dob_entries').select('created_at').order('created_at', { ascending: false }).limit(1);
      moduleChecks.push({
        name: 'DOB',
        icon: FileText,
        status: error ? 'offline' : 'online',
        lastUpdate: data?.[0]?.created_at ? new Date(data[0].created_at) : null,
        recordCount: data?.length || 0
      });
    } catch { moduleChecks.push({ name: 'DOB', icon: FileText, status: 'offline', lastUpdate: null, recordCount: 0 }); }

    setModules(moduleChecks);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-alert-normal" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-alert-caution" />;
      default: return <XCircle className="w-4 h-4 text-alert-critical" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge className="bg-alert-normal text-xs">Online</Badge>;
      case 'degraded': return <Badge className="bg-alert-caution text-xs">Degraded</Badge>;
      default: return <Badge className="bg-alert-critical text-xs">Offline</Badge>;
    }
  };

  const onlineCount = modules.filter(m => m.status === 'online').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Module Health
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{onlineCount}/{modules.length} Online</Badge>
            <Button size="icon" variant="ghost" onClick={checkModuleHealth} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {modules.map((module, index) => (
            <div
              key={index}
              className="p-2 bg-muted/30 rounded-lg border border-border/50 text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <module.icon className="w-4 h-4 text-primary" />
                {getStatusIcon(module.status)}
              </div>
              <p className="text-xs font-medium truncate">{module.name}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">
          Last refresh: {lastRefresh.toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default ModuleHealthMonitor;
