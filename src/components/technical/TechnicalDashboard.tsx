import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

const TechnicalDashboard = () => {
  const kpis = [
    { label: "Department Efficiency Index", value: "87%", trend: "up", icon: TrendingUp, status: "good" },
    { label: "SLA Compliance Strength", value: "92%", trend: "up", icon: CheckCircle, status: "good" },
    { label: "Active Work Orders", value: "24", trend: "neutral", icon: Activity, status: "normal" },
    { label: "Overdue Maintenance", value: "7", trend: "down", icon: AlertCircle, status: "warning" },
    { label: "Equipment Health (Avg)", value: "91%", trend: "up", icon: CheckCircle, status: "good" },
    { label: "Preventive vs Reactive", value: "68:32", trend: "up", icon: TrendingUp, status: "good" },
  ];

  const criticalAlerts = [
    { type: "High-Risk System", site: "JKIA Terminal 2", system: "CCTV Main Server", severity: "critical" },
    { type: "Aging Infrastructure", site: "Villa Rosa Kempinski", system: "Access Control Panel", severity: "high" },
    { type: "Maintenance Gap", site: "Two Rivers Mall", system: "Electric Fence Zone 3", severity: "medium" },
  ];

  const recentActivity = [
    { action: "Work Order Completed", detail: "CCTV Camera Replacement - Westgate Mall", time: "10 mins ago" },
    { action: "Inspection Passed", detail: "Access Control System QA - JKIA", time: "1 hour ago" },
    { action: "Equipment Registered", detail: "New Boom Barrier - Garden City Mall", time: "2 hours ago" },
    { action: "Risk Assessment Created", detail: "Power Failure Risk - Sarit Centre", time: "3 hours ago" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-4 border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  kpi.status === 'good' ? 'bg-alert-normal/10' :
                  kpi.status === 'warning' ? 'bg-alert-caution/10' :
                  'bg-muted/30'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    kpi.status === 'good' ? 'text-alert-normal' :
                    kpi.status === 'warning' ? 'text-alert-caution' :
                    'text-muted-foreground'
                  }`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Critical Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <Card className="p-6 border-border">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-alert-critical" />
            <h3 className="text-lg font-semibold text-foreground">Critical Alerts</h3>
          </div>
          <div className="space-y-3">
            {criticalAlerts.map((alert, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{alert.type}</p>
                    <p className="text-xs text-muted-foreground">{alert.site} • {alert.system}</p>
                  </div>
                  <Badge className={
                    alert.severity === 'critical' ? 'bg-alert-critical text-primary-foreground' :
                    alert.severity === 'high' ? 'bg-alert-caution text-primary-foreground' :
                    'bg-alert-normal text-primary-foreground'
                  }>
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 border-border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm font-semibold text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.detail}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalDashboard;
