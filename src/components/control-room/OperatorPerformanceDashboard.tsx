import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, User, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OperatorMetrics {
  operatorId: string;
  operatorName: string;
  incidentsHandled: number;
  avgResponseTime: number;
  resolutionRate: number;
  currentWorkload: number;
  efficiency: number;
}

const OperatorPerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<OperatorMetrics | null>(null);
  const [teamMetrics, setTeamMetrics] = useState({
    totalIncidents: 0,
    avgTeamResponse: 0,
    teamResolutionRate: 0
  });

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get operator's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Get today's incidents handled by this operator
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: incidents, count } = await supabase
      .from('incidents')
      .select('id, created_at, resolved_at, status', { count: 'exact' })
      .eq('reported_by', user.id)
      .gte('created_at', today.toISOString());

    // Calculate metrics
    const resolved = incidents?.filter(i => i.status === 'resolved' || i.status === 'closed') || [];
    const resolutionRate = incidents?.length ? (resolved.length / incidents.length) * 100 : 0;

    // Real avg response time = (resolved_at - created_at) in minutes for this operator's resolved incidents today
    const respTimes = resolved
      .filter((i: any) => i.resolved_at)
      .map((i: any) => (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) / 60000);
    const avgResponseTime = respTimes.length
      ? Math.round(respTimes.reduce((s, n) => s + n, 0) / respTimes.length)
      : 0;

    // Team metrics today
    const { data: teamIncidents, count: totalTeamIncidents } = await supabase
      .from('incidents')
      .select('id, created_at, resolved_at, status', { count: 'exact' })
      .gte('created_at', today.toISOString());

    const teamResolved = (teamIncidents || []).filter((i: any) => ['resolved', 'closed'].includes(i.status));
    const teamRespTimes = teamResolved
      .filter((i: any) => i.resolved_at)
      .map((i: any) => (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) / 60000);
    const avgTeamResponse = teamRespTimes.length
      ? Math.round(teamRespTimes.reduce((s, n) => s + n, 0) / teamRespTimes.length)
      : 0;
    const teamResolutionRate = teamIncidents && teamIncidents.length
      ? Math.round((teamResolved.length / teamIncidents.length) * 100)
      : 0;

    setMetrics({
      operatorId: user.id,
      operatorName: profile?.full_name || 'Operator',
      incidentsHandled: count || 0,
      avgResponseTime,
      resolutionRate,
      currentWorkload: Math.min((count || 0) * 10, 100),
      efficiency: Math.min(resolutionRate + (100 - Math.min(avgResponseTime, 20) * 5), 100)
    });

    setTeamMetrics({
      totalIncidents: totalTeamIncidents || 0,
      avgTeamResponse,
      teamResolutionRate
    });
  };

  const getEfficiencyColor = (value: number) => {
    if (value >= 80) return 'text-alert-normal';
    if (value >= 60) return 'text-alert-caution';
    return 'text-alert-critical';
  };

  const getWorkloadColor = (value: number) => {
    if (value <= 50) return 'bg-alert-normal';
    if (value <= 75) return 'bg-alert-caution';
    return 'bg-alert-critical';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-5 h-5 text-primary" />
          Operator Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics && (
          <>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{metrics.operatorName}</p>
                <p className="text-xs text-muted-foreground">Current Session</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Incidents</span>
                </div>
                <p className="text-2xl font-bold">{metrics.incidentsHandled}</p>
              </div>

              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Avg Response</span>
                </div>
                <p className="text-2xl font-bold">{metrics.avgResponseTime}m</p>
              </div>

              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-alert-normal" />
                  <span className="text-xs text-muted-foreground">Resolution</span>
                </div>
                <p className="text-2xl font-bold">{metrics.resolutionRate.toFixed(0)}%</p>
              </div>

              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`w-4 h-4 ${getEfficiencyColor(metrics.efficiency)}`} />
                  <span className="text-xs text-muted-foreground">Efficiency</span>
                </div>
                <p className={`text-2xl font-bold ${getEfficiencyColor(metrics.efficiency)}`}>
                  {metrics.efficiency.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Workload</span>
                <span className="font-medium">{metrics.currentWorkload}%</span>
              </div>
              <Progress 
                value={metrics.currentWorkload} 
                className={`h-2 ${getWorkloadColor(metrics.currentWorkload)}`}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Team Today</p>
              <div className="flex items-center justify-between text-xs">
                <span>Total Incidents: {teamMetrics.totalIncidents}</span>
                <Badge variant="outline">
                  Avg Response: {teamMetrics.avgTeamResponse}m
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OperatorPerformanceDashboard;
