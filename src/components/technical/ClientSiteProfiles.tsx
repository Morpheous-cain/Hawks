import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, AlertTriangle } from "lucide-react";

const ClientSiteProfiles = () => {
  const sites = [
    {
      client: "JKIA Terminal 2",
      site: "Main Terminal Complex",
      complexityIndex: 92,
      riskRating: "high",
      equipmentCount: 147,
      criticalEquipment: 34,
      agingEquipment: 12,
      maintenanceCompliance: 94,
      faultFrequency30d: 3,
      avgResponseTime: 2.1,
      dependenceSeverity: "critical"
    },
    {
      client: "Villa Rosa Kempinski",
      site: "Hotel & Conference Center",
      complexityIndex: 78,
      riskRating: "medium",
      equipmentCount: 89,
      criticalEquipment: 21,
      agingEquipment: 8,
      maintenanceCompliance: 88,
      faultFrequency30d: 5,
      avgResponseTime: 3.4,
      dependenceSeverity: "high"
    },
    {
      client: "Two Rivers Mall",
      site: "Shopping Complex",
      complexityIndex: 85,
      riskRating: "high",
      equipmentCount: 124,
      criticalEquipment: 28,
      agingEquipment: 15,
      maintenanceCompliance: 82,
      faultFrequency30d: 7,
      avgResponseTime: 2.8,
      dependenceSeverity: "high"
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "bg-alert-critical text-primary-foreground";
      case "high": return "bg-alert-caution text-primary-foreground";
      case "medium": return "bg-blue-500 text-primary-foreground";
      default: return "bg-alert-normal text-primary-foreground";
    }
  };

  const getComplexityColor = (index: number) => {
    if (index >= 80) return "text-alert-critical";
    if (index >= 60) return "text-alert-caution";
    return "text-blue-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Total Sites</p>
          <p className="text-3xl font-bold text-foreground mt-1">48</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Critical Risk Sites</p>
          <p className="text-3xl font-bold text-alert-critical mt-1">12</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Total Equipment</p>
          <p className="text-3xl font-bold text-foreground mt-1">2,847</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Aging Equipment</p>
          <p className="text-3xl font-bold text-alert-caution mt-1">187</p>
        </Card>
      </div>

      {/* Site Profiles */}
      <div className="space-y-4">
        {sites.map((site, idx) => (
          <Card key={idx} className="p-4 border-border hover:border-primary/50 transition-colors">
            <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">{site.client}</h3>
                    <p className="text-sm text-muted-foreground">{site.site}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">System Complexity</p>
                      <p className={`text-xl font-bold ${getComplexityColor(site.complexityIndex)}`}>
                        {site.complexityIndex}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Equipment</p>
                      <p className="text-xl font-bold text-foreground">{site.equipmentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Critical Equipment</p>
                      <p className="text-xl font-bold text-alert-critical">{site.criticalEquipment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aging Equipment</p>
                      <p className="text-xl font-bold text-alert-caution">{site.agingEquipment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Maintenance Compliance</p>
                      <p className={`text-xl font-bold ${
                        site.maintenanceCompliance >= 90 ? 'text-alert-normal' :
                        site.maintenanceCompliance >= 75 ? 'text-alert-caution' :
                        'text-alert-critical'
                      }`}>
                        {site.maintenanceCompliance}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Faults (30d)</p>
                      <p className="text-xl font-bold text-foreground">{site.faultFrequency30d}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Response Time</p>
                      <p className="text-xl font-bold text-foreground">{site.avgResponseTime}h</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-auto">
                <Badge className={getRiskColor(site.riskRating)}>
                  {site.riskRating} risk
                </Badge>
                <Badge className={getRiskColor(site.dependenceSeverity)} variant="outline">
                  {site.dependenceSeverity} dependence
                </Badge>
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientSiteProfiles;
