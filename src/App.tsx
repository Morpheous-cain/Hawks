import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { safeLazy } from "./utils/safeLazy";
import { RequireRole } from "./components/auth/RequireRole";

// Lazy load all pages to prevent build failures from blocking the entire app
const Index = safeLazy("Index", () => import("./pages/Index"));
const CCTV = safeLazy("CCTV", () => import("./pages/CCTV"));
const BodyCam = safeLazy("BodyCam", () => import("./pages/BodyCam"));
const TechnicalSecurity = safeLazy("TechnicalSecurity", () => import("./pages/TechnicalSecurity"));
const DOB = safeLazy("DOB", () => import("./pages/DOB"));
const Alarms = safeLazy("Alarms", () => import("./pages/Alarms"));
const AccessControl = safeLazy("AccessControl", () => import("./pages/AccessControl"));
const PatrolSuite = safeLazy("PatrolSuite", () => import("./pages/PatrolSuite"));
const HRSuite = safeLazy("HRSuite", () => import("./pages/HRSuite"));
const K9 = safeLazy("K9", () => import("./pages/K9"));
const Escort = safeLazy("Escort", () => import("./pages/Escort"));
const Investigations = safeLazy("Investigations", () => import("./pages/Investigations"));
const Communications = safeLazy("Communications", () => import("./pages/Communications"));
const PatrolCheckpoints = safeLazy("PatrolCheckpoints", () => import("./pages/PatrolCheckpoints"));
const Analytics = safeLazy("Analytics", () => import("./pages/Analytics"));
const StaffManagement = safeLazy("StaffManagement", () => import("./pages/StaffManagement"));
const ClientManagement = safeLazy("ClientManagement", () => import("./pages/ClientManagement"));
const ClientDetail = safeLazy("ClientDetail", () => import("./pages/ClientDetail"));
const IncidentManagement = safeLazy("IncidentManagement", () => import("./pages/IncidentManagement"));
const AnalyticsDashboard = safeLazy("AnalyticsDashboard", () => import("./pages/AnalyticsDashboard"));
const StaffScheduling = safeLazy("StaffScheduling", () => import("./pages/StaffScheduling"));
const Settings = safeLazy("Settings", () => import("./pages/Settings"));
const MapPage = safeLazy("Map", () => import("./pages/Map"));
const Auth = safeLazy("Auth", () => import("./pages/Auth"));
const ResetPassword = safeLazy("ResetPassword", () => import("./pages/ResetPassword"));
const Landing = safeLazy("Landing", () => import("./pages/Landing"));
const PWAInstall = safeLazy("PWAInstall", () => import("./pages/PWAInstall"));
const NotFound = safeLazy("NotFound", () => import("./pages/NotFound"));
const MDT = safeLazy("MDT", () => import("./pages/MDT"));
const MDTManagement = safeLazy("MDTManagement", () => import("./pages/MDTManagement"));
const ExecutiveDashboard = safeLazy("ExecutiveDashboard", () => import("./pages/ExecutiveDashboard"));
// const ControlRoomDashboard = safeLazy("ControlRoomDashboard", () => import("./pages/ControlRoomDashboard"));
const ControlRoom = safeLazy("ControlRoom", () => import("./pages/ControlRoom"));
const CourierOperations = safeLazy("CourierOperations", () => import("./pages/CourierOperations"));
const Documents = safeLazy("Documents", () => import("./pages/Documents"));
const LossControl = safeLazy("LossControl", () => import("./pages/LossControl"));
const StrategicAdvisory = safeLazy("StrategicAdvisory", () => import("./pages/StrategicAdvisory"));
const TrainingManagement = safeLazy("TrainingManagement", () => import("./pages/TrainingManagement"));
const EventSecurity = safeLazy("EventSecurity", () => import("./pages/EventSecurity"));
const FieldApp = safeLazy("FieldApp", () => import("./pages/FieldApp"));
const FieldOfficersManagement = safeLazy("FieldOfficersManagement", () => import("./pages/FieldOfficersManagement"));
const ClientPortal = safeLazy("ClientPortal", () => import("./pages/ClientPortal"));
const FleetManagement = safeLazy("FleetManagement", () => import("./pages/FleetManagement"));
const BillingInvoicing = safeLazy("BillingInvoicing", () => import("./pages/BillingInvoicing"));
const LeaveManagement = safeLazy("LeaveManagement", () => import("./pages/LeaveManagement"));
const SOPLibrary = safeLazy("SOPLibrary", () => import("./pages/SOPLibrary"));
const EmergencyPlans = safeLazy("EmergencyPlans", () => import("./pages/EmergencyPlans"));
const EquipmentIssuance = safeLazy("EquipmentIssuance", () => import("./pages/EquipmentIssuance"));
const GuardMonitoringSystem = safeLazy("GuardMonitoringSystem", () => import("./pages/GuardTourReports"));
const Compliance = safeLazy("Compliance", () => import("./pages/Compliance"));
const TrainingDrills = safeLazy("TrainingDrills", () => import("./pages/TrainingDrills"));
const WarRoom = safeLazy("WarRoom", () => import("./pages/WarRoom"));
const ShiftHandover = safeLazy("ShiftHandover", () => import("./pages/ShiftHandover"));
const TenantAdmin = safeLazy("TenantAdmin", () => import("./pages/TenantAdmin"));
const AuditLog = safeLazy("AuditLog", () => import("./pages/AuditLog"));
const DirectiveLog = safeLazy("DirectiveLog", () => import("./pages/DirectiveLog"));
const AutoDispatchRules = safeLazy("AutoDispatchRules", () => import("./pages/AutoDispatchRules"));
const CEOPlatform = safeLazy("CEOPlatform", () => import("./pages/CEOPlatform"));
const COOPlatform = safeLazy("COOPlatform", () => import("./pages/COOPlatform"));
const ControlRoomPortal = safeLazy("ControlRoomPortal", () => import("./pages/ControlRoomPortal"));
const GMPlatform = safeLazy("GMPlatform", () => import("./pages/GMPlatform"));
const ManagementPortalHome = safeLazy("ManagementPortalHome", () => import("./pages/ManagementPortalHome"));
const PlatformPage = safeLazy("PlatformPage", () => import("./pages/PlatformPage"));
const CashInTransit = safeLazy("CashInTransit", () => import("./pages/CashInTransit"));
const VisitorAccess = safeLazy("VisitorAccess", () => import("./pages/VisitorAccess"));
const ArmouryCustody = safeLazy("ArmouryCustody", () => import("./pages/ArmouryCustody"));
const GuardTourReports = safeLazy("GuardTourReports", () => import("./pages/GuardTourReports"));
const DutyRosterBoard = safeLazy("DutyRosterBoard", () => import("./pages/DutyRosterBoard"));
const PayrollRuns = safeLazy("PayrollRuns", () => import("./pages/modules/PayrollRuns"));
const Payslips = safeLazy("Payslips", () => import("./pages/modules/Payslips"));
const Expenses = safeLazy("Expenses", () => import("./pages/modules/Expenses"));
const StatutoryReturns = safeLazy("StatutoryReturns", () => import("./pages/modules/StatutoryReturns"));
const PolicyLibrary = safeLazy("PolicyLibrary", () => import("./pages/modules/PolicyLibrary"));
const ApprovalsInbox = safeLazy("ApprovalsInbox", () => import("./pages/modules/ApprovalsInbox"));
const PatrolIntelligence = safeLazy("PatrolIntelligence", () => import("./pages/modules/PatrolIntelligence"));
const DeploymentBoard = safeLazy("DeploymentBoard", () => import("./pages/modules/DeploymentBoard"));
const ComplianceRegister = safeLazy("ComplianceRegister", () => import("./pages/modules/ComplianceRegister"));
const HRRecruitment = safeLazy("HRRecruitment", () => import("./pages/hr/HRRecruitment"));
const HROnboarding = safeLazy("HROnboarding", () => import("./pages/hr/HROnboarding"));
const HRAttendance = safeLazy("HRAttendance", () => import("./pages/hr/HRAttendance"));
const HRPerformance = safeLazy("HRPerformance", () => import("./pages/hr/HRPerformance"));
const HRDisciplinary = safeLazy("HRDisciplinary", () => import("./pages/hr/HRDisciplinary"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const WorkspaceShell = safeLazy("WorkspaceShell", () => import("./components/shell/WorkspaceShell"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  // loading stays true until BOTH auth + role are resolved (see useAuth.ts).
  // RequireRole also gates on loading, so a spinner here avoids a flash of
  // the wrong screen before the role is known.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const CopilotDrawer = safeLazy("CopilotDrawer", () => import("./components/copilot/CopilotDrawer"));

const ConsoleLayout = () => {
  return (
    <WorkspaceShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/management" element={<ManagementPortalHome />} />
          <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
          <Route path="/control-room" element={<ControlRoom />} />
          <Route path="/strategic-advisory" element={<StrategicAdvisory />} />
          <Route path="/dashboard" element={<Navigate to="/management" replace />} />
          <Route path="/cctv" element={<CCTV />} />
          <Route path="/bodycam" element={<BodyCam />} />
          <Route path="/loss-control" element={<LossControl />} />
          <Route path="/technical-security" element={<TechnicalSecurity />} />
          <Route path="/dob" element={<DOB />} />
          <Route path="/alarms" element={<Alarms />} />
          <Route path="/access" element={<AccessControl />} />
          {/* Patrol Suite (unified) */}
          <Route path="/supervision-patrol" element={<PatrolSuite />} />
          <Route path="/gps-patrol" element={<Navigate to="/supervision-patrol?tab=gps" replace />} />
          <Route path="/patrol-checkpoints" element={<Navigate to="/supervision-patrol?tab=checkpoints" replace />} />
          <Route path="/guard-monitoring" element={<Navigate to="/supervision-patrol?tab=monitoring" replace />} />
          <Route path="/guard-tour-reports" element={<Navigate to="/supervision-patrol?tab=tour-reports" replace />} />
          <Route path="/patrol-intelligence" element={<Navigate to="/supervision-patrol?tab=intelligence" replace />} />
          {/* HR Suite (unified) */}
          <Route path="/hr" element={<HRSuite />} />
          <Route path="/staff" element={<Navigate to="/hr?tab=staff" replace />} />
          <Route path="/staff/scheduling" element={<Navigate to="/hr?tab=scheduling" replace />} />
          <Route path="/field-officers" element={<Navigate to="/hr?tab=officers" replace />} />
          <Route path="/leave" element={<Navigate to="/hr?tab=leave" replace />} />
          <Route path="/hr/recruitment" element={<Navigate to="/hr?tab=recruitment" replace />} />
          <Route path="/hr/onboarding" element={<Navigate to="/hr?tab=onboarding" replace />} />
          <Route path="/hr/attendance" element={<Navigate to="/hr?tab=attendance" replace />} />
          <Route path="/hr/performance" element={<Navigate to="/hr?tab=performance" replace />} />
          <Route path="/hr/disciplinary" element={<Navigate to="/hr?tab=disciplinary" replace />} />
          <Route path="/k9" element={<K9 />} />
          <Route path="/escort" element={<Escort />} />
          <Route path="/investigations" element={<Investigations />} />
          {/* /staff and /staff/scheduling moved to HR Suite */}
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/incidents" element={<IncidentManagement />} />
          <Route path="/comms" element={<Communications />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/mdt" element={<MDT />} />
          <Route path="/mdt-management" element={<MDTManagement />} />
          <Route path="/courier" element={<CourierOperations />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/training" element={<TrainingManagement />} />
          <Route path="/event-security" element={<EventSecurity />} />
          <Route path="/settings" element={<Settings />} />
          {/* /field-officers moved to HR Suite */}
          <Route path="/fleet" element={<FleetManagement />} />
          <Route path="/billing" element={<BillingInvoicing />} />
          {/* /leave moved to HR Suite */}
          <Route path="/sop-library" element={<SOPLibrary />} />
          <Route path="/emergency-plans" element={<EmergencyPlans />} />
          <Route path="/equipment" element={<EquipmentIssuance />} />
          {/* /guard-monitoring moved to Patrol Suite */}
          <Route path="/install" element={<PWAInstall />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/training-drills" element={<TrainingDrills />} />
          {/* /patrol-checkpoints moved to Patrol Suite */}
          <Route path="/war-room" element={<WarRoom />} />
          <Route path="/shift-handover" element={<ShiftHandover />} />
          <Route path="/tenants" element={<TenantAdmin />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/directive-log" element={<DirectiveLog />} />
          <Route path="/auto-dispatch" element={<AutoDispatchRules />} />
          <Route path="/visitor-access" element={<VisitorAccess />} />
          <Route path="/armoury" element={<ArmouryCustody />} />
          {/* Cash & In-Transit (CIT) Department */}
          <Route path="/cit" element={<CashInTransit />} />
          <Route path="/cit/runs" element={<CashInTransit />} />
          <Route path="/cit/manifests" element={<CashInTransit />} />
          <Route path="/cit/vault" element={<CashInTransit />} />
          <Route path="/cit/routes" element={<CashInTransit />} />
          <Route path="/cit/crews" element={<CashInTransit />} />
          <Route path="/cit/incidents" element={<CashInTransit />} />

          {/* Orphan modules wired into Management */}
          {/* /guard-tour-reports moved to Patrol Suite */}
          <Route path="/payroll-runs" element={<PayrollRuns />} />
          <Route path="/payslips" element={<Payslips />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/statutory-returns" element={<StatutoryReturns />} />
          <Route path="/policy-library" element={<PolicyLibrary />} />
          <Route path="/approvals-inbox" element={<ApprovalsInbox />} />
          {/* /patrol-intelligence moved to Patrol Suite */}
          <Route path="/duty-roster" element={<DutyRosterBoard />} />
          <Route path="/duty-roster-board" element={<DutyRosterBoard />} />
          <Route path="/deployment-board" element={<DeploymentBoard />} />
          <Route path="/compliance-register" element={<ComplianceRegister />} />
          {/* /hr/* moved to HR Suite */}

          {/* legacy /platform/* routes are now handled by the isolated PlatformPage outside ConsoleLayout */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Suspense fallback={null}><CopilotDrawer /></Suspense>
    </WorkspaceShell>
  );
};

// Root entry: ALWAYS show the Landing page first regardless of auth state.
// Authenticated users can navigate into their portal from the landing page.
const RootGate = () => <Landing />;

const AppInner = () => {
  useVersionCheck();
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AnimatedBackground />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<RootGate />} />
                <Route path="/index" element={<Navigate to="/" replace />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/management" replace />
                    </ProtectedRoute>
                  }
                />
                <Route path="/field-app" element={<ProtectedRoute><FieldApp /></ProtectedRoute>} />
                <Route path="/client-portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
                <Route
                  path="/platform/:platformId/*"
                  element={
                    <ProtectedRoute>
                      <RequireRole>
                        <PlatformPage />
                      </RequireRole>
                    </ProtectedRoute>
                  }
                />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <RequireRole>
                      <ConsoleLayout />
                    </RequireRole>
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppInner />
  </QueryClientProvider>
);

export default App;
