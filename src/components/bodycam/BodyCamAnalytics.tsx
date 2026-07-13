import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Shield, Video, Clock } from "lucide-react";

const BodyCamAnalytics = () => {
  const metrics = [
    {
      label: "Total Evidence Clips",
      value: "1,247",
      change: "+12%",
      trend: "up",
      icon: Shield,
    },
    {
      label: "Incidents with Video",
      value: "89%",
      change: "+5%",
      trend: "up",
      icon: Video,
    },
    {
      label: "Avg Response Time",
      value: "8.5 min",
      change: "-2 min",
      trend: "up",
      icon: Clock,
    },
    {
      label: "Compliance Rate",
      value: "96%",
      change: "+4%",
      trend: "up",
      icon: TrendingUp,
    },
  ];

  const topOfficers = [
    { name: "John Kamau", clips: 45, compliance: 98 },
    { name: "Sarah Wanjiku", clips: 42, compliance: 97 },
    { name: "Peter Omondi", clips: 38, compliance: 96 },
    { name: "Grace Akinyi", clips: 35, compliance: 95 },
    { name: "David Mwangi", clips: 33, compliance: 94 },
  ];

  const categoryBreakdown = [
    { category: "Trespass", count: 345, percentage: 28 },
    { category: "Theft", count: 298, percentage: 24 },
    { category: "Dispute", count: 234, percentage: 19 },
    { category: "Vandalism", count: 187, percentage: 15 },
    { category: "Assault", count: 183, percentage: 14 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <metric.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold mb-1">{metric.value}</p>
            <div className="flex items-center gap-1">
              <Badge
                className={
                  metric.trend === "up" ? "bg-alert-normal" : "bg-alert-critical"
                }
              >
                {metric.change}
              </Badge>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Officers by Evidence Clips */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Top Officers by Evidence Collection</h3>
          </div>
          <div className="space-y-3">
            {topOfficers.map((officer, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-medium">{officer.name}</p>
                    <p className="text-sm text-muted-foreground">{officer.clips} clips</p>
                  </div>
                </div>
                <Badge className="bg-alert-normal">{officer.compliance}% compliance</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Evidence by Category</h3>
          </div>
          <div className="space-y-3">
            {categoryBreakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} clips ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Evidence Collection Trend</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {[
            { month: "Jul", value: 85 },
            { month: "Aug", value: 92 },
            { month: "Sep", value: 88 },
            { month: "Oct", value: 95 },
            { month: "Nov", value: 98 },
            { month: "Dec", value: 96 },
          ].map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t"
                style={{ height: `${data.value}%` }}
              />
              <p className="text-sm text-muted-foreground mt-2">{data.month}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default BodyCamAnalytics;
