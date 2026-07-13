import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { BarChart3, TrendingUp, Clock, Target, Download, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { exportToCSV } from "@/utils/exportData";
import { supabase } from "@/integrations/supabase/client";
import LoadingPulse from "@/components/LoadingPulse";

const CHART_COLORS = [
  "hsl(0 84% 60%)",
  "hsl(38 92% 55%)",
  "hsl(210 100% 55%)",
  "hsl(142 76% 45%)",
  "hsl(270 60% 60%)",
  "hsl(190 95% 45%)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
};

interface MonthPoint {
  month: string;
  incidents: number;
  resolved: number;
  responseTime: number;
}

interface AnalyticsData {
  monthlyData: MonthPoint[];
  incidentTypeData: { name: string; value: number; color: string }[];
  kpis: { label: string; value: string; trend: string }[];
  responseByType: { type: string; time: string; percentage: number }[];
  resolutionRate: number;
  totalIncidents: number;
  escalatedCount: number;
  sitePerformance: { site: string; incidents: number; response: string; sla: string; rating: string }[];
}

const empty: AnalyticsData = {
  monthlyData: [],
  incidentTypeData: [],
  kpis: [],
  responseByType: [],
  resolutionRate: 0,
  totalIncidents: 0,
  escalatedCount: 0,
  sitePerformance: [],
};

const Analytics = () => {
  const [days, setDays] = useState(365);
  const [data, setData] = useState<AnalyticsData>(empty);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (daysBack: number) => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - daysBack * 86400000).toISOString();
      const monthSince = new Date(Date.now() - 30 * 86400000).toISOString();

      const [incRes, alarmRes, attendRes, staffRes, techRes, sitesRes, escalRes] = await Promise.all([
        supabase.from("incidents").select("id, incident_type, status, occurred_at, resolved_at, site_id, sla_breached").gte("occurred_at", since),
        supabase.from("alarm_activations").select("triggered_at, acknowledged_at, sla_breached").gte("triggered_at", monthSince).not("acknowledged_at", "is", null),
        supabase.from("attendance").select("id", { count: "exact", head: true }).is("check_out", null),
        supabase.from("staff").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("technical_equipment" as any).select("status"),
        supabase.from("sites").select("id, site_name"),
        supabase.from("incident_escalations" as any).select("id", { count: "exact", head: true }),
      ]);

      const incidents = incRes.data ?? [];
      const alarms = alarmRes.data ?? [];
      const sites = sitesRes.data ?? [];
      const escalatedCount = escalRes.count ?? 0;

      // ── Monthly incident trend ──
      const byMonth: Record<string, { incidents: number; resolved: number; responseMins: number[]; }> = {};
      incidents.forEach((inc) => {
        const d = new Date(inc.occurred_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!byMonth[key]) byMonth[key] = { incidents: 0, resolved: 0, responseMins: [] };
        byMonth[key].incidents++;
        if (inc.status === "resolved" || inc.status === "closed") {
          byMonth[key].resolved++;
          if (inc.resolved_at) {
            const mins = (new Date(inc.resolved_at).getTime() - new Date(inc.occurred_at).getTime()) / 60000;
            if (mins > 0 && mins < 1440) byMonth[key].responseMins.push(mins);
          }
        }
      });
      const monthlyData: MonthPoint[] = Object.keys(byMonth).sort().map((key) => {
        const b = byMonth[key];
        const [yr, mo] = key.split("-");
        const monthLabel = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString("en", { month: "short", year: "2-digit" });
        const avgMin = b.responseMins.length ? b.responseMins.reduce((a, b) => a + b, 0) / b.responseMins.length : 0;
        return { month: monthLabel, incidents: b.incidents, resolved: b.resolved, responseTime: Math.round(avgMin * 10) / 10 };
      });

      // ── Incident type distribution ──
      const byType: Record<string, number> = {};
      incidents.forEach((inc) => {
        const t = inc.incident_type || "Other";
        byType[t] = (byType[t] ?? 0) + 1;
      });
      const incidentTypeData = Object.entries(byType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, value], i) => ({
          name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          value,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }));

      // ── KPIs ──
      const totalAlarms = alarms.length;
      const slaOk = alarms.filter((a) => !a.sla_breached).length;
      const slaCompliance = totalAlarms > 0 ? ((slaOk / totalAlarms) * 100).toFixed(1) : "N/A";

      const alarmResponseMins = alarms.map((a) =>
        (new Date(a.acknowledged_at!).getTime() - new Date(a.triggered_at).getTime()) / 60000
      ).filter((m) => m > 0 && m < 60);
      const avgResponseTime = alarmResponseMins.length
        ? (alarmResponseMins.reduce((a, b) => a + b, 0) / alarmResponseMins.length).toFixed(1)
        : "N/A";

      const activeStaff = staffRes.count ?? 0;
      const onShift = attendRes.count ?? 0;
      const attendanceRate = activeStaff > 0 ? ((onShift / activeStaff) * 100).toFixed(1) : "N/A";

      const techEquipment = ((techRes.data as any[]) ?? []);
      const totalEquip = techEquipment.length;
      const activeEquip = techEquipment.filter((e: any) => e.status === "active" || e.status === "operational").length;
      const equipUptime = totalEquip > 0 ? ((activeEquip / totalEquip) * 100).toFixed(1) : "N/A";

      const kpis = [
        { label: "Overall SLA Compliance", value: totalAlarms > 0 ? `${slaCompliance}%` : "N/A", trend: "" },
        { label: "Avg. Alarm Response Time", value: alarmResponseMins.length > 0 ? `${avgResponseTime} min` : "N/A", trend: "" },
        { label: "Personnel On-Shift Rate", value: activeStaff > 0 ? `${attendanceRate}%` : "N/A", trend: "" },
        { label: "Equipment Active Rate", value: totalEquip > 0 ? `${equipUptime}%` : "N/A", trend: "" },
      ];

      // ── Response time by incident type ──
      const typeResponse: Record<string, number[]> = {};
      incidents.forEach((inc) => {
        if (!inc.resolved_at) return;
        const mins = (new Date(inc.resolved_at).getTime() - new Date(inc.occurred_at).getTime()) / 60000;
        if (mins <= 0 || mins > 1440) return;
        const t = inc.incident_type || "Other";
        if (!typeResponse[t]) typeResponse[t] = [];
        typeResponse[t].push(mins);
      });
      const maxAvg = Math.max(1, ...Object.values(typeResponse).map((arr) => arr.reduce((a, b) => a + b, 0) / arr.length));
      const responseByType = Object.entries(typeResponse)
        .sort(([, a], [, b]) => b.reduce((x, y) => x + y, 0) / b.length - a.reduce((x, y) => x + y, 0) / a.length)
        .slice(0, 5)
        .map(([type, arr]) => {
          const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
          return {
            type: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            time: `${avg.toFixed(1)} min`,
            percentage: Math.round((avg / maxAvg) * 100),
          };
        });

      // ── Resolution stats ──
      const totalIncidents = incidents.length;
      const resolvedCount = incidents.filter((i) => i.status === "resolved" || i.status === "closed").length;
      const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0;

      // ── Site performance ──
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const thisMonthInc = incidents.filter((i) => i.occurred_at >= monthStart);
      const bySite: Record<string, { incidents: number; responseMins: number[]; slaOk: number; total: number }> = {};
      thisMonthInc.forEach((inc) => {
        const sid = inc.site_id;
        if (!sid) return;
        if (!bySite[sid]) bySite[sid] = { incidents: 0, responseMins: [], slaOk: 0, total: 0 };
        bySite[sid].incidents++;
        bySite[sid].total++;
        if (!inc.sla_breached) bySite[sid].slaOk++;
        if (inc.resolved_at) {
          const mins = (new Date(inc.resolved_at).getTime() - new Date(inc.occurred_at).getTime()) / 60000;
          if (mins > 0 && mins < 1440) bySite[sid].responseMins.push(mins);
        }
      });
      const siteMap = Object.fromEntries(sites.map((s) => [s.id, s.site_name]));
      const sitePerformance = Object.entries(bySite)
        .sort(([, a], [, b]) => b.incidents - a.incidents)
        .slice(0, 10)
        .map(([siteId, s]) => {
          const avgRes = s.responseMins.length
            ? (s.responseMins.reduce((a, b) => a + b, 0) / s.responseMins.length).toFixed(1)
            : "N/A";
          const slaRate = s.total > 0 ? ((s.slaOk / s.total) * 100).toFixed(1) : "N/A";
          const rating = s.total > 0 && s.slaOk / s.total >= 0.97 ? "excellent"
            : s.total > 0 && s.slaOk / s.total >= 0.90 ? "good" : "needs attention";
          return { site: siteMap[siteId] ?? siteId, incidents: s.incidents, response: avgRes === "N/A" ? "N/A" : `${avgRes} min`, sla: slaRate === "N/A" ? "N/A" : `${slaRate}%`, rating };
        });

      setData({ monthlyData, incidentTypeData, kpis, responseByType, resolutionRate, totalIncidents, escalatedCount, sitePerformance });
    } catch (err) {
      console.error("[Analytics] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(days); }, [days, fetchAnalytics]);

  const handleExport = () => {
    exportToCSV(data.monthlyData, "analytics_report");
    toast({ title: "Export Complete", description: "Analytics data has been exported to CSV." });
  };

  if (loading) return <LoadingPulse />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Analytics & Reporting"
          description="KPI dashboards for incident rates, response times, and SLA performance"
          icon={BarChart3}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Key Performance Indicators (KPIs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.kpis.map((kpi, idx) => (
            <Card key={idx} className="p-4 border-border">
              <p className="text-sm font-semibold text-primary mb-2">{kpi.label}</p>
              <p className="text-3xl font-bold text-foreground mb-1">{kpi.value}</p>
              {kpi.trend && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-alert-normal" />
                  <span className="text-sm text-alert-normal">{kpi.trend} vs last month</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Monthly Incident Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4">Incident Volume & Resolution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="incidents" fill="hsl(210 100% 55%)" name="Total Incidents" />
              <Bar dataKey="resolved" fill="hsl(142 76% 45%)" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4">Response Time Trend (min to resolve)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Line type="monotone" dataKey="responseTime" stroke="hsl(190 95% 45%)" strokeWidth={3} name="Avg Resolution Time (min)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Incident Types Distribution */}
      {data.incidentTypeData.length > 0 && (
        <Card className="p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4">Incident Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.incidentTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {data.incidentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Response Time Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Average Resolution Times by Incident Type
          </h3>
          {data.responseByType.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No resolved incidents in the selected period.</p>
          ) : (
            <div className="space-y-3">
              {data.responseByType.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{item.type}</span>
                    <span className="text-sm font-bold text-foreground">{item.time}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-command" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Incident Resolution Rates
          </h3>
          <div className="space-y-4">
            <div className="text-center p-6">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
                  <circle cx="64" cy="64" r="56" stroke="hsl(var(--primary))" strokeWidth="12" fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.resolutionRate / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute">
                  <p className="text-3xl font-bold text-foreground">{data.resolutionRate}%</p>
                  <p className="text-xs font-medium text-foreground/80">Resolved</p>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground/80 mt-4">Resolution Rate</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{data.totalIncidents.toLocaleString()}</p>
                <p className="text-xs font-medium text-foreground/80">Total Incidents</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{data.escalatedCount.toLocaleString()}</p>
                <p className="text-xs font-medium text-foreground/80">Escalated</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Site Performance Table */}
      {data.sitePerformance.length > 0 && (
        <Card className="p-4 border-border">
          <h3 className="font-semibold text-foreground mb-4">Site-by-Site Performance (This Month)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-semibold text-foreground">Site</th>
                  <th className="text-center p-3 text-sm font-semibold text-foreground">Incidents</th>
                  <th className="text-center p-3 text-sm font-semibold text-foreground">Avg. Resolution</th>
                  <th className="text-center p-3 text-sm font-semibold text-foreground">SLA Compliance</th>
                  <th className="text-center p-3 text-sm font-semibold text-foreground">Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.sitePerformance.map((site, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-secondary/50">
                    <td className="p-3 text-sm text-foreground">{site.site}</td>
                    <td className="p-3 text-sm text-center text-foreground">{site.incidents}</td>
                    <td className="p-3 text-sm text-center text-foreground">{site.response}</td>
                    <td className="p-3 text-sm text-center"><span className="font-bold text-foreground">{site.sla}</span></td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        site.rating === "excellent" ? "bg-green-500/20 text-green-400"
                          : site.rating === "good" ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {site.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
