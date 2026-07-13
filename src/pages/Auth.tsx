import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Lock, Mail, AlertCircle, Monitor, Smartphone, ChevronRight, ArrowLeft,
  Shield, Users, Radio, Wrench, Dog, Search, Truck, Calendar, GraduationCap, Building2,
  Crown, Briefcase, Wallet, UserCog, Activity, MapPin, Globe, ShieldCheck,
  ClipboardList, ShieldHalf, Receipt, Banknote, UsersRound,
  FileText, Coins, Boxes, Eye, EyeOff, MessageSquare, Headphones
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/black-hawk-logo.png";

// Strict input validation for authentication forms.
const emailSchema = z.string().trim().email("Invalid email address").max(255);
const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});
const signupSchema = z.object({
  email: emailSchema,
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a symbol"),
});

type AuthStep = "select-portal" | "select-rank" | "select-management-role" | "login";
type PortalType = "management" | "field" | "client";
type ManagementRole =
  | "ceo"
  | "coo"
  | "gm"
  | "country_director"
  | "risk_director"
  | "finance_director"
  | "finance"
  | "finance_officer"
  | "payroll_officer"
  | "hr"
  | "hr_officer"
  | "ops_manager"
  | "regional_ops_manager"
  | "branch_ops_manager"
  | "assistant_senior_ops_manager"
  | "area_manager"
  | "facilities_ops_manager"
  | "admin_manager"
  | "admin_officer"
  | "branch_manager"
  | "regional_manager"
  | "control"
  | "contract_manager"
  | "guard_force_admin"
  | "cit_manager"
  | "cit_officer"
  | "courier_manager"
  | "courier_dispatcher"
  | "courier_officer"
  | "compliance"
  | "system_admin"
  | "customer_service_manager"
  | "customer_service_officer"
  // Canonical DB app_role enum values (mapped to nearest platform)
  | "administrator"
  | "bdo"
  | "hr_custodian"
  | "operations_supervisor"
  | "control_room_officer"
  // Legacy / DB role strings that may arrive from Supabase user_roles
  | "exec_leadership"
  | "executive_leadership"
  | "exec_director"
  | "executive_director"
  | "managing_director"
  | "director"
  | "operations_director"
  | "finance_officer"
  | "investigations_officer"
  | "technical_officer"
  | "guard"
  | "supervisor"
  | "response"
  | "technician"
  | "k9"
  | "escort"
  | "investigator"
  | "courier"
  | "events"
  | "control_operator"
  | "operations_officer"
  | "training_officer"
  | "deployment_officer"
  | "field_ops_officer";

const managementRoles: Array<{
  id: ManagementRole;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  { id: "ceo", name: "Chief Executive Officer", description: "Executive leadership, strategy, governance", icon: Crown, color: "from-blue-500 to-blue-600" },
  { id: "country_director", name: "Country Director / Managing Director", description: "Nationwide corporate strategy and profitability", icon: Crown, color: "from-blue-600 to-indigo-700" },
  { id: "coo", name: "Chief Operations Officer", description: "Operations command, response oversight", icon: Briefcase, color: "from-cyan-500 to-cyan-600" },
  { id: "gm", name: "General Manager", description: "Commercial, compliance, service delivery", icon: Building2, color: "from-violet-500 to-violet-600" },
  { id: "risk_director", name: "Director of Risk, Insurance & Welfare", description: "Enterprise risk, corporate liabilities, employee welfare", icon: ShieldCheck, color: "from-red-500 to-rose-600" },
  { id: "finance_director", name: "Finance Director", description: "Fiscal health, budgeting, commercial operations", icon: Wallet, color: "from-emerald-600 to-green-700" },
  { id: "ops_manager", name: "Operations Manager", description: "Field ops, dispatch, resource coordination", icon: Activity, color: "from-orange-500 to-orange-600" },
  { id: "regional_ops_manager", name: "Regional Operations Manager", description: "Multi-branch security delivery across territories", icon: Globe, color: "from-orange-600 to-red-600" },
  { id: "branch_ops_manager", name: "Branch Operations Manager", description: "Site deployments, county-level logistics and personnel", icon: MapPin, color: "from-amber-600 to-orange-700" },
  { id: "assistant_senior_ops_manager", name: "Assistant Senior Operations Manager", description: "Supports orchestration of high-profile assignments", icon: Briefcase, color: "from-orange-400 to-amber-500" },
  { id: "area_manager", name: "Area Manager", description: "Localised cluster field metrics and service delivery", icon: MapPin, color: "from-yellow-600 to-orange-600" },
  { id: "facilities_ops_manager", name: "Manager, Facilities & Operations", description: "Physical facility security and real estate assets", icon: Building2, color: "from-stone-600 to-zinc-700" },
  { id: "admin_manager", name: "Admin Manager", description: "Office admin, procurement, facilities", icon: Briefcase, color: "from-stone-500 to-stone-600" },
  { id: "admin_officer", name: "Admin Officer", description: "Front office, supplies, day-to-day admin", icon: FileText, color: "from-zinc-500 to-zinc-600" },
  { id: "branch_manager", name: "Branch Manager", description: "Branch performance, staff, clients", icon: MapPin, color: "from-amber-500 to-amber-600" },
  { id: "regional_manager", name: "Regional Manager", description: "Multi-branch oversight, regional KPIs", icon: Globe, color: "from-indigo-500 to-indigo-600" },
  { id: "control", name: "Control Room", description: "Live monitoring, dispatch, incidents", icon: Monitor, color: "from-slate-500 to-slate-600" },
  { id: "contract_manager", name: "Contract / Project Manager", description: "Contracts, project delivery, milestones", icon: ClipboardList, color: "from-sky-500 to-sky-600" },
  { id: "guard_force_admin", name: "Guard Force Admin", description: "Roster, deployment, discipline, posts", icon: ShieldHalf, color: "from-rose-500 to-rose-600" },
  { id: "cit_manager", name: "Cash & In-Transit Manager", description: "CIT operations, vault, route risk, crews", icon: Coins, color: "from-yellow-500 to-yellow-600" },
  { id: "cit_officer", name: "Cash & In-Transit Officer", description: "Runs, manifests, custody handovers", icon: Boxes, color: "from-yellow-600 to-amber-700" },
  { id: "courier_manager", name: "Courier Manager", description: "Last-mile ops, riders, routes, SLAs", icon: Truck, color: "from-teal-500 to-teal-600" },
  { id: "courier_dispatcher", name: "Courier Dispatcher", description: "Live dispatch board, rider assignment", icon: Activity, color: "from-teal-600 to-cyan-600" },
  { id: "courier_officer", name: "Courier Officer", description: "Rider/driver supervisor, deliveries QA", icon: ClipboardList, color: "from-cyan-600 to-teal-700" },
  { id: "hr", name: "HR Manager", description: "Strategic HR, training, scheduling", icon: UserCog, color: "from-pink-500 to-pink-600" },
  { id: "hr_officer", name: "HR Officer", description: "Day-to-day HR, leave, onboarding", icon: UsersRound, color: "from-fuchsia-500 to-fuchsia-600" },
  { id: "finance", name: "Finance Manager", description: "Revenue, AR, profitability oversight", icon: Wallet, color: "from-emerald-500 to-emerald-600" },
  { id: "finance_officer", name: "Finance Officer", description: "Invoicing, receipts, expenses, bank rec", icon: Receipt, color: "from-green-500 to-green-600" },
  { id: "payroll_officer", name: "Payroll Officer", description: "Payroll runs, statutory deductions, payslips", icon: Banknote, color: "from-lime-500 to-lime-600" },
  { id: "compliance", name: "Compliance & Governance", description: "Audit, policy, regulatory compliance", icon: ShieldCheck, color: "from-teal-500 to-teal-600" },
  { id: "system_admin", name: "System Administrator", description: "User accounts, settings, system config", icon: Shield, color: "from-red-500 to-red-600" },
  { id: "customer_service_manager", name: "Customer Service Manager", description: "Tickets, complaints, escalation, team management", icon: MessageSquare, color: "from-violet-500 to-purple-600" },
  { id: "customer_service_officer", name: "Customer Service Officer", description: "Handle assigned support tickets and client queries", icon: Headphones, color: "from-violet-400 to-violet-500" },
];

