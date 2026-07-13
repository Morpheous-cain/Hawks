import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface ReportStats {
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionHours: number | null;
  escalatedComplaints: number;
  openByPriority: { priority: string; count: number }[];
  byCategory: { category: string; count: number }[];
  resolutionRate: number;
}

const CSReports = () => {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const [stats, setStats] = useState<ReportStats>({
    totalTickets: 0, resolvedTickets: 0, avgResolutionHours: null,
    escalatedComplaints: 0, openByPriority: [], byCategory: [], resolutionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async (days: number) => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [ticketsRes, complaintsRes] = await Promise.all([
      supabase
        .from("support_tickets")
        .select("id, status, priority, category, created_at, resolved_at")
        .gte("created_at", since)
        .is("deleted_at", null),
      supabase
        .from("client_complaints")
        .select("id, escalated")
        .gte("created_at", since)
        .is("deleted_at", null),
    ]);

    const tickets: any[] = ticketsRes.data ?? [];
    const complaints: any[] = complaintsRes.data ?? [];

    const resolved = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed");
    const resolutionHours = resolved
      .filter((t: any) => t.resolved_at)
      .map((t: any) => {
        const ms = new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
        return ms / 3600000;
      })
      .filter((h: number) => h > 0);

    const avgHours = resolutionHours.length > 0
      ? Math.round(resolutionHours.reduce((a: number, b: number) => a + b, 0) / resolutionHours.length * 10) / 10
      : null;

    const priorityCounts: Record<string, number> = {};
    tickets.filter((t: any) => !["resolved","closed"].includes(t.status)).forEach((t: any) => {
      priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1;
    });

    const categoryCounts: Record<string, number> = {};
    tickets.forEach((t: any) => {
      categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
    });

    setStats({
      totalTickets: tickets.length,
      resolvedTickets: resolved.length,
      avgResolutionHours: avgHours,
      escalatedComplaints: complaints.filter((c: any) => c.escalated).length,
      openByPriority: Object.entries(priorityCounts)
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => b.count - a.count),
      byCategory: Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      resolutionRate: tickets.length > 0 ? Math.round((resolved.length / tickets.length) * 100) : 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchReport(Number(period)); }, [fetchReport, period]);

  const kpis = [
    { label: "Total Tickets", value: stats.totalTickets, icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Resolved", value: stats.resolvedTickets, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Resolution Rate", value: `${stats.resolutionRate}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Avg Resolution", value: stats.avgResolutionHours !== null ? `${stats.avgResolutionHours}h` : "—", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Escalated Complaints", value: stats.escalatedComplaints, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Reports & Analytics"
          description="Customer service performance metrics and trends"
          icon={BarChart3}
        />
        <Select value={period} onValueChange={(v) => setPeriod(v as "7" | "30" | "90")}>
          <SelectTrigger className="w-36 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-4 border-border">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Open Tickets by Priority</h3>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : stats.openByPriority.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tickets.</p>
            ) : stats.openByPriority.map((row) => {
              const pct = stats.totalTickets > 0 ? Math.round((row.count / stats.totalTickets) * 100) : 0;
              return (
                <div key={row.priority}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="capitalize">{row.priority}</span>
                    <span>{row.count}</span>
                  </div>
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Tickets by Category</h3>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : stats.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            ) : stats.byCategory.map((row) => {
              const pct = stats.totalTickets > 0 ? Math.round((row.count / stats.totalTickets) * 100) : 0;
              return (
                <div key={row.category}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="capitalize">{row.category}</span>
                    <span>{row.count}</span>
                  </div>
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CSReports;
