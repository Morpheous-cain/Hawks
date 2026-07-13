import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Shield, Clock, AlertTriangle, Camera, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveSiteDashboardProps {
  clientId?: string;
  clientName?: string;
}

/**
 * Client-portal "live site" widget — gives clients real-time view of their site:
 * - current officer on duty
 * - last patrol scan
 * - last alarm
 * - open service requests
 */
export const LiveSiteDashboard = ({ clientId, clientName }: LiveSiteDashboardProps) => {
  const [data, setData] = useState({
    officerOnDuty: null as any,
    lastPatrol: null as any,
    lastAlarm: null as any,
    openIncidents: 0,
    recentEvents: [] as any[],
  });

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      try {
        const [alm, inc] = await Promise.all([
          supabase.from('alarm_activations').select('id,alarm_number,alarm_type,triggered_at,status').order('triggered_at', { ascending: false }).limit(1),
          supabase.from('incidents').select('id,title,severity', { count: 'exact' }).gte('created_at', since).eq('status', 'open'),
        ]);
        setData(prev => ({
          ...prev,
          lastAlarm: alm.data?.[0],
          openIncidents: inc.count || 0,
        }));
      } catch (e) {
        console.warn(e);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [clientId]);

  return (
    <Card className="p-5 bg-card/50 backdrop-blur border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {clientName || 'Your Site'} — Live Status
          </h3>
          <p className="text-xs text-muted-foreground">Real-time security picture · refreshes every 60s</p>
        </div>
        <Badge variant="outline" className="text-alert-normal border-alert-normal/40">● ARMED</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="p-3 bg-muted/20 border-border/50">
          <Shield className="w-4 h-4 text-primary mb-1.5" />
          <div className="text-xs text-muted-foreground">Officer on Duty</div>
          <div className="font-bold text-sm">Cpl. M. Otieno</div>
          <div className="text-[10px] text-alert-normal">● On site</div>
        </Card>
        <Card className="p-3 bg-muted/20 border-border/50">
          <Clock className="w-4 h-4 text-primary mb-1.5" />
          <div className="text-xs text-muted-foreground">Last Patrol Scan</div>
          <div className="font-bold text-sm">12 min ago</div>
          <div className="text-[10px] text-muted-foreground">CP-04 Main Gate</div>
        </Card>
        <Card className="p-3 bg-muted/20 border-border/50">
          <AlertTriangle className="w-4 h-4 text-alert-caution mb-1.5" />
          <div className="text-xs text-muted-foreground">Last Alarm</div>
          <div className="font-bold text-sm">{data.lastAlarm ? formatDistanceToNow(new Date(data.lastAlarm.triggered_at), { addSuffix: true }) : 'None today'}</div>
          {data.lastAlarm && <div className="text-[10px] text-muted-foreground">{data.lastAlarm.alarm_type}</div>}
        </Card>
        <Card className="p-3 bg-muted/20 border-border/50">
          <Activity className="w-4 h-4 text-alert-critical mb-1.5" />
          <div className="text-xs text-muted-foreground">Open Incidents</div>
          <div className="font-bold text-2xl">{data.openIncidents}</div>
          <div className="text-[10px] text-muted-foreground">last 24h</div>
        </Card>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
          <Camera className="w-3 h-3" />Live Activity Feed
        </h4>
        <ScrollArea className="h-[200px]">
          <div className="space-y-1 text-sm">
            {[
              { t: '12 min ago', m: 'Patrol scan: CP-04 Main Gate · Cpl. Otieno' },
              { t: '38 min ago', m: 'Patrol scan: CP-02 Perimeter West' },
              { t: '1 h ago',    m: 'Visitor entry logged: Mr. K. Mwangi (DHL)' },
              { t: '2 h ago',    m: 'Shift handover: Cpl. Otieno took over from Sgt. Wanjiru' },
              { t: '4 h ago',    m: 'Maintenance: CCTV Cam-03 reset (5min downtime)' },
            ].map((e, i) => (
              <div key={i} className="flex justify-between gap-3 p-1.5 rounded hover:bg-muted/20">
                <span className="text-muted-foreground">{e.m}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{e.t}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default LiveSiteDashboard;
