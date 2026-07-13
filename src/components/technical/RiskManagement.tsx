import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const RiskManagement = () => {
  const risks = [
    {
      id: "RISK-2025-008",
      type: "aging-infrastructure",
      category: "Access Control",
      title: "End-of-Life Access Control Panel",
      site: "Villa Rosa Kempinski - Main Lobby",
      probability: "high",
      impact: "major",
      score: 16,
      residualRisk: "high",
      status: "mitigating",
      owner: "Technical Manager",
      deadline: "2025-12-15"
    },
    {
      id: "RISK-2025-009",
      type: "power-dependency",
      category: "CCTV",
      title: "Single Point Power Failure Risk",
      site: "JKIA Terminal 2 - CCTV Server Room",
      probability: "medium",
      impact: "major",
      score: 12,
      residualRisk: "medium",
      status: "open",
      owner: "Head of Technical Security",
      deadline: "2025-11-30"
    },
    {
      id: "RISK-2025-007",
      type: "maintenance-gap",
      category: "Electric Fence",
      title: "Overdue Preventive Maintenance",
      site: "Two Rivers Mall - Perimeter Zone 3",
      probability: "high",
      impact: "moderate",
      score: 12,
      residualRisk: "medium",
      status: "open",
      owner: "Technical Supervisor",
      deadline: "2025-11-25"
    },
  ];

  const getProbabilityColor = (prob: string) => {
    switch (prob) {
      case "very-high":
      case "high": return "bg-alert-critical text-primary-foreground";
      case "medium": return "bg-alert-caution text-primary-foreground";
      default: return "bg-blue-500 text-primary-foreground";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "catastrophic":
      case "major": return "bg-alert-critical text-primary-foreground";
      case "moderate": return "bg-alert-caution text-primary-foreground";
      default: return "bg-blue-500 text-primary-foreground";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 15) return "text-alert-critical";
    if (score >= 10) return "text-alert-caution";
    return "text-blue-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed": return "bg-alert-normal text-primary-foreground";
      case "mitigating": return "bg-blue-500 text-primary-foreground";
      case "open": return "bg-alert-caution text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Critical Risks</p>
          <p className="text-3xl font-bold text-alert-critical mt-1">4</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">High Risks</p>
          <p className="text-3xl font-bold text-alert-caution mt-1">7</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Medium Risks</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">12</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Risks Mitigated (30d)</p>
          <p className="text-3xl font-bold text-alert-normal mt-1">9</p>
        </Card>
      </div>

      {/* Risks List */}
      <div className="space-y-4">
        {risks.map((risk) => (
          <Card key={risk.id} className="p-4 border-border hover:border-primary/50 transition-colors">
            <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
              <div className="flex gap-4 flex-1">
                <div className="p-3 rounded-lg bg-alert-critical/10 border border-alert-critical/30">
                  <AlertTriangle className="w-6 h-6 text-alert-critical" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="space-y-1 flex-1">
                      <h3 className="text-base font-semibold text-foreground">{risk.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {risk.id} • {risk.category}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Site:</span>
                      <span className="ml-2 text-foreground font-medium">{risk.site}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk Type:</span>
                      <span className="ml-2 text-foreground font-medium">
                        {risk.type.replace("-", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Probability:</span>
                      <Badge className={getProbabilityColor(risk.probability)} variant="outline">
                        {risk.probability}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Impact:</span>
                      <Badge className={getImpactColor(risk.impact)} variant="outline">
                        {risk.impact}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="ml-2 text-foreground font-medium">{risk.owner}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Action Deadline:</span>
                      <span className="ml-2 text-foreground font-medium">{risk.deadline}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-auto">
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className={`text-2xl font-bold ${getRiskScoreColor(risk.score)}`}>
                    {risk.score}
                  </p>
                </div>
                <Badge className={getStatusColor(risk.status)}>
                  {risk.status}
                </Badge>
                <Badge variant="outline" className="border-border">
                  {risk.residualRisk} residual
                </Badge>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Risk
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RiskManagement;
