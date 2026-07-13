import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Radio, Shield, Bell, TrendingUp, Phone, Activity, 
  BookOpen, Settings, Laptop, MapPin, LayoutDashboard
} from "lucide-react";
import ControlRoomDashboardV2 from "@/pages/dashboards/ControlRoomDashboardV2";
import PageHeader from "@/components/PageHeader";
import LiveOperationsWall from "@/components/control-room/LiveOperationsWall";
import AssignmentCommandHub from "@/components/control-room/AssignmentCommandHub";
import IncidentCommandCentre from "@/components/control-room/IncidentCommandCentre";
import AlarmSOSDesk from "@/components/control-room/AlarmSOSDesk";
import DispatchFleetControl from "@/components/control-room/DispatchFleetControl";
import CommunicationsHub from "@/components/control-room/CommunicationsHub";
import WelfareHSEMonitor from "@/components/control-room/WelfareHSEMonitor";
import CCTVVideoWallIntegration from "@/components/control-room/CCTVVideoWallIntegration";

import ShiftLogbookHandover from "@/components/control-room/ShiftLogbookHandover";
import AnalyticsPerformance from "@/components/control-room/AnalyticsPerformance";
import SettingsSOPControls from "@/components/control-room/SettingsSOPControls";
import LiveStatusMonitor from "@/components/control-room/LiveStatusMonitor";
import QuickActionPanel from "@/components/control-room/QuickActionPanel";
import MultiSiteStatusPanel from "@/components/control-room/MultiSiteStatusPanel";
import CommandHistoryTimeline from "@/components/control-room/CommandHistoryTimeline";
import ClientNotificationQueue from "@/components/control-room/ClientNotificationQueue";
import LiveWeatherTrafficPanel from "@/components/control-room/LiveWeatherTrafficPanel";
import UnifiedModuleActivityFeed from "@/components/control-room/UnifiedModuleActivityFeed";
import CrossModuleQuickActions from "@/components/control-room/CrossModuleQuickActions";
import IntegratedResourceDashboard from "@/components/control-room/IntegratedResourceDashboard";
import ModuleHealthMonitor from "@/components/control-room/ModuleHealthMonitor";
import UnifiedSearch from "@/components/control-room/UnifiedSearch";
import SmartAlertAggregation from "@/components/control-room/SmartAlertAggregation";
import IntegrationStatusDashboard from "@/components/control-room/IntegrationStatusDashboard";
import CommandBarActions from "@/components/control-room/CommandBarActions";
import { supabase } from "@/integrations/supabase/client";
import { useAudioAlerts } from "@/hooks/useAudioAlerts";

