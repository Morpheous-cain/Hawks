import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Calendar, TrendingUp, Package, Wrench } from "lucide-react";

const PredictiveMaintenanceEngine = () => {
  // Mock predictive data - in production, calculate from Supabase analytics
  const predictions = [
    {
      id: "1",
      equipment: "CCTV Camera - CAM-045",
      site: "Freedom Airline Terminal",
      predictedFailure: "15 days",
      confidence: 87,
      reason: "High usage pattern + 3 years since installation",
      lifecycle: 65,
      partsNeeded: ["Lens Assembly", "Power Supply"],
    },
    {
      id: "2",
      equipment: "Access Controller - AC-102",
      site: "Westgate Mall",
      predictedFailure: "7 days",
      confidence: 92,
      reason: "Similar units failed at 4-year mark",
      lifecycle: 82,
      partsNeeded: ["Main Board", "Card Reader"],
    },
    {
      id: "3",
      equipment: "Electric Fence - EF-203",
      site: "Villa Rosa Kempinski",
      predictedFailure: "30 days",
      confidence: 78,
      reason: "Voltage fluctuations detected",
      lifecycle: 45,
      partsNeeded: ["Energizer Unit"],
    },
  ];

  const failurePatterns = [
    { type: "CCTV Cameras", avgLifespan: "4.2 years", commonFailure: "Lens fogging", occurrences: 12 },
    { type: "Access Controllers", avgLifespan: "5.1 years", commonFailure: "Card reader malfunction", occurrences: 8 },
    { type: "Alarm Panels", avgLifespan: "6.5 years", commonFailure: "Battery failure", occurrences: 15 },
  ];

  return (
    <div className="space-y-6">
      {/* Predictive Alerts */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Predictive Maintenance Alerts</h3>
        <div className="space-y-3">
          {predictions.map((pred) => (
            <Card key={pred.id} className="p-4 bg-card border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{pred.equipment}</h4>
                  <p className="text-sm text-muted-foreground">{pred.site}</p>
                </div>
                <Badge
                  variant={
                    parseInt(pred.predictedFailure) <= 7
                      ? "destructive"
                      : parseInt(pred.predictedFailure) <= 15
                      ? "default"
                      : "secondary"
                  }
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {pred.predictedFailure}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Lifecycle Progress</span>
                    <span className="text-foreground font-medium">{pred.lifecycle}%</span>
                  </div>
                  <Progress value={pred.lifecycle} className="h-2" />
                </div>

                <div className="bg-background/50 p-2 rounded text-sm">
                  <p className="text-muted-foreground mb-1">Prediction Basis:</p>
                  <p className="text-foreground">{pred.reason}</p>
                  <p className="text-muted-foreground mt-1">Confidence: {pred.confidence}%</p>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-foreground">Parts needed:</span>
                  <span className="text-muted-foreground">{pred.partsNeeded.join(", ")}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                  <Button size="sm" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Order Parts
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Failure Pattern Detection */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Equipment Failure Patterns</h3>
        <Card className="p-4 bg-card border-border">
          <div className="space-y-4">
            {failurePatterns.map((pattern, index) => (
              <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{pattern.type}</h4>
                    <p className="text-sm text-muted-foreground">Avg Lifespan: {pattern.avgLifespan}</p>
                  </div>
                  <Badge variant="outline">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {pattern.occurrences} cases
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">Common failure:</span>
                  <span className="text-foreground">{pattern.commonFailure}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Parts Inventory Alerts */}
      <Card className="p-4 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">Parts Inventory Alerts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-background/50 rounded">
            <span className="text-foreground">CCTV Lens Assembly</span>
            <Badge variant="destructive">Low Stock - 2 units</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-background/50 rounded">
            <span className="text-foreground">Access Controller Boards</span>
            <Badge variant="default">Reorder - 5 units</Badge>
          </div>
          <div className="flex items-center justify-between p-2 bg-background/50 rounded">
            <span className="text-foreground">Alarm Panel Batteries</span>
            <Badge variant="outline">Adequate - 18 units</Badge>
          </div>
        </div>
        <Button variant="outline" className="w-full mt-3">
          <Package className="w-4 h-4 mr-2" />
          Manage Inventory
        </Button>
      </Card>
    </div>
  );
};

export default PredictiveMaintenanceEngine;
