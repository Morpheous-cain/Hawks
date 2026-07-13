import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, AlertTriangle, Users, MapPin, Camera, 
  Radio, Package, Zap, Save, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface EventRiskAssessmentProps {
  event: any;
  onUpdate?: (riskData: any) => void;
}

const EventRiskAssessment = ({ event, onUpdate }: EventRiskAssessmentProps) => {
  const [riskFactors, setRiskFactors] = useState({
    crowdDensity: 50,
    venueComplexity: 50,
    historicalIncidents: 30,
    vipPresence: 0,
    mediaExposure: 40,
    threatIntelligence: 20
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  // Calculate risk score based on factors
  useEffect(() => {
    const weights = {
      crowdDensity: 0.25,
      venueComplexity: 0.20,
      historicalIncidents: 0.15,
      vipPresence: 0.20,
      mediaExposure: 0.10,
      threatIntelligence: 0.10
    };

    const score = Object.entries(riskFactors).reduce((acc, [key, value]) => {
      return acc + (value * weights[key as keyof typeof weights]);
    }, 0);

    setOverallScore(Math.round(score));

    // Generate recommendations
    const newRecommendations: string[] = [];
    if (riskFactors.crowdDensity > 70) {
      newRecommendations.push("Deploy additional crowd control barriers");
      newRecommendations.push("Increase security personnel by 50%");
    }
    if (riskFactors.vipPresence > 50) {
      newRecommendations.push("Assign dedicated VIP protection team");
      newRecommendations.push("Establish secure entry/exit routes");
    }
    if (riskFactors.threatIntelligence > 40) {
      newRecommendations.push("Coordinate with local law enforcement");
      newRecommendations.push("Implement enhanced screening procedures");
    }
    if (score > 60) {
      newRecommendations.push("Conduct pre-event security briefing");
      newRecommendations.push("Position emergency response team on standby");
    }
    setRecommendations(newRecommendations);
  }, [riskFactors]);

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: "Low", color: "bg-alert-normal/20 text-alert-normal" };
    if (score < 60) return { label: "Medium", color: "bg-alert-caution/20 text-alert-caution" };
    return { label: "High", color: "bg-alert-critical/20 text-alert-critical" };
  };

  const riskLevel = getRiskLevel(overallScore);

  const handleSave = () => {
    onUpdate?.({
      riskScore: overallScore,
      riskLevel: riskLevel.label.toLowerCase(),
      factors: riskFactors,
      recommendations
    });
    toast.success("Risk assessment saved");
  };

  const resourceRecommendations = [
    { icon: Users, label: "Security Personnel", count: Math.ceil(overallScore / 10) + (event?.staff_required || 5) },
    { icon: Camera, label: "CCTV Cameras", count: Math.ceil(overallScore / 15) + 4 },
    { icon: Radio, label: "Radio Units", count: Math.ceil(overallScore / 20) + 3 },
    { icon: Package, label: "First Aid Kits", count: Math.ceil(overallScore / 25) + 2 },
    { icon: Zap, label: "Metal Detectors", count: overallScore > 50 ? 3 : 1 }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Risk Assessment Score
            </div>
            <Badge className={riskLevel.color}>{riskLevel.label} Risk</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-primary">{overallScore}</div>
            <div className="flex-1">
              <Progress 
                value={overallScore} 
                className="h-4"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Low Risk</span>
                <span>Medium</span>
                <span>High Risk</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-alert-caution" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(riskFactors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  <span className="text-sm text-muted-foreground">{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([newValue]) => 
                    setRiskFactors(prev => ({ ...prev, [key]: newValue }))
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No specific recommendations based on current risk level.</p>
              ) : (
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Resource Recommendations */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recommended Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {resourceRecommendations.map((res, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <res.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{res.label}</p>
                      <p className="font-bold">{res.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notes */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Assessment Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Add any additional notes or observations about the risk assessment..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reset
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Assessment
        </Button>
      </div>
    </div>
  );
};

export default EventRiskAssessment;
