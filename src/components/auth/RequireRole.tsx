import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * All roles a user can have that grant console/platform access.
 * Includes: canonical DB app_role enum values, UI alias strings,
 * sessionStorage legacy values — covers every account type.
 */
const CONSOLE_ROLES = new Set([
  // DB app_role enum (the 8 canonical values)
  "ceo", "coo", "control_room_officer", "operations_supervisor",
  "hr_custodian", "administrator", "bdo", "system_admin",
  // Extended designation aliases used in UI / sessionStorage
  "admin", "country_director", "managing_director", "general_manager",
  "manager", "operations_manager", "regional_ops_manager", "branch_ops_manager",
  "assistant_senior_ops_manager", "area_manager", "facilities_ops_manager",
  "branch_manager", "regional_manager", "contract_manager", "control_room_operator",
  "supervisor", "hr_manager", "hr_officer", "finance_manager", "finance_officer",
  "finance_director", "payroll_officer", "investigations_manager", "technical_manager",
  "risk_director", "compliance_officer", "guard_force_admin", "cit_manager",
  "courier_manager", "courier_dispatcher", "gm", "ops_manager", "control",
  "hr", "finance", "compliance", "admin_manager", "admin_officer",
  "cit_officer", "courier_officer", "customer_service_manager",
  "customer_service_officer",
  // All DB role strings + legacy aliases
  "exec_leadership", "executive_leadership", "executive",
  "exec_director", "executive_director", "managing_director", "director",
  "operations_director",
  // Field / officer roles
  "guard", "supervisor", "response", "technician", "k9", "escort",
  "investigator", "courier", "events", "control_operator",
  "operations_officer", "training_officer", "deployment_officer",
  "field_ops_officer", "investigations_officer", "technical_officer",
]);

function isConsoleRole(role: string): boolean {
  const n = role.toLowerCase().replace(/[\s-]+/g, "_");
  if (CONSOLE_ROLES.has(n)) return true;
  // Substring fallback — catches any composite role strings
  return [...CONSOLE_ROLES].some(r => n.includes(r) || r.includes(n));
}

interface Props {
  children: ReactNode;
  /** When provided, ONLY these exact roles are allowed. Omit to allow any console role. */
  allowedRoles?: string[];
}

/**
 * Route-level access guard.
 *
 * loading=true  → full-page spinner (auth + role both resolving together)
 * !user         → redirect to /auth
 * userRole=null → "No role assigned" — account exists but not provisioned
 * role denied   → 403 screen
 * role allowed  → render children
 *
 * NOTE: All hooks are at the top — no hooks after conditional returns (React #310).
 */
export const RequireRole = ({ children, allowedRoles }: Props) => {
  const { user, userRole, loading } = useAuth();

  // Audit log — runs only when a real denial happens, never during loading
  useEffect(() => {
    if (loading || !user || !userRole) return;
    const allowed = allowedRoles
      ? allowedRoles.some(r => userRole.toLowerCase() === r.toLowerCase())
      : isConsoleRole(userRole);
    if (!allowed) {
      // Fire-and-forget — don't await, don't let failure affect the UI
      supabaseAuditLog(user.id, userRole, allowedRoles);
    }
  }, [loading, user, userRole, allowedRoles]);

  // ── Render logic (no hooks below this line) ──────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="mx-auto h-12 w-12 text-yellow-500" />
          <h1 className="text-2xl font-bold">No Role Assigned</h1>
          <p className="text-muted-foreground text-sm">
            Your account (<span className="font-mono font-semibold">{user.email}</span>) is
            authenticated but has not been assigned a platform role.
            Contact your system administrator.
          </p>
          <a href="/auth" className="text-primary text-sm underline underline-offset-2">
            Return to sign-in
          </a>
        </div>
      </div>
    );
  }

  const allowed = allowedRoles
    ? allowedRoles.some(r => userRole.toLowerCase() === r.toLowerCase())
    : isConsoleRole(userRole);

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-sm">
            Your role <span className="font-mono font-semibold">{userRole}</span> does
            not have permission to access this area.
            Contact your system administrator if you believe this is an error.
          </p>
          <a href="/auth" className="text-primary text-sm underline underline-offset-2">
            Return to sign-in
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Separate function so it never throws inside the component
async function supabaseAuditLog(userId: string, role: string, allowedRoles?: string[]) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.from("audit_trail").insert({
      user_id: userId,
      module: "access_control",
      action: "route_access_denied",
      record_id: userId,
      changes: {
        user_role: role,
        path: window.location.pathname,
        allowed_roles: allowedRoles ?? "console_roles",
      },
    });
  } catch {
    // RLS may block the insert — swallow silently, never crash the UI
  }
}

export default RequireRole;
