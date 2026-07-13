import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Clock,
  MapPin,
  Users,
  DollarSign,
  FileWarning
} from "lucide-react";

const LossControlDashboard = () => {
  const navigate = useNavigate();
  const goto = (tab: string) => navigate(`/loss-control?tab=${tab}`);
  const stats = [
    { 
      label: "Total Active Records", 
      value: "23", 
      icon: FileWarning, 
      color: "text-primary",
      bgColor: "bg-primary/20"
    },
    { 
      label: "Current High Risk Alerts", 
      value: "5", 
      icon: AlertTriangle, 
      color: "text-alert-critical",
      bgColor: "bg-alert-critical/20"
    },
    { 
      label: "Escalation Queue", 
      value: "8", 
      icon: TrendingUp, 
      color: "text-alert-caution",
      bgColor: "bg-alert-caution/20"
    },
    { 
      label: "SLA Countdown Monitor", 
      value: "12h", 
      icon: Clock, 
      color: "text-primary",
      bgColor: "bg-primary/20"
    },
  ];

  const criticalSites = [
    { site: "Villa Rosa Kempinski", riskScore: 87, alerts: 4, status: "critical" },
    { site: "Two Rivers Mall", riskScore: 72, alerts: 3, status: "high" },
    { site: "JKIA Terminal 2", riskScore: 45, alerts: 1, status: "medium" },
  ];

  const recentIncidents = [
    {
      id: "LC-2025-001",
      type: "POS Compliance",
      site: "Villa Rosa",
      officer: "John Kamau",
      severity: "high",
      status: "escalated",
      time: "2h ago"
    },
    {
      id: "LC-2025-002",
      type: "Loss Event",
      site: "Two Rivers",
      officer: "Mary Wanjiru",
      severity: "critical",
      status: "investigation",
      time: "4h ago"
    },
    {
      id: "LC-2025-003",
      type: "Receiving Verification",
      site: "Westgate",
      officer: "David Otieno",
      severity: "medium",
      status: "pending",
      time: "6h ago"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-4 border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Critical Sites */}
        <Card className="p-6 border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Sites with Critical Risk Scores</h3>
            <Button size="sm" variant="outline" onClick={() => goto("sites")}>View All</Button>
          </div>
          <div className="space-y-3">
            {criticalSites.map((site, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{site.site}</p>
                    <p className="text-sm text-muted-foreground">{site.alerts} active alerts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-lg font-bold text-foreground">{site.riskScore}</p>
                  </div>
                  <Badge 
                    variant={
                      site.status === "critical" ? "destructive" : 
                      site.status === "high" ? "secondary" : 
                      "outline"
                    }
                  >
                    {site.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Quick Actions */}
        <Card className="p-6 border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="outline" onClick={() => goto("records")}>
              <FileWarning className="w-4 h-4 mr-2" />
              Create New Record
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => goto("escalations")}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              View Escalations
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => goto("intelligence")}>
              <Shield className="w-4 h-4 mr-2" />
              Risk Intelligence
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => goto("staff")}>
              <Users className="w-4 h-4 mr-2" />
              Staff Risk Profiles
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => goto("financial")}>
              <DollarSign className="w-4 h-4 mr-2" />
              Financial Exposure
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Incidents Table */}
      <Card className="p-6 border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Loss Control Records</h3>
          <Button size="sm" onClick={() => goto("records")}>View All Records</Button>
        </div>
        <div className="space-y-2">
          {recentIncidents.map((incident) => (
            <div 
              key={incident.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <Badge 
                  variant={
                    incident.severity === "critical" ? "destructive" : 
                    incident.severity === "high" ? "secondary" : 
                    "outline"
                  }
                >
                  {incident.severity.toUpperCase()}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{incident.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {incident.type} • {incident.site} • {incident.officer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{incident.status}</Badge>
                <span className="text-sm text-muted-foreground">{incident.time}</span>
                <Button size="sm" variant="outline" onClick={() => navigate(`/loss-control?record=${incident.id}`)}>View Details</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LossControlDashboard;
