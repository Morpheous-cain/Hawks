import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const QualityInspections = () => {
  const inspections = [
    {
      id: "INS-2025-0012",
      type: "Installation QA",
      workOrder: "WO-20251120-0034",
      equipment: "CCTV Camera System",
      site: "Westgate Mall - Food Court",
      inspector: "David Mwangi (QA Officer)",
      date: "2025-11-22",
      status: "passed",
      score: 95,
      findings: "All cameras operational, clear footage, proper cable management"
    },
    {
      id: "INS-2025-0013",
      type: "Maintenance QA",
      workOrder: "WO-20251121-0042",
      equipment: "Access Control Panel",
      site: "JKIA Terminal 2",
      inspector: "Sarah Njeri (QA Officer)",
      date: "2025-11-23",
      status: "corrective-action",
      score: 72,
      findings: "Card reader alignment needs adjustment, backup battery replacement recommended"
    },
    {
      id: "INS-2025-0014",
      type: "Safety Audit",
      workOrder: "WO-20251119-0028",
      equipment: "Electric Fence System",
      site: "Two Rivers Mall",
      inspector: "David Mwangi (QA Officer)",
      date: "2025-11-21",
      status: "failed",
      score: 58,
      findings: "Voltage irregularities detected, immediate technician re-work required"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed": return "bg-alert-normal text-primary-foreground";
      case "corrective-action": return "bg-alert-caution text-primary-foreground";
      case "failed": return "bg-alert-critical text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed": return CheckCircle;
      case "corrective-action": return AlertCircle;
      case "failed": return XCircle;
      default: return Shield;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-alert-normal";
    if (score >= 60) return "text-alert-caution";
    return "text-alert-critical";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Passed (30d)</p>
          <p className="text-3xl font-bold text-alert-normal mt-1">42</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Corrective Action</p>
          <p className="text-3xl font-bold text-alert-caution mt-1">8</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Failed</p>
          <p className="text-3xl font-bold text-alert-critical mt-1">3</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Avg Compliance Score</p>
          <p className="text-3xl font-bold text-foreground mt-1">87%</p>
        </Card>
      </div>

      {/* Inspections List */}
      <div className="space-y-4">
        {inspections.map((inspection) => {
          const StatusIcon = getStatusIcon(inspection.status);
          return (
            <Card key={inspection.id} className="p-4 border-border hover:border-primary/50 transition-colors">
              <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <StatusIcon className={`w-6 h-6 ${
                      inspection.status === 'passed' ? 'text-alert-normal' :
                      inspection.status === 'corrective-action' ? 'text-alert-caution' :
                      'text-alert-critical'
                    }`} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="space-y-1 flex-1">
                        <h3 className="text-base font-semibold text-foreground">{inspection.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {inspection.id} • {inspection.workOrder}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Equipment:</span>
                        <span className="ml-2 text-foreground font-medium">{inspection.equipment}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Site:</span>
                        <span className="ml-2 text-foreground font-medium">{inspection.site}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Inspector:</span>
                        <span className="ml-2 text-foreground font-medium">{inspection.inspector}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-2 text-foreground font-medium">{inspection.date}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Findings:</span>
                        <p className="text-foreground mt-1">{inspection.findings}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full lg:w-auto">
                  <Badge className={getStatusColor(inspection.status)}>
                    {inspection.status.replace("-", " ")}
                  </Badge>
                  <div className="text-center p-2 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(inspection.score)}`}>
                      {inspection.score}%
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Report
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QualityInspections;
