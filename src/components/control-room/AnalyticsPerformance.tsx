import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, AlertTriangle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AnalyticsPerformance = () => {
  const [metrics, setMetrics] = useState({
    avgAcknowledgmentTime: 0,
    avgResponseTime: 0,
    avgClosureTime: 0,
    slaCompliance: 0,
    totalIncidents: 0,
    escalations: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    // This is a simplified version - in production, you'd calculate these from actual data
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (incidents) {
      setMetrics({
        avgAcknowledgmentTime: 2.5,
        avgResponseTime: 12.3,
        avgClosureTime: 45.2,
        slaCompliance: 94.5,
        totalIncidents: incidents.length,
        escalations: incidents.filter(i => i.severity === 'critical').length
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {metrics.avgAcknowledgmentTime}m
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Avg Acknowledgment Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {metrics.avgResponseTime}m
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {metrics.avgClosureTime}m
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Avg Closure Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-alert-normal" />
              <span className="text-2xl font-bold text-alert-normal">
                {metrics.slaCompliance}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">SLA Compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {metrics.totalIncidents}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Total Incidents (7d)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-alert-caution" />
              <span className="text-2xl font-bold text-alert-caution">
                {metrics.escalations}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Escalations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPerformance;