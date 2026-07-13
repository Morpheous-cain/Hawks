import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, TrendingUp, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Pattern {
  pattern: string;
  frequency: number;
  severity: string;
}

interface Risk {
  risk: string;
  likelihood: string;
  impact: string;
  mitigation: string;
}

interface Recommendation {
  priority: string;
  action: string;
  rationale: string;
}

interface ThreatAnalysisData {
  threatLevel: string;
  patterns: Pattern[];
  risks: Risk[];
  recommendations: Recommendation[];
  trends: {
    summary: string;
    hotspots: string[];
  };
  summary: string;
}

const STATIC_ANALYSES: ThreatAnalysisData[] = [
  {
    threatLevel: "Medium",
    summary: "Current threat environment shows moderate activity with concentrated incident patterns in industrial zones. Enhanced vigilance recommended during night shifts.",
    patterns: [
      { pattern: "Unauthorized access attempts concentrated in industrial zones", frequency: 8, severity: "medium" },
      { pattern: "Increased perimeter breach incidents during shift changes", frequency: 6, severity: "high" },
      { pattern: "Vehicle prowling incidents in parking areas after hours", frequency: 5, severity: "medium" },
      { pattern: "False alarm triggers from aging sensor equipment", frequency: 12, severity: "low" }
    ],
    risks: [
      { 
        risk: "Coordinated unauthorized access during shift changes", 
        likelihood: "Medium", 
        impact: "High",
        mitigation: "Stagger shift change times and increase patrol frequency during transitions"
      },
      { 
        risk: "Equipment failure leading to blind spots in coverage", 
        likelihood: "High", 
        impact: "Medium",
        mitigation: "Schedule immediate maintenance for aging sensors and implement redundancy protocols"
      },
      { 
        risk: "Insider threat potential with repeated access pattern anomalies", 
        likelihood: "Low", 
        impact: "High",
        mitigation: "Conduct background reviews and implement two-person rule for sensitive areas"
      }
    ],
    recommendations: [
      { 
        priority: "High", 
        action: "Deploy additional mobile patrols to industrial zones between 22:00-06:00", 
        rationale: "60% of incidents occur in this timeframe" 
      },
      { 
        priority: "High", 
        action: "Replace or recalibrate alarm sensors showing false positive rates above 30%", 
        rationale: "Alarm fatigue compromises response effectiveness" 
      },
      { 
        priority: "Medium", 
        action: "Implement staggered shift changes with 15-minute overlap periods", 
        rationale: "Eliminates coverage gaps exploited in recent breach attempts" 
      },
      { 
        priority: "Medium", 
        action: "Increase lighting in parking areas and install additional CCTV coverage", 
        rationale: "Vehicle-related incidents cluster in poorly lit zones" 
      }
    ],
    trends: {
      summary: "Incident frequency has stabilized after initial spike. Response times improving but still above target SLA.",
      hotspots: [
        "Industrial Zone B - Gate 3 Area",
        "North Parking Lot - Far Section",
        "Perimeter Fence - Eastern Section"
      ]
    }
  },
  {
    threatLevel: "Low",
    summary: "Threat environment is currently stable with minimal unusual activity. Standard operational procedures are effective. Continue routine monitoring.",
    patterns: [
      { pattern: "Minor perimeter fence damage from environmental factors", frequency: 4, severity: "low" },
      { pattern: "Routine visitor badge violations during peak hours", frequency: 3, severity: "low" },
      { pattern: "Occasional delivery vehicle protocol deviations", frequency: 5, severity: "low" },
      { pattern: "Weather-related false alarms from outdoor sensors", frequency: 7, severity: "low" }
    ],
    risks: [
      { 
        risk: "Visitor management system compliance gaps", 
        likelihood: "Medium", 
        impact: "Low",
        mitigation: "Refresher training for reception staff on badge procedures"
      },
      { 
        risk: "Environmental sensor calibration drift", 
        likelihood: "Medium", 
        impact: "Low",
        mitigation: "Schedule quarterly sensor calibration and testing"
      }
    ],
    recommendations: [
      { 
        priority: "Low", 
        action: "Conduct visitor management system training for front desk staff", 
        rationale: "Reduce badge protocol violations and improve compliance" 
      },
      { 
        priority: "Low", 
        action: "Implement quarterly environmental sensor maintenance schedule", 
        rationale: "Prevent weather-related false alarms" 
      },
      { 
        priority: "Low", 
        action: "Update delivery vendor protocols and distribute to regular carriers", 
        rationale: "Standardize procedures across all delivery partners" 
      }
    ],
    trends: {
      summary: "All key metrics within normal ranges. No significant trends or patterns requiring intervention.",
      hotspots: [
        "Main Reception Area - Badge Processing",
        "Loading Dock - North Entrance"
      ]
    }
  },
  {
    threatLevel: "High",
    summary: "Elevated threat level detected with multiple serious incidents and emerging patterns suggesting coordinated activity. Immediate enhanced security measures required.",
    patterns: [
      { pattern: "Multiple perimeter breaches at consistent timeframes", frequency: 11, severity: "critical" },
      { pattern: "Sophisticated alarm bypass attempts detected", frequency: 4, severity: "critical" },
      { pattern: "Suspicious vehicle reconnaissance patterns near high-value areas", frequency: 9, severity: "high" },
      { pattern: "Coordinated distraction incidents preceding main security events", frequency: 6, severity: "high" },
      { pattern: "Unusual staff access pattern anomalies at sensitive locations", frequency: 7, severity: "high" }
    ],
    risks: [
      { 
        risk: "Coordinated organized crime targeting high-value assets", 
        likelihood: "High", 
        impact: "Critical",
        mitigation: "Activate enhanced security protocols, increase armed response presence, coordinate with law enforcement"
      },
      { 
        risk: "Insider threat facilitating external attacks", 
        likelihood: "Medium", 
        impact: "Critical",
        mitigation: "Implement immediate access audits, activate two-person rules, review recent staff access logs"
      },
      { 
        risk: "Security system compromise through sophisticated technical means", 
        likelihood: "Medium", 
        impact: "High",
        mitigation: "Conduct emergency security system audit, implement backup monitoring protocols"
      }
    ],
    recommendations: [
      { 
        priority: "Critical", 
        action: "Activate Level 2 Security Protocol - increase armed response units and patrol frequency", 
        rationale: "Pattern analysis indicates imminent threat of coordinated attack" 
      },
      { 
        priority: "Critical", 
        action: "Coordinate with local law enforcement for enhanced presence and intelligence sharing", 
        rationale: "Threat sophistication exceeds standard security measures" 
      },
      { 
        priority: "High", 
        action: "Implement emergency access review for all staff with access to high-value areas", 
        rationale: "Access pattern anomalies suggest potential insider threat component" 
      },
      { 
        priority: "High", 
        action: "Deploy rapid response teams to identified hotspot areas with orders to challenge all suspicious activity", 
        rationale: "Proactive deterrence required in vulnerable zones" 
      },
      { 
        priority: "High", 
        action: "Conduct immediate technical security audit of alarm and access control systems", 
        rationale: "Bypass attempts indicate advanced technical knowledge of systems" 
      }
    ],
    trends: {
      summary: "Sharp increase in incident severity and sophistication over past 7 days. Multiple indicators suggest organized reconnaissance and planning activities.",
      hotspots: [
        "High-Value Storage Area - Warehouse 2",
        "East Perimeter - Service Gate Alpha",
        "Executive Parking - Underground Section",
        "IT Server Room - Building A",
        "Perimeter Fence - Northeast Corner"
      ]
    }
  }
];

const ThreatAnalysis = () => {
  const [analysis, setAnalysis] = useState<ThreatAnalysisData | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  const runAnalysis = () => {
    const randomAnalysis = STATIC_ANALYSES[Math.floor(Math.random() * STATIC_ANALYSES.length)];
    setAnalysis(randomAnalysis);
    setAnalyzedAt(new Date().toISOString());
  };

  const getThreatLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-alert-critical text-primary-foreground';
      case 'high': return 'bg-alert-caution text-primary-foreground';
      case 'medium': return 'bg-alert-caution text-primary-foreground';
      case 'low': return 'bg-alert-normal text-primary-foreground';
      default: return 'bg-secondary text-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Threat Intelligence Analysis</CardTitle>
                <CardDescription>
                  Analyze incident patterns and predict potential security risks
                </CardDescription>
              </div>
            </div>
            <Button onClick={runAnalysis} className="gap-2 w-full sm:w-auto">
              <Brain className="w-4 h-4" />
              Run Analysis
            </Button>
          </div>
        </CardHeader>

        {!analysis ? (
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Click "Run Analysis" to generate threat intelligence based on recent security incidents
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <h3 className="text-lg font-semibold">Threat Assessment</h3>
                <Badge className={getThreatLevelColor(analysis.threatLevel)}>
                  {analysis.threatLevel} Threat Level
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
              {analyzedAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Analyzed: {new Date(analyzedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Detected Patterns
              </h3>
              <div className="grid gap-3">
                {analysis.patterns.map((pattern, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium">{pattern.pattern}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Frequency: {pattern.frequency} occurrences
                        </p>
                      </div>
                      <Badge variant={getSeverityColor(pattern.severity)}>
                        {pattern.severity}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Identified Risks
              </h3>
              <div className="grid gap-3">
                {analysis.risks.map((risk, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <h4 className="font-semibold flex-1">{risk.risk}</h4>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">Likelihood: {risk.likelihood}</Badge>
                          <Badge variant="outline">Impact: {risk.impact}</Badge>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Mitigation:</span> {risk.mitigation}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Recommendations
              </h3>
              <div className="grid gap-3">
                {analysis.recommendations.map((rec, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <h4 className="font-semibold flex-1">{rec.action}</h4>
                        <Badge 
                          variant={rec.priority.toLowerCase() === 'critical' ? 'destructive' : 
                                  rec.priority.toLowerCase() === 'high' ? 'default' : 'secondary'}
                        >
                          {rec.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Trends & Hotspots
              </h3>
              <Card className="p-4">
                <div className="space-y-4">
                  <p className="text-muted-foreground">{analysis.trends.summary}</p>
                  <div>
                    <p className="font-medium mb-2">High-Activity Locations:</p>
                    <ul className="space-y-1">
                      {analysis.trends.hotspots.map((spot, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                          {spot}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ThreatAnalysis;
