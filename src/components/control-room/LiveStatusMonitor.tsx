import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Bell, Activity, Users, Clock, Shield, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LiveStatusMonitor = () => {
  const [stats, setStats] = useState({
    activeIncidents: 0,
    criticalIncidents: 0,
    pendingAlarms: 0,
    unitsInField: 0,
    unitsAvailable: 0,
    slaCompliance: 0,
    responseTime: 0,
    totalPersonnel: 0
  });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .in('status', ['open', 'assigned', 'in_progress']);

      // Fetch alarms
      const { data: alarms } = await supabase
        .from('alarm_activations')
        .select('*')
        .in('status', ['active', 'dispatched', 'acknowledged']);

      // Fetch vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true);

      // Fetch staff
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('status', 'active');

      const criticalCount = (incidents || []).filter((i: any) => i.severity === 'critical').length;
      const inFieldCount = (vehicles || []).filter((v: any) => 
        v.current_status === 'en_route' || v.current_status === 'on_scene'
      ).length;
      const availableCount = (vehicles || []).filter((v: any) => 
        v.current_status === 'available'
      ).length;

      // SLA compliance
      const resolvedIncidents = incidents?.filter((i: any) => !i.sla_breached) || [];
      const slaRate = incidents && incidents.length > 0 
        ? Math.round((resolvedIncidents.length / incidents.length) * 100)
        : 100;

      // Average alarm response time (mins) — last 50 resolved alarms
      const { data: respAlarms } = await supabase
        .from('alarm_activations')
        .select('response_time_minutes')
        .not('response_time_minutes', 'is', null)
        .order('triggered_at', { ascending: false })
        .limit(50);
      const avgResponse = respAlarms && respAlarms.length
        ? Math.round(respAlarms.reduce((s: number, r: any) => s + (r.response_time_minutes || 0), 0) / respAlarms.length)
        : 0;

      setStats({
        activeIncidents: incidents?.length || 0,
        criticalIncidents: criticalCount,
        pendingAlarms: alarms?.length || 0,
        unitsInField: inFieldCount,
        unitsAvailable: availableCount,
        slaCompliance: slaRate,
        responseTime: avgResponse,
        totalPersonnel: staff?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      label: "Active Incidents",
      value: stats.activeIncidents,
      icon: AlertTriangle,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Critical",
      value: stats.criticalIncidents,
      icon: Shield,
      color: "text-alert-critical",
      bgColor: "bg-alert-critical/10"
    },
    {
      label: "Pending Alarms",
      value: stats.pendingAlarms,
      icon: Bell,
      color: "text-alert-caution",
      bgColor: "bg-alert-caution/10"
    },
    {
      label: "Units in Field",
      value: stats.unitsInField,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Units Available",
      value: stats.unitsAvailable,
      icon: Users,
      color: "text-alert-normal",
      bgColor: "bg-alert-normal/10"
    },
    {
      label: "SLA Compliance",
      value: `${stats.slaCompliance}%`,
      icon: TrendingUp,
      color: "text-alert-normal",
      bgColor: "bg-alert-normal/10"
    },
    {
      label: "Avg Response",
      value: `${stats.responseTime}m`,
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Personnel",
      value: stats.totalPersonnel,
      icon: Users,
      color: "text-foreground",
      bgColor: "bg-muted/30"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`${stat.bgColor} border-2 border-primary/30`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LiveStatusMonitor;