const ControlRoom = () => {
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [operatorInfo, setOperatorInfo] = useState<any>(null);
  const { playAlert } = useAudioAlerts();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "hub");
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== activeTab) setActiveTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    fetchOperatorInfo();
    initializeShift();
    return subscribeToAlerts();
  }, []);

  const subscribeToAlerts = () => {
    // Subscribe to critical alarms
    const alarmChannel = supabase
      .channel('control-room-alarms')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alarm_activations' },
        (payload) => {
          if (payload.new.priority === 'high') {
            playAlert('critical');
          }
        }
      )
      .subscribe();

    // Subscribe to SOS alerts
    const sosChannel = supabase
      .channel('control-room-sos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_alerts' },
        () => {
          playAlert('sos');
        }
      )
      .subscribe();

    // Subscribe to critical incidents
    const incidentChannel = supabase
      .channel('control-room-incidents')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          if (payload.new.severity === 'critical') {
            playAlert('critical');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alarmChannel);
      supabase.removeChannel(sosChannel);
      supabase.removeChannel(incidentChannel);
    };
  };

  const fetchOperatorInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setOperatorInfo(profile);
    }
  };

  const initializeShift = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check for active shift for current operator
    const { data: activeShift } = await supabase
      .from('shift_logs')
      .select('*')
      .eq('operator_id', user.id)
      .is('shift_end', null)
      .order('shift_start', { ascending: false })
      .limit(1)
      .single();

    if (activeShift) {
      setCurrentShift(activeShift);
    } else {
      // Create new shift
      const now = new Date();
      const shiftId = `SHIFT-${now.toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { data: newShift } = await supabase
        .from('shift_logs')
        .insert({
          shift_id: shiftId,
          shift_start: now.toISOString(),
          operator_id: user.id
        })
        .select()
        .single();

      if (newShift) {
        setCurrentShift(newShift);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Control Room Command Centre"
        description="24/7 Real-Time Operations Hub - Central Command & Coordination"
        icon={Radio}
      />

      {/* Operator Status Bar */}
      <div className="bg-card border-b-2 border-primary/30 p-3">
        <div className="container mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Operator:</span>
              <span className="ml-2 font-semibold text-foreground">
                {operatorInfo?.full_name || 'Loading...'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Shift:</span>
              <span className="ml-2 font-semibold text-foreground">
                {currentShift ? currentShift.shift_id : 'Initializing...'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 font-semibold text-alert-normal">● Active</span>
            </div>
            <div>
              <span className="text-muted-foreground">System:</span>
              <span className="ml-2 text-xs font-semibold text-alert-normal">Online</span>
            </div>
          </div>
          <CommandBarActions
            shift={currentShift}
            onRefresh={() => { /* live data is realtime; explicit refresh trigger for child panels */ }}
            onShiftClosed={() => { setCurrentShift(null); initializeShift(); }}
          />
        </div>
      </div>

      {/* Module Health & Integration Status */}
      <div className="container mx-auto px-4 py-4 space-y-4">
        <ModuleHealthMonitor />
        <IntegrationStatusDashboard />
        <IntegratedResourceDashboard />
        <LiveStatusMonitor />
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-11 gap-2 h-auto bg-card p-2">
                <TabsTrigger value="hub" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Radio className="w-4 h-4 mb-1" />
                  <span className="text-xs">Assignment Hub</span>
                </TabsTrigger>
                <TabsTrigger value="operations" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Laptop className="w-4 h-4 mb-1" />
                  <span className="text-xs">Operations</span>
                </TabsTrigger>
                <TabsTrigger value="incidents" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Shield className="w-4 h-4 mb-1" />
                  <span className="text-xs">Incidents</span>
                </TabsTrigger>
                <TabsTrigger value="alarms" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Bell className="w-4 h-4 mb-1" />
                  <span className="text-xs">Alarms</span>
                </TabsTrigger>
                <TabsTrigger value="dispatch" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Radio className="w-4 h-4 mb-1" />
                  <span className="text-xs">Dispatch</span>
                </TabsTrigger>
                <TabsTrigger value="comms" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Phone className="w-4 h-4 mb-1" />
                  <span className="text-xs">Comms</span>
                </TabsTrigger>
                <TabsTrigger value="welfare" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Activity className="w-4 h-4 mb-1" />
                  <span className="text-xs">Welfare</span>
                </TabsTrigger>
                <TabsTrigger value="cctv" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Laptop className="w-4 h-4 mb-1" />
                  <span className="text-xs">CCTV</span>
                </TabsTrigger>
                <TabsTrigger value="shift" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <BookOpen className="w-4 h-4 mb-1" />
                  <span className="text-xs">Shift Log</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <TrendingUp className="w-4 h-4 mb-1" />
                  <span className="text-xs">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-col py-2 data-[state=active]:bg-gradient-command">
                  <Settings className="w-4 h-4 mb-1" />
                  <span className="text-xs">Settings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hub">
                <AssignmentCommandHub />
              </TabsContent>

              <TabsContent value="operations" className="space-y-6">
                <LiveOperationsWall />
                <LiveWeatherTrafficPanel />
                <ClientNotificationQueue />
              </TabsContent>

              <TabsContent value="incidents">
                <IncidentCommandCentre />
              </TabsContent>

              <TabsContent value="alarms">
                <AlarmSOSDesk />
              </TabsContent>

              <TabsContent value="dispatch">
                <DispatchFleetControl />
              </TabsContent>

              <TabsContent value="comms">
                <CommunicationsHub />
              </TabsContent>

              <TabsContent value="welfare">
                <WelfareHSEMonitor />
              </TabsContent>

              <TabsContent value="cctv">
                <CCTVVideoWallIntegration />
              </TabsContent>

              <TabsContent value="shift">
                <ShiftLogbookHandover shiftData={currentShift} />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsPerformance />
              </TabsContent>

              <TabsContent value="settings">
                <SettingsSOPControls />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar (1 column) */}
          <div className="space-y-6">
            <UnifiedSearch />
            <CrossModuleQuickActions />
            <SmartAlertAggregation />
            <UnifiedModuleActivityFeed />
            <MultiSiteStatusPanel />
            <CommandHistoryTimeline />
          </div>
        </div>
      </main>

      {/* Quick Action Floating Panel */}
      <QuickActionPanel onRefresh={() => {
        queryClient.invalidateQueries();
        fetchOperatorInfo();
        initializeShift();
      }} />
    </div>
  );
};

export default ControlRoom;