import { lazy, useState, useEffect, Suspense, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";

// Field App Components
import { FieldAppSidebarNew } from "@/components/field-app/FieldAppSidebarNew";
import { FieldAppHeader } from "@/components/field-app/FieldAppHeader";
import { PortalHeader } from "@/components/shell/PortalHeader";
import { FieldAppDashboard } from "@/components/field-app/FieldAppDashboard";
import { GuardDashboard } from "@/components/field-app/GuardDashboard";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarCollapseToggle } from "@/components/shared/SidebarCollapseToggle";

// Phase 1 unified shell
import RankDashboard from "@/components/field-app/shell/RankDashboard";

import { getRankDisplayName } from "@/config/rankSidebarConfig";

// Map module IDs to components - All rank sidebar modules mapped to functional components
const moduleComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  // Common modules
  clock: lazy(() => import("@/components/patrol/OfficerClockScreen")),
  bodycam: lazy(() => import("@/components/bodycam/OfficerBodyCamApp")),
  incidents: lazy(() => import("@/components/field-app/FieldIncidentReport")),
  hq_connect: lazy(() => import("@/components/field-app/HQConnect")),
  
  // Rank-specific O.B modules
  field_ob: lazy(() => import("@/components/dob/FieldOpsOBPanel")),
  management_ob: lazy(() => import("@/components/dob/OperationsTeamOBPanel")),
  control_ob: lazy(() => import("@/components/dob/OperationsTeamOBPanel")),
  operations_ob: lazy(() => import("@/components/dob/OperationsTeamOBPanel")),
  ob: lazy(() => import("@/components/dob/FieldOpsOBPanel")),
  
  // Supervisor modules
  team: lazy(() => import("@/components/field-app/modules/TeamManagementHub")),
  patrol: lazy(() => import("@/components/patrol/SupervisorPlatform").then((mod) => ({ default: mod.SupervisorPlatform }))),
  fleet_status: lazy(() => import("@/components/field-app/FleetStatusPanel")),
  dispatch: lazy(() => import("@/components/control-room/DispatchFleetControl")),
  tasks: lazy(() => import("@/components/field-app/FieldTasksPanel")),
  
  // Response Officer modules
  mdt: lazy(() => import("@/components/alarms/MobileResponseOfficerPlatform")),
  alarms: lazy(() => import("@/components/alarms/MobileResponseOfficerPlatform")),
  navigation: lazy(() => import("@/components/field-app/FieldNavigationPanel")),
  
  // Technician modules
  workorders: lazy(() => import("@/components/technical/TIMUPlatform").then((mod) => ({ default: mod.TIMUPlatform }))),
  maintenance: lazy(() => import("@/components/technical/TIMUPlatform").then((mod) => ({ default: mod.TIMUPlatform }))),
  equipment: lazy(() => import("@/components/technical/TIMUPlatform").then((mod) => ({ default: mod.TIMUPlatform }))),
  reports: lazy(() => import("@/components/field-app/FieldServiceReports")),
  
  // K9 Handler modules
  k9ops: lazy(() => import("@/components/k9/K9HandlerPlatform").then((mod) => ({ default: mod.K9HandlerPlatform }))),
  health: lazy(() => import("@/components/k9/K9HandlerPlatform").then((mod) => ({ default: mod.K9HandlerPlatform }))),
  
  // Escort Officer modules
  missions: lazy(() => import("@/components/escort/EscortOfficerPlatform").then((mod) => ({ default: mod.EscortOfficerPlatform }))),
  comms: lazy(() => import("@/components/field-app/FieldCommsPanel")),
  
  // Investigator modules
  cases: lazy(() => import("@/components/investigations/InvestigatorPlatform")),
  evidence: lazy(() => import("@/components/investigations/InvestigatorPlatform")),
  interviews: lazy(() => import("@/components/investigations/InvestigatorPlatform")),
  
  // Courier modules
  deliveries: lazy(() => import("@/components/courier/RiderDriverApp").then((mod) => ({ default: mod.RiderDriverApp }))),
  pickup: lazy(() => import("@/components/courier/RiderDriverApp").then((mod) => ({ default: mod.RiderDriverApp }))),
  history: lazy(() => import("@/components/field-app/FieldDeliveryHistory")),
  
  // Event Security modules
  assignment: lazy(() => import("@/components/events/EventSecurityApp")),
  zones: lazy(() => import("@/components/events/EventSecurityApp")),
  
  // Control Room Operator modules
  monitoring: lazy(() => import("@/components/cctv/CCTVOperatorConsole")),
  
  // Operations Officer modules
  resources: lazy(() => import("@/components/patrol/SupervisorPlatform").then((mod) => ({ default: mod.SupervisorPlatform }))),
  
  // Training Officer modules
  sessions: lazy(() => import("@/components/training/TrainingSessionManager")),
  assessments: lazy(() => import("@/components/training/AssessmentEngine")),
  certifications: lazy(() => import("@/components/training/CertificationEngine")),
  trainees: lazy(() => import("@/components/training/CompetencyMatrix")),
  materials: lazy(() => import("@/components/training/ELearningModules")),

  // Phase 2 — Guard
  beat_map: lazy(() => import("@/components/field-app/modules/BeatMap")),
  pre_shift_brief: lazy(() => import("@/components/field-app/modules/PreShiftBriefing")),
  threat_watch: lazy(() => import("@/components/field-app/modules/ThreatWatch")),
  welfare_check: lazy(() => import("@/components/field-app/modules/WelfareCheck")),
  lone_worker: lazy(() => import("@/components/field-app/modules/LoneWorkerTimer")),
  visitor_log: lazy(() => import("@/components/field-app/modules/VisitorLog")),
  vehicle_inspect: lazy(() => import("@/components/field-app/modules/VehicleInspection")),
  key_custody: lazy(() => import("@/components/field-app/modules/KeyAssetCustody")),
  parcel_log: lazy(() => import("@/components/field-app/modules/ParcelDeliveryLog")),
  evidence_vault: lazy(() => import("@/components/field-app/modules/EvidenceVault")),
  my_performance: lazy(() => import("@/components/field-app/modules/MyPerformance")),
  my_schedule: lazy(() => import("@/components/field-app/modules/MySchedule")),
  drills: lazy(() => import("@/components/field-app/modules/DrillsTraining")),

  // Phase 2 — Supervisor
  live_team_map: lazy(() => import("@/components/field-app/modules/LiveTeamMap")),
  attendance_board: lazy(() => import("@/components/field-app/modules/AttendanceBoard")),
  patrol_performance: lazy(() => import("@/components/field-app/modules/PatrolPerformance")),
  welfare_oversight: lazy(() => import("@/components/field-app/modules/WelfareOversight")),
  incident_triage: lazy(() => import("@/components/field-app/modules/IncidentTriage")),
  broadcast_composer: lazy(() => import("@/components/field-app/modules/BroadcastComposer")),
  site_audit: lazy(() => import("@/components/field-app/modules/SiteAuditChecklist")),
};

const FieldApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  
  // Get rank from navigation state or default to 'guard'
  const [selectedRank, setSelectedRank] = useState<string>(
    (location.state as any)?.rank || sessionStorage.getItem("selected_rank") || "guard"
  );

  const { 
    staffRecord, 
    role, 
    assignedSites, 
    assignedPatrols,
    isLoading: assignmentsLoading 
  } = useOfficerAssignments();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        navigate("/auth");
        return;
    }

    const nextRank = (location.state as any)?.rank || user.user_metadata?.field_rank || sessionStorage.getItem("selected_rank") || "guard";
    if (nextRank !== selectedRank) {
      setSelectedRank(nextRank);
    }
    sessionStorage.setItem("selected_rank", nextRank);
  }, [authLoading, location.state, navigate, selectedRank, user]);

  // Subscribe to notifications — guarded so a realtime failure can't crash the portal
  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("field-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "dispatch_requests" },
          (payload: any) => {
            try {
              if (payload?.new?.requested_by === user.id) {
                setNotifications((prev) => prev + 1);
                toast.info("New dispatch assignment received");
              }
            } catch (e) {
              console.warn("[FieldApp] notification handler error", e);
            }
          },
        )
        .subscribe();
    } catch (e) {
      console.warn("[FieldApp] notification channel failed to start", e);
    }
    return () => {
      try { if (channel) supabase.removeChannel(channel); } catch { /* noop */ }
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  const userName = staffRecord?.full_name || user?.email || "Field Officer";
  const rankDisplayName = getRankDisplayName(selectedRank);
  const ActiveComponent = activeModule ? moduleComponents[activeModule] : null;
  const loadingState = authLoading || assignmentsLoading;

  const dashboardProps = useMemo(() => ({
    rank: selectedRank,
    rankDisplayName,
    userName,
    staffId: staffRecord?.id,
    assignedSites: assignedSites || [],
    onModuleSelect: setActiveModule,
  }), [assignedSites, rankDisplayName, selectedRank, staffRecord?.id, userName]);

  const activeModuleName = activeModule || "Dashboard";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden">
        <FieldAppSidebarNew
          rank={selectedRank}
          activeModule={activeModule}
          onModuleSelect={setActiveModule}
          onLogout={handleLogout}
          userName={userName}
          notifications={notifications}
        />

        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <PortalHeader
            portalLabel={`Field Portal · ${rankDisplayName}`}
            pageTitle={activeModuleName === "Dashboard" ? `${rankDisplayName} Dashboard` : activeModuleName}
          />

          <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full min-w-0 max-w-[1440px]">
              <ErrorBoundary key={activeModule ?? "__dashboard__"}>
                <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>}>
                  {loadingState ? (
                    <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
                  ) : activeModule && ActiveComponent ? (
                    <ActiveComponent />
                  ) : (
                    <RankDashboard {...dashboardProps} />
                  )}
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default FieldApp;
