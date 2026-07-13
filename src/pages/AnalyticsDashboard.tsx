import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, AlertTriangle, Users, Target, Clock, Shield, CheckCircle2 } from "lucide-react";

export default function AnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>({
    revenue: [],
    payments: [],
    risks: [],
    clients: [],
    sectors: [],
    kpis: {},
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAnalytics();
  }, [user, authLoading]);

  const fetchAnalytics = async () => {
    try {
      const { data: finances } = await supabase
        .from("client_finances")
        .select("*, clients(legal_name)")
        .order("invoice_date", { ascending: true });

      const { data: risks } = await supabase
        .from("risk_assessments")
        .select("*, clients(legal_name), sites(site_name)");

      const { data: clients } = await supabase
        .from("clients")
        .select("*, contracts(*), sites(*)");

      // Process revenue data by month
      const revenueByMonth: any = {};
      finances?.forEach((f) => {
        const month = new Date(f.invoice_date).toLocaleDateString('en', { month: 'short', year: 'numeric' });
        if (!revenueByMonth[month]) {
          revenueByMonth[month] = { month, total: 0, paid: 0, pending: 0 };
        }
        revenueByMonth[month].total += Number(f.amount);
        if (f.payment_status === 'paid') {
          revenueByMonth[month].paid += Number(f.amount);
        } else {
          revenueByMonth[month].pending += Number(f.amount);
        }
      });

      const revenue = Object.values(revenueByMonth);

      // Payment status distribution
      const paymentStats: any = {
        paid: 0,
        pending: 0,
        overdue: 0,
        partial: 0,
      };
      finances?.forEach((f) => {
        paymentStats[f.payment_status] = (paymentStats[f.payment_status] || 0) + 1;
      });

      const payments = Object.keys(paymentStats).map((key) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: paymentStats[key],
      }));

      // Risk distribution
      const riskStats: any = {
        low: 0,
        medium: 0,
        high: 0,
      };
      risks?.forEach((r) => {
        riskStats[r.risk_tier] = (riskStats[r.risk_tier] || 0) + 1;
      });

      const riskData = Object.keys(riskStats).map((key) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: riskStats[key],
      }));

      // Client sectors
      const sectorStats: any = {};
      clients?.forEach((c) => {
        const sector = c.sector || 'Unknown';
        sectorStats[sector] = (sectorStats[sector] || 0) + 1;
      });

      const clientData = Object.keys(sectorStats).map((key) => ({
        sector: key,
        count: sectorStats[key],
      }));

      // Additional queries for derived KPIs
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const [resolvedIncRes, alarmSlaRes, trainingRes, riskSitesRes] = await Promise.all([
        supabase.from("incidents").select("occurred_at, resolved_at").not("resolved_at", "is", null).gte("resolved_at", thirtyDaysAgo),
        supabase.from("alarm_activations").select("sla_breached").gte("triggered_at", thirtyDaysAgo),
        supabase.from("training_records" as any).select("staff_id"),
        supabase.from("risk_assessments").select("site_id"),
      ]);

      // Incident resolution: avg hours from occurred_at to resolved_at
      const resolvedIncs = resolvedIncRes.data ?? [];
      const resHours = resolvedIncs.map((i: any) => {
        const ms = new Date(i.resolved_at).getTime() - new Date(i.occurred_at).getTime();
        return ms / 3600000;
      }).filter((h: number) => h > 0 && h < 720);
      const avgResolutionHours = resHours.length > 0
        ? (resHours.reduce((a: number, b: number) => a + b, 0) / resHours.length).toFixed(1)
        : null;

      // Control room compliance from alarm SLA data
      const alarmSlaData = alarmSlaRes.data ?? [];
      const totalAlarmsSla = alarmSlaData.length;
      const slaOkCount = alarmSlaData.filter((a: any) => !a.sla_breached).length;
      const controlRoomCompliance = totalAlarmsSla > 0
        ? Number(((slaOkCount / totalAlarmsSla) * 100).toFixed(1))
        : null;

      // Training compliance: staff with at least one training record / total active staff
      const trainedStaffIds = new Set((trainingRes.data ?? []).map((r: any) => r.staff_id));
      const { count: totalStaff } = await supabase.from("staff").select("id", { count: "exact", head: true }).eq("status", "active");
      const trainingCompliance = totalStaff && totalStaff > 0
        ? Number(((trainedStaffIds.size / totalStaff) * 100).toFixed(1))
        : null;

      // Risk assessment rate: sites with at least one risk assessment / total sites
      const assessedSiteIds = new Set((riskSitesRes.data ?? []).map((r: any) => r.site_id));
      const { count: totalSites } = await supabase.from("sites").select("id", { count: "exact", head: true });
      const riskAssessmentRate = totalSites && totalSites > 0
        ? Number(((assessedSiteIds.size / totalSites) * 100).toFixed(1))
        : null;

      // Calculate KPIs
      const activeClients = clients?.filter(c => c.status === 'active').length || 0;
      const totalClients = clients?.length || 0;
      const retentionRate = totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : 0;

      const kpis = {
        clientRetention: retentionRate,
        satisfactionIndex: null,
        incidentResolution: avgResolutionHours,
        controlRoomCompliance,
        trainingCompliance,
        riskAssessmentRate,
      };

      setAnalytics({
        revenue,
        payments,
        risks: riskData,
        clients: clientData,
        sectors: clientData,
        kpis,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPulse />;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--alert-caution))', 'hsl(var(--alert-critical))', 'hsl(var(--alert-normal))'];

  const totalRevenue = analytics.revenue.reduce((sum: number, item: any) => sum + item.total, 0);
  const paidRevenue = analytics.revenue.reduce((sum: number, item: any) => sum + item.paid, 0);
  const pendingRevenue = analytics.revenue.reduce((sum: number, item: any) => sum + item.pending, 0);
  const collectionRate = totalRevenue > 0 ? ((paidRevenue / totalRevenue) * 100).toFixed(1) : 0;

  const getKPIStatus = (value: number, target: number) => {
    if (value >= target) return { color: 'hsl(var(--alert-normal))', status: '🟢 On Track' };
    if (value >= target * 0.9) return { color: 'hsl(var(--alert-caution))', status: '🟡 Slight Dip' };
    return { color: 'hsl(var(--alert-critical))', status: '🔴 Needs Attention' };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Analytics Dashboard"
        description="Comprehensive business insights and performance metrics"
      />

      {/* Key Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: 'hsl(var(--primary))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">KES {totalRevenue.toLocaleString()}</div>
            <p className="text-xs font-medium text-foreground/80">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: 'hsl(var(--alert-normal))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">KES {paidRevenue.toLocaleString()}</div>
            <p className="text-xs font-medium text-foreground/80">{collectionRate}% rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: 'hsl(var(--alert-caution))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">KES {pendingRevenue.toLocaleString()}</div>
            <p className="text-xs font-medium text-foreground/80">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: 'hsl(var(--accent))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{analytics.clients.length}</div>
            <p className="text-xs font-medium text-foreground/80">Across sectors</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Service Quality Analytics</CardTitle>
          <CardDescription>Key Performance Indicators - 2025 Q4</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  <div>
                    <p className="font-medium">Client Retention Rate</p>
                    <p className="text-sm text-muted-foreground">Target: ≥ 90%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{analytics.kpis.clientRetention}%</p>
                  <Badge variant="outline" className="mt-1">{getKPIStatus(Number(analytics.kpis.clientRetention), 90).status}</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" style={{ color: 'hsl(var(--alert-normal))' }} />
                  <div>
                    <p className="font-medium">Incident Resolution Time</p>
                    <p className="text-sm text-muted-foreground">Avg hours (last 30 days)</p>
                  </div>
                </div>
                <div className="text-right">
                  {analytics.kpis.incidentResolution != null ? (
                    <>
                      <p className="text-2xl font-bold">{analytics.kpis.incidentResolution} hrs</p>
                      <Badge variant="outline" className="mt-1">{getKPIStatus(3 / Number(analytics.kpis.incidentResolution), 1).status}</Badge>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No data</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  <div>
                    <p className="font-medium">Alarm SLA Compliance</p>
                    <p className="text-sm text-muted-foreground">Target: 100%</p>
                  </div>
                </div>
                <div className="text-right">
                  {analytics.kpis.controlRoomCompliance != null ? (
                    <>
                      <p className="text-2xl font-bold">{analytics.kpis.controlRoomCompliance}%</p>
                      <Badge variant="outline" className="mt-1">{getKPIStatus(analytics.kpis.controlRoomCompliance, 95).status}</Badge>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No data</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" style={{ color: 'hsl(var(--alert-caution))' }} />
                  <div>
                    <p className="font-medium">Training Compliance</p>
                    <p className="text-sm text-muted-foreground">Target: 95%</p>
                  </div>
                </div>
                <div className="text-right">
                  {analytics.kpis.trainingCompliance != null ? (
                    <>
                      <p className="text-2xl font-bold">{analytics.kpis.trainingCompliance}%</p>
                      <Badge variant="outline" className="mt-1">{getKPIStatus(analytics.kpis.trainingCompliance, 95).status}</Badge>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No data</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--alert-critical))' }} />
                  <div>
                    <p className="font-medium">Risk Assessment Coverage</p>
                    <p className="text-sm text-muted-foreground">Target: 100%</p>
                  </div>
                </div>
                <div className="text-right">
                  {analytics.kpis.riskAssessmentRate != null ? (
                    <>
                      <p className="text-2xl font-bold">{analytics.kpis.riskAssessmentRate}%</p>
                      <Badge variant="outline" className="mt-1">{getKPIStatus(analytics.kpis.riskAssessmentRate, 100).status}</Badge>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No data</p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Tabs defaultValue="sectors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="sectors" className="text-xs sm:text-sm py-2">Sectors</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs sm:text-sm py-2">Revenue</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">Payments</TabsTrigger>
          <TabsTrigger value="risks" className="text-xs sm:text-sm py-2">Risks</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm py-2 col-span-2 sm:col-span-1">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sectors">
          <Card>
            <CardHeader>
              <CardTitle>Client Portfolio by Sector</CardTitle>
              <CardDescription>Distribution across industry sectors - 15 total clients</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {analytics.sectors.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No sector data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sectors}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="sector" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Number of Clients">
                      {analytics.sectors.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue breakdown with paid vs pending</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {analytics.revenue.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No revenue data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                    <Tooltip 
                      formatter={(value) => `KES ${Number(value).toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Total" strokeWidth={2} />
                    <Line type="monotone" dataKey="paid" stroke="hsl(var(--alert-normal))" name="Paid" strokeWidth={2} />
                    <Line type="monotone" dataKey="pending" stroke="hsl(var(--alert-caution))" name="Pending" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Distribution</CardTitle>
              <CardDescription>Breakdown of invoice payment statuses</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {analytics.payments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No payment data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.payments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={120}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {analytics.payments.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Distribution</CardTitle>
              <CardDescription>Current risk tier breakdown across all sites</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {analytics.risks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No risk assessment data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.risks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Number of Sites">
                      {analytics.risks.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Action Insights & Recommendations</CardTitle>
              <CardDescription>Strategic priorities for Q1 2026</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded">
                        <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Contract Renewals</h4>
                        <p className="text-sm text-muted-foreground">
                          Initiate contract review meetings with <strong>Autobox Motors Ltd</strong> and <strong>Nextgen Mall</strong> before Q1 2026.
                        </p>
                        <Badge variant="outline" className="mt-2">High Priority</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="bg-accent/10 p-2 rounded">
                        <Shield className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Risk Assessments</h4>
                        <p className="text-sm text-muted-foreground">
                          Update reports for <strong>Intex Africa, Avix Motors, NSSF Apartments</strong>, and <strong>Aboosto Cosmetics</strong>.
                        </p>
                        <Badge variant="outline" className="mt-2">Medium Priority</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="bg-alert-normal/10 p-2 rounded">
                        <CheckCircle2 className="h-5 w-5" style={{ color: 'hsl(var(--alert-normal))' }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Training Program</h4>
                        <p className="text-sm text-muted-foreground">
                          Launch a <strong>Guard Refresher Program</strong> for hospitality and industrial sites by January 2026.
                        </p>
                        <Badge variant="outline" className="mt-2">Scheduled</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded">
                        <Users className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Client Engagement</h4>
                        <p className="text-sm text-muted-foreground">
                          Implement <strong>Monthly Service Review Reports</strong> and feedback surveys through the Console.
                        </p>
                        <Badge variant="outline" className="mt-2">In Progress</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="bg-accent/10 p-2 rounded">
                        <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Market Expansion</h4>
                        <p className="text-sm text-muted-foreground">
                          Target <strong>Healthcare & Energy Sectors</strong> in 2026 — both offer long-term, compliance-driven contracts.
                        </p>
                        <Badge variant="outline" className="mt-2">Strategic</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded">
                        <Target className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Data Integration</h4>
                        <p className="text-sm text-muted-foreground">
                          Link each client record to the <strong>Ops Dashboard</strong> showing risk tier, sites, and contract expiry alerts.
                        </p>
                        <Badge variant="outline" className="mt-2">Technical</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}