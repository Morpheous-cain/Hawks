import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/utils/auditLog";
import type { ModuleKey, Permission } from "@/config/accessControl";

interface Props {
  module: ModuleKey;
  level?: Exclude<Permission, "none">;
  children: ReactNode;
  redirect?: boolean;
  context?: string;
}

/**
 * <RequirePermission/> — UI guard that hides children when the current
 * designation lacks the required permission level on the module.
 *
 * Denied access attempts are recorded to audit_trail for security monitoring.
 * Backend RLS policies MUST mirror these rules for true defence in depth.
 */
export const RequirePermission = ({
  module, level = "view", children, redirect = false, context,
}: Props) => {
  const { can, designation } = usePermissions();
  const { user } = useAuth();
  const allowed = can(module, level);

  useEffect(() => {
    if (!allowed && user) {
      logAudit({
        module: "access_control",
        action: "permission_denied",
        recordId: user.id,
        changes: {
          required_module: module,
          required_level: level,
          designation: designation ?? "unassigned",
          context: context ?? null,
          path: typeof window !== "undefined" ? window.location.pathname : null,
        },
      });
    }
    // Only run when the denial state is first determined.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  if (allowed) return <>{children}</>;
  if (redirect) return <Navigate to="/management" replace />;

  return (
    <Card className="m-6 max-w-xl border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <div className="text-sm font-semibold text-foreground">Access denied</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your designation ({designation ?? "unassigned"}) does not have{" "}
            <span className="mx-1 font-mono text-foreground">{level}</span>
            permission on <span className="font-mono text-foreground">{module}</span>.
            This access attempt has been recorded.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default RequirePermission;
