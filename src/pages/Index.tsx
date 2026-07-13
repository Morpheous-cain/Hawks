import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import StatsCard from "@/components/StatsCard";
import AdvisoryCard from "@/components/AdvisoryCard";
import IncidentFeed from "@/components/IncidentFeed";
import OperationalMap from "@/components/OperationalMap";
import LoadingPulse from "@/components/LoadingPulse";
import SearchFilter, { FilterState } from "@/components/SearchFilter";
import QuickActionsPanel from "@/components/QuickActionsPanel";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { AudioControlPanel } from "@/components/AudioControlPanel";
import TechnicalDashboard from "@/components/technical/TechnicalDashboard";
import PredictiveMaintenanceEngine from "@/components/technical/PredictiveMaintenanceEngine";
import PerformanceAnalytics from "@/components/technical/PerformanceAnalytics";
import QualityInspections from "@/components/technical/QualityInspections";
import { Shield, Users, MapPin, Radio, AlertTriangle, Car, Cloud, Activity, Plus, FileText, Truck, Package, Clock, Wrench, ClipboardList, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeSimulation } from "@/hooks/useRealtimeSimulation";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdvisoryUpdates } from "@/hooks/useAdvisoryUpdates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/utils/exportData";
import { toast } from "@/hooks/use-toast";
import { IncidentCreateDialog } from "@/components/control-room/IncidentCreateDialog";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { stats, isUpdating } = useRealtimeSimulation(8000);
  const { soundEnabled, setSoundEnabled, addNotification } = useNotifications();
  const { advisoryData, isUpdating: advisoryUpdating } = useAdvisoryUpdates(90000);
  const [searchQuery, setSearchQuery] = useState("");
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    types: [],
  });
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleExport = () => {
    const exportData = [
      { metric: "Active Personnel", value: stats.activePersonnel },
      { metric: "Deployment Sites", value: stats.deploymentSites },
      { metric: "Active Patrols", value: stats.activePatrols },
      { metric: "Open Incidents", value: stats.openIncidents },
    ];
    
    exportToCSV(exportData, "dashboard_metrics");
    
    toast({
      title: "Export Complete",
      description: "Dashboard data has been exported successfully.",
    });
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshing Data",
      description: "Dashboard data is being updated...",
    });
    
    // Simulate notification for demo
    setTimeout(() => {
      addNotification({
        title: "New Critical Incident",
        message: "Unauthorized access detected at JKIA Terminal 3",
        type: "critical",
      });
    }, 2000);
  };

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast({
      title: soundEnabled ? "Sound Disabled" : "Sound Enabled",
      description: `Alert sounds are now ${soundEnabled ? "off" : "on"}.`,
    });
  };

  const handleNewIncident = () => {
    setIncidentDialogOpen(true);
  };

  return (
    <div className="space-y-6">
        {/* Real-time Status Indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-alert-normal/10 border-alert-normal/30 text-alert-normal">
              <div className="w-2 h-2 rounded-full bg-alert-normal animate-pulse mr-2" />
              Live Updates Active
            </Badge>
            {isUpdating && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoadingPulse size="sm" />
                <span>Syncing data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <QuickActionsPanel 
          onExport={handleExport}
          onRefresh={handleRefresh}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />

        {/* New Incident Report Button */}
        <div className="flex items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-critical/10">
              <FileText className="w-5 h-5 text-alert-critical" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Report New Incident</h3>
              <p className="text-sm text-muted-foreground">
                Initiate formal investigation per Black Hawk Investigation Manual
              </p>
            </div>
          </div>
          <Button onClick={handleNewIncident} className="gap-2 bg-gradient-command">
            <Plus className="w-4 h-4" />
            New Incident
          </Button>
        </div>

        {/* Duty Roster Board Quick Entry */}
        <button
          onClick={() => navigate('/duty-roster')}
          className="w-full text-left flex items-center justify-between gap-4 p-4 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-[#05080F] via-[#0B1220] to-[#05080F] hover:border-cyan-400/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Duty Roster Board</h3>
              <p className="text-sm text-slate-400">
                SOC command-centre duty roster, deployment posture & live units
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <IncidentCreateDialog
          open={incidentDialogOpen}
          onOpenChange={setIncidentDialogOpen}
          onSuccess={() => {
            toast({
              title: "Incident Created",
              description: "New incident has been reported and logged.",
            });
            addNotification({
              title: "New Incident Created",
              message: "Incident has been assigned for investigation",
              type: "info",
            });
          }}
        />

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Personnel"
            value={stats.activePersonnel.toString()}
            icon={Users}
            trend="↑ 12% from last week"
            status="normal"
          />
          <StatsCard
            title="Deployment Sites"
            value={stats.deploymentSites.toString()}
            icon={MapPin}
            trend="4 sites on high alert"
            status="caution"
          />
          <StatsCard
            title="Active Patrols"
            value={stats.activePatrols.toString()}
            icon={Radio}
            trend="All routes covered"
            status="normal"
          />
          <StatsCard
            title="Open Incidents"
            value={stats.openIncidents.toString()}
            icon={AlertTriangle}
            trend={`${stats.openIncidents > 7 ? '↑' : '↓'} ${Math.abs(stats.openIncidents - 7)} from baseline`}
            status={stats.openIncidents > 9 ? "critical" : stats.openIncidents > 6 ? "caution" : "normal"}
          />
        </div>

        {/* Operational Map */}
        <OperationalMap />

        {/* Courier Operations Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="w-6 h-6" />
              Courier Operations
            </h2>
            <Button onClick={() => navigate('/courier-operations')}>
              View Details
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Deliveries Today"
              value={stats.courierDeliveries}
              icon={Package}
              trend="+12 from yesterday"
              status="normal"
            />
            <StatsCard
              title="Active Riders"
              value={stats.courierActiveRiders}
              icon={Users}
              trend="2 offline"
              status="caution"
            />
            <StatsCard
              title="Avg Delivery Time"
              value={`${stats.courierAvgDeliveryTime} min`}
              icon={Clock}
              trend="-5 min improvement"
              status="normal"
            />
            <StatsCard
              title="COD Collected"
              value={`KES ${(stats.courierCODCollected / 1000).toFixed(0)}K`}
              icon={Activity}
              trend="+18% this week"
              status="normal"
            />
          </div>
        </div>

        {/* Technical Security Operations Dashboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary" />
              Technical Security Operations Dashboard
            </h2>
            <Button onClick={() => navigate('/technical-security')}>
              View Details
            </Button>
          </div>
          
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-card">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="predictive">Predictive Maintenance</TabsTrigger>
              <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
              <TabsTrigger value="inspections">Quality Inspections</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <TechnicalDashboard />
            </TabsContent>

            <TabsContent value="predictive">
              <PredictiveMaintenanceEngine />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceAnalytics />
            </TabsContent>

            <TabsContent value="inspections">
              <QualityInspections />
            </TabsContent>
          </Tabs>
        </div>

        {/* Strategic Advisory Dashboard */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Strategic Advisory Dashboard</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdvisoryCard
              title="Traffic Advisory"
              icon={Car}
              alerts={advisoryData.trafficAlerts}
            />
            <AdvisoryCard
              title="Protest Monitor"
              icon={AlertTriangle}
              alerts={advisoryData.protestAlerts}
            />
            <AdvisoryCard
              title="Terror Intelligence"
              icon={Shield}
              alerts={advisoryData.terrorAlerts}
            />
            <AdvisoryCard
              title="Weather & Safety"
              icon={Cloud}
              alerts={advisoryData.weatherAlerts}
            />
            <AdvisoryCard
              title="Crime & Threat Advisory"
              icon={Shield}
              alerts={advisoryData.crimeAlerts}
            />
          </div>
        </div>

      {/* Search and Filter */}
      <SearchFilter 
        onSearchChange={setSearchQuery}
        onFilterChange={setFilters}
      />

      {/* Live Incident Feed and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncidentFeed />
        </div>
        <div className="space-y-6">
          <AudioControlPanel />
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="mt-6">
        <LiveActivityFeed />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary-glow));
        }
      `}</style>
    </div>
  );
};

export default Index;
