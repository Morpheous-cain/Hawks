import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, MapPin, Users, Activity, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SLACountdownTimer from "./SLACountdownTimer";

const LiveOperationsWall = () => {
  const [kpis, setKpis] = useState({
    activeIncidents: 0,
    pendingAlarms: 0,
    unitsInField: 0,
    unitsAvailable: 0,
    criticalIncidents: 0,
    slaAtRisk: 0
  });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [alarms, setAlarms] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to real-time updates
    const incidentsChannel = supabase
      .channel('incidents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const alarmsChannel = supabase
      .channel('alarms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alarm_activations' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(incidentsChannel);
      supabase.removeChannel(alarmsChannel);
      supabase.removeChannel(vehiclesChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active incidents with related data
      const { data: incidentsData } = await supabase
        .from('incidents')
        .select('*, sites(site_name), clients(legal_name)')
        .in('status', ['open', 'assigned', 'in_progress'])
        .order('occurred_at', { ascending: false })
        .limit(10);

      // Fetch active alarms with related data
      const { data: alarmsData } = await supabase
        .from('alarm_activations')
        .select('*, sites(site_name), clients(legal_name)')
        .in('status', ['active', 'dispatched', 'acknowledged'])
        .order('triggered_at', { ascending: false })
        .limit(5);

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true);

      setIncidents(incidentsData || []);
      setAlarms(alarmsData || []);

      const criticalCount = (incidentsData || []).filter((i: any) => i.severity === 'critical').length;
      const slaAtRiskCount = (incidentsData || []).filter((i: any) => {
        if (!i.sla_deadline) return false;
        const deadline = new Date(i.sla_deadline);
        const now = new Date();
        const minutesRemaining = (deadline.getTime() - now.getTime()) / 60000;
        return minutesRemaining > 0 && minutesRemaining <= 5;
      }).length;

      const inFieldCount = (vehiclesData || []).filter((v: any) => v.current_status === 'en_route' || v.current_status === 'on_scene').length;
      const availableCount = (vehiclesData || []).filter((v: any) => v.current_status === 'available').length;

      setKpis({
        activeIncidents: incidentsData?.length || 0,
        pendingAlarms: alarmsData?.length || 0,
        unitsInField: inFieldCount,
        unitsAvailable: availableCount,
        criticalIncidents: criticalCount,
        slaAtRisk: slaAtRiskCount
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-alert-critical';
      case 'high': return 'bg-alert-caution';
      case 'medium': return 'bg-alert-caution/70';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-2 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Active Incidents</p>
                <p className="text-2xl font-bold text-foreground">{kpis.activeIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-alert-caution/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending Alarms</p>
                <p className="text-2xl font-bold text-alert-caution">{kpis.pendingAlarms}</p>
              </div>
              <Bell className="w-8 h-8 text-alert-caution" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Units in Field</p>
                <p className="text-2xl font-bold text-primary">{kpis.unitsInField}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-alert-normal/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Units Available</p>
                <p className="text-2xl font-bold text-alert-normal">{kpis.unitsAvailable}</p>
              </div>
              <Users className="w-8 h-8 text-alert-normal" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-alert-critical/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Critical</p>
                <p className="text-2xl font-bold text-alert-critical">{kpis.criticalIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-alert-critical" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-alert-caution/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">SLA At Risk</p>
                <p className="text-2xl font-bold text-alert-caution">{kpis.slaAtRisk}</p>
              </div>
              <Clock className="w-8 h-8 text-alert-caution" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Incidents and Alarms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Incidents
              </span>
              <Badge variant="outline">{incidents.length} Open</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {incidents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active incidents</p>
            ) : (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-3 bg-muted/30 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{incident.incident_number}</p>
                      <p className="text-xs text-muted-foreground">{incident.location}</p>
                      <p className="text-xs text-muted-foreground">{incident.incident_type}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <SLACountdownTimer 
                        deadline={incident.sla_deadline} 
                        status={incident.status}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Update
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Alarms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Pending Alarms
              </span>
              <Badge variant="outline">{alarms.length} Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {alarms.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No pending alarms</p>
            ) : (
              alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className="p-3 bg-alert-caution/10 rounded-lg border-2 border-alert-caution/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alarm.alarm_number}</p>
                      <p className="text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {alarm.location}
                      </p>
                      <p className="text-xs text-muted-foreground">{alarm.alarm_type}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <Badge className="bg-alert-caution">{alarm.status}</Badge>
                      <SLACountdownTimer 
                        deadline={alarm.sla_deadline} 
                        status={alarm.status}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      Acknowledge
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Dispatch
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveOperationsWall;