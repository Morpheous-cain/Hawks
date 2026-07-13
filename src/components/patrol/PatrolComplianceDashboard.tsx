import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import usePatrolCompliance from "@/hooks/usePatrolCompliance";

const gradeColors: Record<string, string> = {
  A: 'bg-green-600 text-white',
  B: 'bg-primary text-primary-foreground',
  C: 'bg-amber-500 text-white',
  D: 'bg-orange-500 text-white',
  F: 'bg-destructive text-destructive-foreground',
};

const PatrolComplianceDashboard = () => {
  const { data: scores = [], isLoading } = usePatrolCompliance();

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, c) => s + c.overallScore, 0) / scores.length)
    : 0;
  const topPerformers = scores.filter(s => s.grade === 'A').length;
  const needsAttention = scores.filter(s => s.grade === 'D' || s.grade === 'F').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading compliance data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{topPerformers}</p>
                <p className="text-xs text-muted-foreground">Top Performers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{needsAttention}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scores.length}</p>
                <p className="text-xs text-muted-foreground">Officers Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Officer Compliance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Officer Patrol Compliance Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No patrol data available for the selected period
            </p>
          ) : (
            <div className="space-y-3">
              {scores.map((score) => (
                <div
                  key={score.officerId}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{score.officerName}</p>
                        <Badge className={gradeColors[score.grade]}>{score.grade}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{score.siteName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{score.overallScore}%</p>
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Hit Rate</p>
                      <div className="flex items-center gap-2">
                        <Progress value={score.hitRate} className="h-2 flex-1" />
                        <span className="font-medium">{score.hitRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Timing</p>
                      <div className="flex items-center gap-2">
                        <Progress value={score.timingScore} className="h-2 flex-1" />
                        <span className="font-medium">{score.timingScore}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Checkpoints</p>
                      <p className="font-medium">
                        {score.completedCheckpoints}/{score.totalExpectedCheckpoints}
                        {score.missedCheckpoints > 0 && (
                          <span className="text-destructive ml-1">({score.missedCheckpoints} missed)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Scan</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {score.lastScanTime
                          ? new Date(score.lastScanTime).toLocaleTimeString()
                          : 'No scans'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatrolComplianceDashboard;
