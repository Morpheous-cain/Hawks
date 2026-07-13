/**
 * Executive Cockpit (formerly Executive Dashboard + CEO Dashboard).
 *
 * Unified strategic command surface for CEO, COO and Directors.
 * Combines:
 *   • Group-wide KPI cockpit (from the previous CEO Dashboard)
 *   • Live operational pulse, financials, courier ops, advisories,
 *     incident feed and technical security tabs (from the previous
 *     Executive Dashboard).
 *
 * All header buttons are functional: refresh, export CSV, print,
 * generate AI briefing, deep-link into Strategic Advisory, Control
 * Room and Audit Trail.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown, TrendingUp, Shield, Users, AlertTriangle, DollarSign, Building2,
  Activity, Clock, CheckCircle2, Car, Cloud, Truck, Package, RefreshCw,
  Download, Printer, Sparkles, Globe, Monitor, FileText, Wallet,
  ShieldCheck, BarChart3, ClipboardList,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import AdvisoryCard from "@/components/AdvisoryCard";
import IncidentFeed from "@/components/IncidentFeed";
import { useRealtimeSimulation } from "@/hooks/useRealtimeSimulation";
import { useAdvisoryUpdates } from "@/hooks/useAdvisoryUpdates";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink } from "@/components/dashboards/DashboardKit";
import TechnicalDashboard from "@/components/technical/TechnicalDashboard";
import PredictiveMaintenanceEngine from "@/components/technical/PredictiveMaintenanceEngine";
import PerformanceAnalytics from "@/components/technical/PerformanceAnalytics";
import QualityInspections from "@/components/technical/QualityInspections";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Severity → semantic badge background class. */
const severityClass = (severity: string | null | undefined): string => {
  switch (severity) {
    case "critical": return "bg-alert-critical";
    case "high":     return "bg-alert-caution";
    case "medium":   return "bg-primary";
    case "low":      return "bg-muted";
    default:         return "bg-muted";
  }
};

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [briefingLoading, setBriefingLoading] = useState(false);

  // Live simulated ops + advisory streams
  const { stats } = useRealtimeSimulation(5000);
  const { advisoryData } = useAdvisoryUpdates(90000);

  // DB-backed snapshot (incidents, top clients, financials)
  const { data, loading, actions } = useExecutiveDashboard();
  const { recentEvents, topClients, financials } = data;

  // Group-wide KPI cockpit (from CEO Dashboard)
  const { metrics, loading: kpiLoading } = useDashboardMetrics([
    { key: "clients", table: "clients" },
    { key: "active_contracts", table: "contracts", filter: (q) => q.eq("status", "active") },
    { key: "headcount", table: "staff", filter: (q) => q.eq("status", "active") },
    { key: "open_incidents", table: "incidents", filter: (q) => q.in("status", ["open", "in_progress", "active"]) },
    { key: "sev1_incidents", table: "incidents", filter: (q) => q.eq("severity", "critical").in("status", ["open", "in_progress"]) },
    { key: "open_advisories", table: "strategic_advisories", filter: (q) => q.eq("status", "Active") },
    { key: "sla_breached", table: "strategic_advisories", filter: (q) => q.eq("sla_breached", true) },
    { key: "open_invoices", table: "recurring_invoices" },
    { key: "compliance_open", table: "loss_control_records", filter: (q) => q.in("status", ["open", "investigating"]) },
    { key: "training_due", table: "staff_certifications", filter: (q) => q.lte("expiry_date", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) },
    { key: "sites", table: "sites" },
    { key: "active_patrols", table: "patrols", filter: (q) => q.eq("status", "in_progress") },
  ]);

  /** AI executive briefing — calls the generate-briefing edge function. */
  const generateBriefing = async () => {
    try {
      setBriefingLoading(true);
      const { data: briefing, error } = await supabase.functions.invoke("generate-briefing", {
        body: { scope: "executive", role: "ceo" },
      });
      if (error) throw error;
      toast.success("Briefing ready — opening shift briefing");
      // Stash briefing for any briefing viewer that reads from sessionStorage
      try { sessionStorage.setItem("exec_briefing_latest", JSON.stringify(briefing)); } catch { /* noop */ }
      navigate("/shift-handover");
    } catch (e: any) {
      toast.error(e?.message ?? "Briefing service unavailable");
    } finally {
      setBriefingLoading(false);
    }
  };

  const printReport = () => window.print();

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Executive Command · CEO"
        title="Executive Cockpit"
        description="Group-wide strategic posture: financial health, operations pulse, compliance and live intelligence."
        icon={Crown}
        gradient="from-blue-500 to-indigo-600"
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={actions.refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={actions.exportSnapshot}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={printReport}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button size="sm" onClick={generateBriefing} disabled={briefingLoading}>
            <Sparkles className={`w-4 h-4 mr-2 ${briefingLoading ? "animate-pulse" : ""}`} />
            {briefingLoading ? "Generating…" : "AI Briefing"}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/control-room"><Monitor className="w-4 h-4 mr-2" /> Control Room</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/strategic-advisory"><Globe className="w-4 h-4 mr-2" /> Advisories</Link>
          </Button>
        </div>
      </DashboardHeader>

      {/* ─────────────── Group-wide KPI cockpit ─────────────── */}
      <KpiGrid cols={6}>
        <KpiTile label="Active Clients" value={metrics.clients ?? 0} loading={kpiLoading} icon={Building2} />
        <KpiTile label="Live Contracts" value={metrics.active_contracts ?? 0} loading={kpiLoading} icon={FileText} />
        <KpiTile label="Group Headcount" value={metrics.headcount ?? 0} loading={kpiLoading} icon={Users} />
        <KpiTile label="Active Sites" value={metrics.sites ?? 0} loading={kpiLoading} icon={Globe} />
        <KpiTile label="Open Incidents" value={metrics.open_incidents ?? 0} loading={kpiLoading} tone={metrics.open_incidents ? "warn" : "good"} icon={AlertTriangle} />
        <KpiTile label="Sev-1 Live" value={metrics.sev1_incidents ?? 0} loading={kpiLoading} tone={metrics.sev1_incidents ? "bad" : "good"} icon={AlertTriangle} />
      </KpiGrid>

      <KpiGrid cols={6}>
        <KpiTile label="Active Advisories" value={metrics.open_advisories ?? 0} loading={kpiLoading} icon={Globe} />
        <KpiTile label="SLA Breaches" value={metrics.sla_breached ?? 0} loading={kpiLoading} tone={metrics.sla_breached ? "bad" : "good"} />
        <KpiTile label="Active Patrols" value={metrics.active_patrols ?? 0} loading={kpiLoading} icon={Activity} />
        <KpiTile label="Recurring Invoices" value={metrics.open_invoices ?? 0} loading={kpiLoading} icon={Wallet} />
        <KpiTile label="Loss / Risk Open" value={metrics.compliance_open ?? 0} loading={kpiLoading} tone={metrics.compliance_open ? "warn" : "good"} icon={TrendingUp} />
        <KpiTile label="Cert Expiry < 30d" value={metrics.training_due ?? 0} loading={kpiLoading} tone={metrics.training_due ? "warn" : "good"} icon={ShieldCheck} />
      </KpiGrid>

      {/* ─────────────── Live ops snapshot ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Clients" value={stats.activeClients} icon={Building2} trend="+2 this month" status="normal" />
        <StatsCard title="Active Guards" value={stats.activePersonnel} icon={Users} trend={`On duty across ${stats.deploymentSites} sites`} status="normal" />
        <StatsCard title="Open Incidents" value={stats.openIncidents} icon={AlertTriangle}
          trend={stats.openIncidents > 8 ? "Above average" : "Within normal range"}
          status={stats.openIncidents > 10 ? "critical" : stats.openIncidents > 7 ? "caution" : "normal"}
        />
        <StatsCard title="Monthly Revenue" value={`KES ${(stats.monthlyRevenue / 1000000).toFixed(2)}M`} icon={DollarSign} trend="+12% vs last month" status="normal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Operational Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-alert-normal/10 border border-alert-normal/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-alert-normal" />
                <div>
                  <p className="font-semibold">All Systems Operational</p>
                  <p className="text-xs text-foreground/70 font-medium">Last checked: 2 mins ago</p>
                </div>
              </div>
              <Badge className="bg-alert-normal">Normal</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-primary font-semibold mb-1">Patrol Routes</p>
                <p className="text-2xl font-bold">{stats.activePatrols}</p>
                <p className="text-xs text-foreground/80 font-medium">{stats.checkpointVerification.toFixed(1)}% coverage</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-primary font-semibold mb-1">CCTV Alerts</p>
                <p className="text-2xl font-bold">{stats.cctvAlerts}</p>
                <p className="text-xs text-foreground/80 font-medium">Active alerts</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-primary font-semibold mb-1">Alarm Events</p>
                <p className="text-2xl font-bold">{stats.alarmEvents}</p>
                <p className="text-xs text-foreground/80 font-medium">Total events</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-primary font-semibold mb-1">Deployment Sites</p>
                <p className="text-2xl font-bold">{stats.deploymentSites}</p>
                <p className="text-xs text-foreground/80 font-medium">Active sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Response Time Average</p>
                <Badge className={stats.responseTime <= 10 ? "bg-alert-normal" : "bg-alert-caution"}>
                  {stats.responseTime <= 10 ? "Target Met" : "Above Target"}
                </Badge>
              </div>
              <p className="text-3xl font-bold">{stats.responseTime.toFixed(1)} mins</p>
              <p className="text-xs text-foreground/70 font-medium">Target: &lt; 10 mins</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">SLA Compliance</p>
                <Badge className={stats.slaCompliance >= 95 ? "bg-alert-normal" : "bg-alert-caution"}>
                  {stats.slaCompliance >= 95 ? "Excellent" : "Needs Attention"}
                </Badge>
              </div>
              <p className="text-3xl font-bold">{stats.slaCompliance.toFixed(1)}%</p>
              <p className="text-xs text-foreground/70 font-medium">Target: &gt; 95%</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Checkpoint Verification</p>
                <Badge className={stats.checkpointVerification >= 98 ? "bg-alert-normal" : "bg-alert-caution"}>
                  {stats.checkpointVerification >= 98 ? "On Target" : "Needs Attention"}
                </Badge>
              </div>
              <p className="text-3xl font-bold">{stats.checkpointVerification.toFixed(1)}%</p>
              <p className="text-xs text-foreground/70 font-medium">{stats.missedCheckpoints} missed checkpoints today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────── Recent critical events ─────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Recent Critical Events</CardTitle>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/incidents">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length > 0 ? recentEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate(`/incidents?focus=${event.id}`)}
                className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-primary/20 hover:border-primary/60 hover:bg-muted transition text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-semibold text-sm">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{event.title || event.incident_type}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={severityClass(event.severity)}>{event.severity}</Badge>
                      <Badge variant="outline">{event.status}</Badge>
                    </div>
                  </div>
                </div>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </button>
            )) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No recent events recorded</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─────────────── Courier ops ─────────────── */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6" /> Courier Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Deliveries Today" value={stats.courierDeliveries} icon={Package} trend="+12 from yesterday" status="normal" />
          <StatsCard title="Active Riders" value={stats.courierActiveRiders} icon={Users} trend="2 offline" status="caution" />
          <StatsCard title="Avg Delivery Time" value={`${stats.courierAvgDeliveryTime} min`} icon={Clock} trend="-5 min improvement" status="normal" />
          <StatsCard title="COD Collected" value={`KES ${(stats.courierCODCollected / 1000).toFixed(0)}K`} icon={DollarSign} trend="+18% this week" status="normal" />
        </div>
      </div>

      {/* ─────────────── Clients & financials ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Top Clients by Revenue</CardTitle>
            <Button size="sm" variant="ghost" asChild><Link to="/clients">All clients</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topClients.length > 0 ? topClients.map((client) => (
              <button
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition text-left"
              >
                <div>
                  <p className="font-semibold text-sm">{client.trading_name || client.legal_name}</p>
                  <p className="text-xs text-muted-foreground">{client.active_sites_count || 0} active sites</p>
                </div>
                <p className="text-lg font-bold text-primary">
                  KES {((client.annual_value || 0) / 1000).toFixed(0)}K
                </p>
              </button>
            )) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No client data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Financial Summary</CardTitle>
            <Button size="sm" variant="ghost" asChild><Link to="/billing-invoicing">Billing</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Paid Revenue</p>
              <p className="text-2xl font-bold text-alert-normal">
                KES {financials.revenue > 0 ? (financials.revenue / 1000).toFixed(0) + "K" : "0"}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Outstanding Invoices</p>
              <p className="text-2xl font-bold">
                KES {financials.outstanding > 0 ? (financials.outstanding / 1000).toFixed(0) + "K" : "0"}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Active Staff</p>
              <p className="text-2xl font-bold">{financials.staffCount}</p>
              <p className="text-xs text-muted-foreground">staff members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────── Strategic advisories ─────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Strategic Advisory Dashboard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AdvisoryCard title="Traffic Intelligence" icon={Car} alerts={advisoryData.trafficAlerts} />
          <AdvisoryCard title="Protest Monitor" icon={AlertTriangle} alerts={advisoryData.protestAlerts} />
          <AdvisoryCard title="Terror Intelligence" icon={Shield} alerts={advisoryData.terrorAlerts} />
          <AdvisoryCard title="Weather & Safety" icon={Cloud} alerts={advisoryData.weatherAlerts} />
          <AdvisoryCard title="Crime & Threat Advisory" icon={Shield} alerts={advisoryData.crimeAlerts} />
        </div>
      </div>

      {/* ─────────────── Live incident feed ─────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-alert-critical" /> Live Incident Monitor
        </h2>
        <IncidentFeed />
      </div>

      {/* ─────────────── Executive quick access ─────────────── */}
      <Panel title="Executive Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/duty-roster" label="Duty Roster Board" desc="SOC command-centre duty roster & live posture" icon={ClipboardList} />
          <QuickLink to="/strategic-advisory" label="Strategic Advisory" desc="Geo-political & threat intel" icon={Globe} />
          <QuickLink to="/analytics" label="Executive Analytics" desc="Cross-departmental KPIs" icon={BarChart3} />
          <QuickLink to="/billing-invoicing" label="Billing & Revenue" desc="Revenue, AR, profitability" icon={Wallet} />
          <QuickLink to="/incidents" label="Incident Register" desc="All severity tiers" icon={AlertTriangle} />
          <QuickLink to="/compliance" label="Compliance" desc="Regulatory posture" icon={ShieldCheck} />
          <QuickLink to="/audit-log" label="Audit Trail" desc="System-wide accountability" icon={FileText} />
          <QuickLink to="/clients" label="Client Portfolio" desc="All accounts & contracts" icon={Building2} />
          <QuickLink to="/staff" label="Workforce" desc="Group HR overview" icon={Users} />
          <QuickLink to="/control-room" label="Control Room" desc="Live ops command centre" icon={Monitor} />
        </div>
      </Panel>

      {/* ─────────────── Technical security tabs ─────────────── */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Technical Security Operations
        </h2>
        <ErrorBoundary>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-card">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="predictive">Predictive Maintenance</TabsTrigger>
              <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
              <TabsTrigger value="inspections">Quality Inspections</TabsTrigger>
            </TabsList>
            <TabsContent value="overview"><ErrorBoundary><TechnicalDashboard /></ErrorBoundary></TabsContent>
            <TabsContent value="predictive"><ErrorBoundary><PredictiveMaintenanceEngine /></ErrorBoundary></TabsContent>
            <TabsContent value="performance"><ErrorBoundary><PerformanceAnalytics /></ErrorBoundary></TabsContent>
            <TabsContent value="inspections"><ErrorBoundary><QualityInspections /></ErrorBoundary></TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
