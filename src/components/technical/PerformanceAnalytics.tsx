import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Clock, CheckCircle, Star, Award, Target, Users, BarChart3 } from "lucide-react";

const PerformanceAnalytics = () => {
  const technicians = [
    { 
      id: "1",
      name: "David Kimani", 
      completionRate: 94, 
      avgResponseTime: "45 min", 
      clientRating: 4.8, 
      slaMet: 92, 
      rating: "Excellent",
      jobsCompleted: 127,
      preventiveMaint: 68,
      reactiveMaint: 59,
      clientSatisfaction: 96
    },
    { 
      id: "2",
      name: "Grace Wanjiru", 
      completionRate: 89, 
      avgResponseTime: "52 min", 
      clientRating: 4.6, 
      slaMet: 87, 
      rating: "Good",
      jobsCompleted: 98,
      preventiveMaint: 52,
      reactiveMaint: 46,
      clientSatisfaction: 91
    },
    { 
      id: "3",
      name: "John Odhiambo", 
      completionRate: 96, 
      avgResponseTime: "38 min", 
      clientRating: 4.9, 
      slaMet: 95, 
      rating: "Excellent",
      jobsCompleted: 142,
      preventiveMaint: 89,
      reactiveMaint: 53,
      clientSatisfaction: 98
    },
    { 
      id: "4",
      name: "Mary Achieng", 
      completionRate: 85, 
      avgResponseTime: "58 min", 
      clientRating: 4.4, 
      slaMet: 82, 
      rating: "Good",
      jobsCompleted: 76,
      preventiveMaint: 38,
      reactiveMaint: 38,
      clientSatisfaction: 88
    },
  ];

  const monthlyTrends = [
    { month: "Oct", preventive: 72, reactive: 45, ratio: 1.6 },
    { month: "Nov", preventive: 81, reactive: 52, ratio: 1.56 },
    { month: "Dec", preventive: 95, reactive: 48, ratio: 1.98 },
  ];

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Department Overview</TabsTrigger>
        <TabsTrigger value="scorecards">Technician Scorecards</TabsTrigger>
        <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
      </TabsList>

      {/* Department Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg SLA Compliance</p>
                <p className="text-2xl font-bold text-foreground">89%</p>
                <p className="text-xs text-success">+3% from last month</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold text-foreground">92%</p>
                <p className="text-xs text-success">+2% improvement</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                <p className="text-2xl font-bold text-foreground">4.7/5</p>
                <p className="text-xs text-success">Excellent rating</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rework Rate</p>
                <p className="text-2xl font-bold text-foreground">6%</p>
                <p className="text-xs text-success">-2% reduction</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Team Comparison */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Team Performance Comparison</h3>
          <div className="space-y-4">
            {technicians.map((tech) => (
              <div key={tech.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{tech.name}</span>
                  <Badge variant={tech.rating === "Excellent" ? "default" : "secondary"}>
                    {tech.rating}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="text-foreground">{tech.completionRate}%</span>
                    </div>
                    <Progress value={tech.completionRate} className="h-2" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">SLA</span>
                      <span className="text-foreground">{tech.slaMet}%</span>
                    </div>
                    <Progress value={tech.slaMet} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      {/* Technician Scorecards Tab */}
      <TabsContent value="scorecards" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicians.map((tech) => (
            <Card key={tech.id} className="p-4 bg-card border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{tech.name}</h4>
                  <p className="text-sm text-muted-foreground">{tech.jobsCompleted} jobs completed</p>
                </div>
                <Badge variant={tech.rating === "Excellent" ? "default" : "secondary"} className="text-lg px-3 py-1">
                  <Award className="w-4 h-4 mr-1" />
                  {tech.rating}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Response Time */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Response Time</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{tech.avgResponseTime}</span>
                  </div>
                </div>

                {/* Completion Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{tech.completionRate}%</span>
                  </div>
                  <Progress value={tech.completionRate} className="h-2" />
                </div>

                {/* Client Satisfaction */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Client Satisfaction</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{tech.clientSatisfaction}%</span>
                  </div>
                  <Progress value={tech.clientSatisfaction} className="h-2" />
                </div>

                {/* SLA Compliance */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">SLA Compliance</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{tech.slaMet}%</span>
                  </div>
                  <Progress value={tech.slaMet} className="h-2" />
                </div>

                {/* Work Breakdown */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Work Breakdown</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground">Preventive</p>
                      <p className="text-foreground font-semibold">{tech.preventiveMaint} jobs</p>
                    </div>
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground">Reactive</p>
                      <p className="text-foreground font-semibold">{tech.reactiveMaint} jobs</p>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center pt-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= tech.clientRating ? "text-warning fill-warning" : "text-muted"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-lg font-semibold text-foreground">{tech.clientRating}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Monthly Trends Tab */}
      <TabsContent value="trends" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-foreground">Team Performance</h4>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">92.5%</div>
            <p className="text-sm text-success">+4.2% vs last quarter</p>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-foreground">Preventive Ratio</h4>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">1.72:1</div>
            <p className="text-sm text-success">Improving trend</p>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-foreground">Avg Client Rating</h4>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">4.68/5</div>
            <p className="text-sm text-success">Excellent service</p>
          </Card>
        </div>

        <Card className="p-4 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Maintenance Ratio Trends</h3>
          <div className="space-y-4">
            {monthlyTrends.map((trend) => (
              <div key={trend.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{trend.month} 2024</span>
                  <Badge variant="outline">Ratio: {trend.ratio}:1</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Preventive</p>
                    <div className="flex items-center gap-2">
                      <Progress value={(trend.preventive / (trend.preventive + trend.reactive)) * 100} className="h-2" />
                      <span className="text-xs text-foreground">{trend.preventive}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reactive</p>
                    <div className="flex items-center gap-2">
                      <Progress value={(trend.reactive / (trend.preventive + trend.reactive)) * 100} className="h-2" />
                      <span className="text-xs text-foreground">{trend.reactive}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Client Satisfaction Collection</h3>
          <p className="text-sm text-muted-foreground mb-3">
            After-service ratings are automatically requested via SMS/Email after each completed work order.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-background/50 p-3 rounded">
              <p className="text-muted-foreground">Response Rate</p>
              <p className="text-xl font-bold text-foreground">78%</p>
            </div>
            <div className="bg-background/50 p-3 rounded">
              <p className="text-muted-foreground">Avg Rating</p>
              <p className="text-xl font-bold text-foreground">4.68/5</p>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default PerformanceAnalytics;