export interface FieldRank {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export const fieldRanks: FieldRank[] = [
  {
    id: "guard",
    name: "Guard",
    description: "Site security, patrol checkpoints, attendance",
    icon: Shield,
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "supervisor",
    name: "Supervisor",
    description: "Team management, site oversight, dispatch",
    icon: Users,
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "response",
    name: "Response Officer",
    description: "Alarm response, QRF operations, mobile patrol",
    icon: Radio,
    color: "from-orange-500 to-orange-600"
  },
  {
    id: "technician",
    name: "Technician",
    description: "CCTV, alarms, maintenance, installations",
    icon: Wrench,
    color: "from-cyan-500 to-cyan-600"
  },
  {
    id: "k9",
    name: "K9 Handler",
    description: "K9 unit operations, specialized patrol",
    icon: Dog,
    color: "from-amber-500 to-amber-600"
  },
  {
    id: "escort",
    name: "Escort Officer",
    description: "VIP protection, escort missions",
    icon: Shield,
    color: "from-emerald-500 to-emerald-600"
  },
  {
    id: "investigator",
    name: "Investigator",
    description: "Case management, evidence collection",
    icon: Search,
    color: "from-indigo-500 to-indigo-600"
  },
  {
    id: "courier",
    name: "Rider/Driver",
    description: "Delivery assignments, tracking",
    icon: Truck,
    color: "from-teal-500 to-teal-600"
  },
  {
    id: "events",
    name: "Event Security",
    description: "Event assignments, crowd control",
    icon: Calendar,
    color: "from-pink-500 to-pink-600"
  },
  {
    id: "control_operator",
    name: "Control Room Operator",
    description: "Monitoring, dispatch, incident coordination",
    icon: Monitor,
    color: "from-slate-500 to-slate-600"
  },
  {
    id: "operations_officer",
    name: "Operations Officer",
    description: "Field operations, dispatch, resource coordination",
    icon: Radio,
    color: "from-red-500 to-red-600"
  },
  {
    id: "training_officer",
    name: "Training Officer",
    description: "Training delivery, assessments, certifications",
    icon: GraduationCap,
    color: "from-violet-500 to-violet-600"
  },
  {
    id: "deployment_officer",
    name: "Deployment Officer",
    description: "Daily deployments, post assignments, shift roll-call",
    icon: ClipboardList,
    color: "from-orange-500 to-amber-600"
  },
  {
    id: "field_ops_officer",
    name: "Field Operations Officer",
    description: "Live field oversight, site visits, escalations",
    icon: Activity,
    color: "from-cyan-600 to-blue-700"
  }
];

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  // Note: previously this redirected back to /landing if a session flag was
  // missing, which caused stale browsers to be trapped in the old legacy flow.
  // Auth is now reachable directly without a landing-page precondition.
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>("select-portal");
  const [selectedPortal, setSelectedPortal] = useState<PortalType | null>(null);
  const [selectedRank, setSelectedRank] = useState<string | null>(null);
  const [selectedManagementRole, setSelectedManagementRole] = useState<ManagementRole | null>(null);
  const [loginData, setLoginData] = useState({ email: "", password: "", fullName: "" });
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      toast({ title: "Email required", description: "Enter your email address first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(loginData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password Reset Sent", description: "Check your email for a reset link." });
    }
  };

  // Only auto-navigate if user lands here from a redirect (not explicit navigation)
  // Check if user was sent here by ProtectedRoute vs navigating manually
  const navigateToPortal = useCallback((portal: PortalType, rank?: string | null) => {
    if (portal === "management") {
      const role = (sessionStorage.getItem('selected_management_role') as ManagementRole | null) || selectedManagementRole;
      const roleRoutes: Record<ManagementRole, string> = {
        ceo: "/platform/ceo",
        coo: "/platform/coo",
        gm: "/platform/gm",
        country_director: "/platform/country-director",
        risk_director: "/platform/risk-director",
        finance_director: "/platform/finance-director",
        control: "/platform/control-room",
        contract_manager: "/platform/contract-manager",
        guard_force_admin: "/platform/guard-force-admin",
        hr: "/platform/hr-manager",
        hr_officer: "/platform/hr-officer",
        finance: "/platform/finance-manager",
        finance_officer: "/platform/finance-officer",
        payroll_officer: "/platform/payroll-officer",
        ops_manager: "/platform/ops-manager",
        regional_ops_manager: "/platform/regional-ops-manager",
        branch_ops_manager: "/platform/branch-ops-manager",
        assistant_senior_ops_manager: "/platform/asst-snr-ops-manager",
        area_manager: "/platform/area-manager",
        facilities_ops_manager: "/platform/facilities-ops-manager",
        admin_manager: "/platform/admin-manager",
        admin_officer: "/platform/admin-officer",
        branch_manager: "/platform/branch-manager",
        regional_manager: "/platform/regional-manager",
        cit_manager: "/platform/cit-manager",
        cit_officer: "/platform/cit-officer",
        courier_manager: "/platform/courier-manager",
        courier_dispatcher: "/platform/courier-dispatcher",
        courier_officer: "/platform/courier-officer",
        compliance: "/platform/compliance",
        system_admin: "/platform/system-admin",
        customer_service_manager: "/platform/customer-service-manager",
        customer_service_officer: "/platform/customer-service-officer",
        // Canonical DB app_role enum → nearest platform
        administrator: "/platform/coo",
        bdo: "/platform/ops-manager",
        hr_custodian: "/platform/hr-manager",
        operations_supervisor: "/platform/ops-manager",
        control_room_officer: "/platform/control-room",
        // Legacy / DB role strings → nearest platform
        exec_leadership: "/platform/ceo",
        executive_leadership: "/platform/ceo",
        exec_director: "/platform/ceo",
        executive_director: "/platform/ceo",
        managing_director: "/platform/country-director",
        director: "/platform/ceo",
        operations_director: "/platform/coo",
        finance_officer: "/platform/finance-officer",
        investigations_officer: "/platform/ops-manager",
        technical_officer: "/platform/ops-manager",
        // Field roles — go to management home
        guard: "/management",
        supervisor: "/management",
        response: "/management",
        technician: "/management",
        k9: "/management",
        escort: "/management",
        investigator: "/management",
        courier: "/management",
        events: "/management",
        control_operator: "/platform/control-room",
        operations_officer: "/platform/ops-manager",
        training_officer: "/platform/ops-manager",
        deployment_officer: "/platform/ops-manager",
        field_ops_officer: "/platform/ops-manager",
      };
      navigate(role ? roleRoutes[role] ?? "/platform/coo" : "/platform/coo");
    } else if (portal === "client") {
      navigate("/client-portal");
    } else {
      if (rank) {
        sessionStorage.setItem("selected_rank", rank);
      }
      navigate("/field-app", { state: { rank: rank || sessionStorage.getItem("selected_rank") || "guard" } });
    }
  }, [navigate, selectedManagementRole]);

  useEffect(() => {
    const isExplicitVisit = sessionStorage.getItem('explicit_auth_visit');
    if (isExplicitVisit) {
      sessionStorage.removeItem('explicit_auth_visit');
      return; // Don't auto-redirect
    }
    if (session) {
      const portal = sessionStorage.getItem('selected_portal') as PortalType | null;
      if (portal) {
        const rank = sessionStorage.getItem('selected_rank');
        navigateToPortal(portal, rank);
      }
    }
  }, [navigateToPortal, session]);

  const handlePortalSelect = (portal: PortalType) => {
    setSelectedPortal(portal);
    sessionStorage.setItem('selected_portal', portal);
    if (portal === "field") {
      setAuthStep("select-rank");
    } else if (portal === "management") {
      setAuthStep("select-management-role");
    } else if (portal === "client") {
      setAuthStep("login");
    } else {
      setAuthStep("login");
    }
  };

  const handleManagementRoleSelect = (roleId: ManagementRole) => {
    setSelectedManagementRole(roleId);
    sessionStorage.setItem('selected_management_role', roleId);
    setAuthStep("login");
  };

  const handleRankSelect = (rankId: string) => {
    setSelectedRank(rankId);
    sessionStorage.setItem('selected_rank', rankId);
    setAuthStep("login");
  };

  const handleBackToPortalSelection = () => {
    setAuthStep("select-portal");
    setSelectedPortal(null);
    setSelectedRank(null);
    setSelectedManagementRole(null);
    sessionStorage.removeItem('selected_portal');
    sessionStorage.removeItem('selected_rank');
    sessionStorage.removeItem('selected_management_role');
  };

  const handleBackToRankSelection = () => {
    setAuthStep("select-rank");
    setSelectedRank(null);
    sessionStorage.removeItem('selected_rank');
  };

  const handleBackToManagementSelection = () => {
    setAuthStep("select-management-role");
    setSelectedManagementRole(null);
    sessionStorage.removeItem('selected_management_role');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input with zod before hitting Supabase Auth.
    const schema = authMode === "signup" ? signupSchema : signinSchema;
    const parsed = schema.safeParse({
      email: loginData.email,
      password: loginData.password,
      ...(authMode === "signup" ? { fullName: loginData.fullName } : {}),
    });
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message ?? "Please check your inputs.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: loginData.email.trim(),
        password: loginData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: loginData.fullName || loginData.email },
        },
      });
      if (error) {
        toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (data.session && selectedPortal) {
        toast({ title: "Account Created", description: "Welcome to Black Hawk SOC-OS." });
        navigateToPortal(selectedPortal, selectedRank);
      } else {
        toast({ title: "Account Created", description: "You can now sign in." });
        setAuthMode("signin");
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (data.session && selectedPortal) {
      // Fetch the authoritative role from user_roles to verify the self-declared
      // portal selection. Mismatches are corrected silently.
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      const serverRole = roleRow?.role ? String(roleRow.role).toLowerCase() : null;

      // Determine correct portal from server role, falling back to self-selection
      // only when no server role exists (new users not yet provisioned).
      let resolvedPortal: PortalType = selectedPortal;
      if (serverRole) {
        const fieldKeywords = ["guard", "officer", "technician", "k9", "escort", "investigator", "courier", "rider", "driver", "patrol"];
        const clientKeywords = ["client"];
        if (clientKeywords.some(k => serverRole.includes(k))) {
          resolvedPortal = "client";
        } else if (fieldKeywords.some(k => serverRole.includes(k))) {
          resolvedPortal = "field";
        } else {
          resolvedPortal = "management";
        }
        if (resolvedPortal !== selectedPortal) {
          toast({
            title: "Portal Corrected",
            description: "Your account role has been verified. Redirecting to your assigned portal.",
          });
        }
        // Store the verified role from server, overwriting any self-selected value.
        sessionStorage.setItem("selected_management_role", serverRole);
      }

      const rankName = selectedRank ? fieldRanks.find(r => r.id === selectedRank)?.name : null;
      toast({
        title: "Welcome Back",
        description: `Entering ${resolvedPortal === "management" ? "Management Portal" : `Field Portal - ${rankName}`}`,
      });
      navigateToPortal(resolvedPortal, selectedRank);
      setLoading(false);
    }
  };

  // Portal Selection Screen (FIRST STEP)
  if (authStep === "select-portal") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <Card className="relative w-full max-w-lg p-8 space-y-6 border-border bg-card/95 backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="absolute left-4 top-4 h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <img
                src={logo}
                alt="Black Hawk SOC-OS Logo"
                width={1024}
                height={1024}
                className="w-32 h-32 md:w-36 md:h-36 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              />
            </div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-foreground/60" />
              BLACKHAWK-SOC · SECURE SIGN-IN
            </div>
            <h1
              className="text-3xl tracking-[-0.015em]"
              style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}
            >
              Black Hawk SOC-OS
            </h1>
            <p className="text-sm text-muted-foreground">Select your portal to continue</p>
          </div>

          <div className="grid gap-4">
            {/* Management Portal */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group"
              onClick={() => handlePortalSelect("management")}
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Monitor className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    Management Portal
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Control Room, COO, Executive Management
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>

            {/* Field Portal */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group"
              onClick={() => handlePortalSelect("field")}
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    Field Portal
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Officer Apps, Patrol, Response Teams
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>

            {/* Client Portal */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group"
              onClick={() => handlePortalSelect("client")}
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    Client Portal
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Site Status, Incidents, Service Requests
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </div>
        </Card>
      </div>
    );
  }

  // Rank Selection Screen (FOR FIELD PORTAL)
  if (authStep === "select-rank") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <Card className="relative w-full max-w-3xl p-6 md:p-8 space-y-6 border-border bg-card/95 backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 -mt-2 text-muted-foreground"
            onClick={handleBackToPortalSelection}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal Selection
          </Button>

          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Field Portal
            </div>
            <h1
              className="text-3xl tracking-[-0.015em]"
              style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}
            >
              Select your <em className="italic text-muted-foreground">rank</em>
            </h1>
            <p className="text-sm text-muted-foreground">Pick the platform that matches your duty</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fieldRanks.map((rank) => {
              const Icon = rank.icon;
              return (
                <Card
                  key={rank.id}
                  className="p-4 cursor-pointer hover:border-primary/50 transition-all group bg-card/60"
                  onClick={() => handleRankSelect(rank.id)}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`h-11 w-11 rounded-lg bg-gradient-to-br ${rank.color} flex items-center justify-center shadow`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {rank.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {rank.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  if (authStep === "select-management-role") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <Card className="relative w-full max-w-3xl p-6 md:p-8 space-y-6 border-border bg-card/95 backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 -mt-2 text-muted-foreground"
            onClick={handleBackToPortalSelection}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portal Selection
          </Button>

          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Monitor className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Management Portal
            </div>
            <h1
              className="text-3xl tracking-[-0.015em]"
              style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}
            >
              Select your <em className="italic text-muted-foreground">designation</em>
            </h1>
            <p className="text-sm text-muted-foreground">Your role determines the modules you'll access</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 max-h-[55vh] overflow-y-auto pr-1">
            {managementRoles.map((role) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className="p-4 cursor-pointer hover:border-primary/50 transition-all group bg-card/60"
                  onClick={() => handleManagementRoleSelect(role.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center shadow shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{role.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{role.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // Login/Signup Screen (AFTER PORTAL & RANK SELECTION)
  const currentRank = selectedRank ? fieldRanks.find(r => r.id === selectedRank) : null;
  const currentManagementRole = selectedManagementRole ? managementRoles.find((r) => r.id === selectedManagementRole) : null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <Card className="relative w-full max-w-md p-8 space-y-6 border-border bg-card/95 backdrop-blur-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 -mt-2 text-muted-foreground"
          onClick={selectedPortal === "field" ? handleBackToRankSelection : selectedPortal === "management" ? handleBackToManagementSelection : handleBackToPortalSelection}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {selectedPortal === "field" ? "Back to Rank Selection" : selectedPortal === "management" ? "Back to Designation Selection" : "Back to Portal Selection"}
        </Button>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <img
              src={logo}
              alt="Black Hawk SOC-OS Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            <span className={`h-1 w-1 rounded-full ${selectedPortal === "client" ? "bg-amber-400" : selectedPortal === "field" ? "bg-emerald-400" : "bg-primary"}`} />
            {selectedPortal === "management" ? "Management Portal" : selectedPortal === "client" ? "Client Portal" : "Field Portal"}
          </div>
          <h1
            className="text-2xl tracking-[-0.015em]"
            style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}
          >
            {authMode === "signup" ? "Create your account" : "Sign in to continue"}
          </h1>
          <div className="flex items-center justify-center gap-2">
            {selectedPortal === "management" ? (
              <>
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${currentManagementRole?.color ?? "from-blue-500 to-blue-600"} flex items-center justify-center`}>
                  {currentManagementRole ? <currentManagementRole.icon className="h-4 w-4 text-white" /> : <Monitor className="h-4 w-4 text-white" />}
                </div>
                <p className="text-muted-foreground text-sm">{currentManagementRole?.name ?? "Management Designation"}</p>
              </>
            ) : selectedPortal === "client" ? (
              <>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <p className="text-muted-foreground text-sm">Site Status, Incidents & Service Requests</p>
              </>
            ) : currentRank && (
              <>
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${currentRank.color} flex items-center justify-center`}>
                  <currentRank.icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-muted-foreground text-sm">{currentRank.name}</p>
              </>
            )}
          </div>
        </div>

        {/* Sign In / Sign Up Tabs (works for all portals - cross-device access) */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          <button
            type="button"
            onClick={() => setAuthMode("signin")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              authMode === "signin" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              authMode === "signup" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {authMode === "signup" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Jane Doe"
                value={loginData.fullName}
                onChange={(e) => setLoginData({ ...loginData, fullName: e.target.value })}
                required
              />
            </div>
            <Card className="p-3 bg-muted/40 border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Password must be <strong className="text-foreground">12+ characters</strong> and include uppercase, lowercase, a number, and a symbol.
              </p>
            </Card>
          </div>
        )}

        {/* Client Portal: Login only */}
        {selectedPortal === "client" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Login to access your security dashboard
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="client@company.com"
                  className="pl-10"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (authMode === "signup" ? "Creating Account..." : "Authenticating...") : (authMode === "signup" ? "Create Account" : "Sign In")}
            </Button>
          </form>
        ) : selectedPortal === "field" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Use the credentials provided by your administrator
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="officer@blackhawk.co.ke"
                  className="pl-10"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (authMode === "signup" ? "Creating Account..." : "Authenticating...") : (authMode === "signup" ? "Create Account" : "Sign In")}
            </Button>
          </form>
        ) : (
          /* Management Portal: Login only */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Use your administrator credentials to sign in
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="management@blackhawk.co.ke"
                  className="pl-10"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-4 h-4" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (authMode === "signup" ? "Creating Account..." : "Authenticating...") : (authMode === "signup" ? "Create Account" : "Sign In")}
            </Button>
          </form>
        )}

        <Card className="p-3 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Access is restricted to authorized Black Hawk SOC-OS personnel only.
            </p>
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default Auth;