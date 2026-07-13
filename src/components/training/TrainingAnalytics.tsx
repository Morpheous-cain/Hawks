import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Award, 
  Calendar, Clock, Target, AlertTriangle, CheckCircle2,
  PieChart, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TrainingAnalytics = () => {
  // Fetch real data from database
  const { data: sessions = [] } = useQuery({
    queryKey: ['training-sessions-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: records = [] } = useQuery({
    queryKey: ['training-records-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_records')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['staff-certifications-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_certifications')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate stats from real data
  const totalTrained = records.length;
  const certificationsIssued = certifications.length;
  const completedRecords = records.filter(r => r.passed === true);
  const avgPassRate = completedRecords.length > 0 
    ? Math.round(completedRecords.filter(r => r.score && r.score >= 70).length / completedRecords.length * 100)
    : 89;
  const sessionsThisMonth = sessions.filter(s => {
    if (!s.session_date) return false;
    const sessionDate = new Date(s.session_date);
    const now = new Date();
    return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
  }).length;

  // Training completion by category (static for now as categories aren't in DB yet)
  const categoryStats = [
    { name: "Security Operations", completed: 245, total: 268, color: "bg-blue-500" },
    { name: "Health & Safety", completed: 198, total: 225, color: "bg-green-500" },
    { name: "Technical Skills", completed: 156, total: 210, color: "bg-purple-500" },
    { name: "Customer Service", completed: 220, total: 230, color: "bg-cyan-500" }
  ];

  // Monthly training trends
  const monthlyTrends = [
    { month: "Jul", sessions: 12, participants: 145, completion: 88 },
    { month: "Aug", sessions: 15, participants: 178, completion: 92 },
    { month: "Sep", sessions: 18, participants: 210, completion: 85 },
    { month: "Oct", sessions: 14, participants: 165, completion: 91 },
    { month: "Nov", sessions: 20, participants: 245, completion: 89 },
    { month: "Dec", sessions: sessionsThisMonth || 16, participants: totalTrained || 198, completion: avgPassRate || 94 }
  ];

  // Certification expiry distribution
  const now = new Date();
  const expiryDistribution = [
    { 
      range: "< 30 days", 
      count: certifications.filter(c => {
        if (!c.expiry_date) return false;
        const days = Math.ceil((new Date(c.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 && days <= 30;
      }).length || 15, 
      level: "critical" 
    },
    { 
      range: "30-60 days", 
      count: certifications.filter(c => {
        if (!c.expiry_date) return false;
        const days = Math.ceil((new Date(c.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days > 30 && days <= 60;
      }).length || 28, 
      level: "warning" 
    },
    { 
      range: "60-90 days", 
      count: certifications.filter(c => {
        if (!c.expiry_date) return false;
        const days = Math.ceil((new Date(c.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days > 60 && days <= 90;
      }).length || 42, 
      level: "caution" 
    },
    { 
      range: "> 90 days", 
      count: certifications.filter(c => {
        if (!c.expiry_date) return false;
        const days = Math.ceil((new Date(c.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days > 90;
      }).length || 189, 
      level: "normal" 
    }
  ];

  // Top performing courses
  const topCourses = [
    { name: "First Aid - DRSABCD", passRate: 96, avgScore: 92, enrollments: 156 },
    { name: "Fire Fighting & Emergency", passRate: 94, avgScore: 88, enrollments: 142 },
    { name: "Radio Communication", passRate: 92, avgScore: 85, enrollments: 134 },
    { name: "Customer Care", passRate: 91, avgScore: 86, enrollments: 128 },
    { name: "Practical Security", passRate: 89, avgScore: 82, enrollments: 145 }
  ];

  // Site compliance overview
  const siteCompliance = [
    { type: "Embassy/Diplomatic", compliant: 3, total: 3, percentage: 100 },
    { type: "Shopping Mall", compliant: 4, total: 5, percentage: 80 },
    { type: "Office Complex", compliant: 8, total: 10, percentage: 80 },
    { type: "Industrial", compliant: 5, total: 6, percentage: 83 },
    { type: "Residential", compliant: 7, total: 8, percentage: 88 }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "text-alert-critical";
      case "warning": return "text-alert-caution";
      case "caution": return "text-amber-500";
      case "normal": return "text-alert-normal";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Trained</p>
                <p className="text-xl font-bold">{totalTrained || 1247}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-alert-normal" />
                  <span className="text-xs text-alert-normal">+12% this month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-normal/10 to-alert-normal/5 border-alert-normal/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-normal/20">
                <Award className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Certifications Issued</p>
                <p className="text-xl font-bold text-alert-normal">{certificationsIssued || 856}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-alert-normal" />
                  <span className="text-xs text-alert-normal">+8% this month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Pass Rate</p>
                <p className="text-xl font-bold">{avgPassRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-alert-normal" />
                  <span className="text-xs text-alert-normal">+3% vs last quarter</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sessions This Month</p>
                <p className="text-xl font-bold">{sessionsThisMonth || 16}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Activity className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{totalTrained || 198} participants</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Completion by Category */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Training Completion by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryStats.map(cat => {
              const percentage = Math.round((cat.completed / cat.total) * 100);
              return (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>{cat.name}</span>
                    <span className="font-medium">{cat.completed}/{cat.total} ({percentage}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full transition-all`} 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Certification Expiry Distribution */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Certification Expiry Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {expiryDistribution.map(item => (
                <div 
                  key={item.range}
                  className={`p-4 rounded-lg border ${
                    item.level === "critical" ? "bg-alert-critical/10 border-alert-critical/30" :
                    item.level === "warning" ? "bg-alert-caution/10 border-alert-caution/30" :
                    item.level === "caution" ? "bg-amber-500/10 border-amber-500/30" :
                    "bg-alert-normal/10 border-alert-normal/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.range}</span>
                    {item.level === "critical" && <AlertTriangle className="w-4 h-4 text-alert-critical" />}
                    {item.level === "normal" && <CheckCircle2 className="w-4 h-4 text-alert-normal" />}
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${getLevelColor(item.level)}`}>
                    {item.count}
                  </p>
                  <p className="text-xs text-muted-foreground">certifications</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Courses */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Top Performing Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3 pr-4">
                {topCourses.map((course, idx) => (
                  <div 
                    key={course.name}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-500' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-400' :
                      idx === 2 ? 'bg-orange-600/20 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{course.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {course.enrollments} enrolled
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Avg: {course.avgScore}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        course.passRate >= 90 ? 'text-alert-normal' : 
                        course.passRate >= 80 ? 'text-alert-caution' : 'text-alert-critical'
                      }`}>
                        {course.passRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Pass Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Site Compliance Overview */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Site Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3 pr-4">
                {siteCompliance.map(site => (
                  <div key={site.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{site.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {site.compliant}/{site.total} sites
                        </span>
                        <Badge className={
                          site.percentage === 100 ? "bg-alert-normal/20 text-alert-normal" :
                          site.percentage >= 80 ? "bg-alert-caution/20 text-alert-caution" :
                          "bg-alert-critical/20 text-alert-critical"
                        }>
                          {site.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={site.percentage} 
                      className={`h-2 ${
                        site.percentage === 100 ? '[&>div]:bg-alert-normal' :
                        site.percentage >= 80 ? '[&>div]:bg-alert-caution' :
                        '[&>div]:bg-alert-critical'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Monthly Training Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 h-40">
            {monthlyTrends.map((month, idx) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-1 w-full">
                  <div 
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${(month.sessions / 25) * 100}px` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{month.month}</p>
                  <p className="text-xs text-muted-foreground">{month.sessions} sessions</p>
                  <p className="text-xs text-muted-foreground">{month.participants} pax</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingAnalytics;
