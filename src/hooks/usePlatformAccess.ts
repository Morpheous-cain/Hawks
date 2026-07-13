import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CONSOLE_ROLES = new Set([
  "admin", "administrator", "coo", "ceo", "country_director",
  "managing_director", "general_manager", "manager",
  "operations_manager", "regional_ops_manager", "branch_ops_manager",
  "assistant_senior_ops_manager", "area_manager", "facilities_ops_manager",
  "branch_manager", "regional_manager", "contract_manager",
  "control_room_operator", "supervisor", "hr_manager", "hr_officer",
  "finance_manager", "finance_officer", "finance_director", "payroll_officer",
  "investigations_manager", "technical_manager", "risk_director",
  "compliance_officer", "system_admin", "guard_force_admin",
  "cit_manager", "courier_manager", "courier_dispatcher",
  "gm", "ops_manager", "control", "hr", "finance", "compliance",
  "admin_manager", "admin_officer", "regional_manager", "cit_officer",
  "courier_officer",
  "customer_service_manager", "customer_service_officer",
]);

const FIELD_APP_ROLES = new Set([
  "guard", "security_guard", "officer", "field_officer", "field_ops_officer",
  "deployment_officer", "patrol_officer", "response_officer", "response_team",
  "qrf_team", "technician", "technical_officer", "k9_handler", "k9_officer",
  "escort_officer", "vip_protection", "investigator", "event_guard",
  "event_security", "event_supervisor", "rider", "driver", "rider_driver",
  "courier", "courier_officer", "cit_officer", "training_officer",
  "operations_officer",
]);

const CLIENT_PORTAL_ROLES = new Set(["client", "client_user", "client_admin"]);

export type PlatformType = "console" | "field-app" | "client-portal" | "access-denied" | "unknown";

interface UsePlatformAccessResult {
  platform: PlatformType;
  role: string | null;
  isLoading: boolean;
  userId: string | null;
}

export const usePlatformAccess = (): UsePlatformAccessResult => {
  const [platform, setPlatform] = useState<PlatformType>("unknown");
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkPlatformAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setPlatform("unknown");
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        // Primary: user_roles table (server-side, cannot be spoofed client-side)
        const { data: roleRow, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        let userRole: string | null = roleRow?.role ? String(roleRow.role) : null;

        // Secondary fallback: staff.position matched by email (read-only lookup)
        if (!userRole && !roleError) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.email) {
            const { data: staffRecord } = await (supabase as any)
              .from("staff")
              .select("position")
              .eq("email", profile.email)
              .maybeSingle();
            if (staffRecord?.position) userRole = staffRecord.position as string;
          }
        }

        setRole(userRole);

        if (!userRole) {
          // No role assigned — deny access rather than defaulting to console.
          // A system admin must provision the user's role before they can log in.
          setPlatform("access-denied");
          setIsLoading(false);
          return;
        }

        const normalised = userRole.toLowerCase().replace(/\s+/g, "_");

        if (CONSOLE_ROLES.has(normalised) || [...CONSOLE_ROLES].some(r => normalised.includes(r))) {
          setPlatform("console");
        } else if (CLIENT_PORTAL_ROLES.has(normalised)) {
          setPlatform("client-portal");
        } else if (FIELD_APP_ROLES.has(normalised) || [...FIELD_APP_ROLES].some(r => normalised.includes(r))) {
          setPlatform("field-app");
        } else {
          // Role exists in DB but is unrecognised — deny, do not silently promote.
          setPlatform("access-denied");
        }
      } catch (error) {
        console.error("[usePlatformAccess] error:", error);
        setPlatform("access-denied");
      } finally {
        setIsLoading(false);
      }
    };

    checkPlatformAccess();
  }, []);

  return { platform, role, isLoading, userId };
};

export const getPlatformForRole = (role: string | null): PlatformType => {
  if (!role) return "access-denied";
  const normalised = role.toLowerCase().replace(/\s+/g, "_");
  if (CONSOLE_ROLES.has(normalised) || [...CONSOLE_ROLES].some(r => normalised.includes(r))) return "console";
  if (CLIENT_PORTAL_ROLES.has(normalised)) return "client-portal";
  if (FIELD_APP_ROLES.has(normalised) || [...FIELD_APP_ROLES].some(r => normalised.includes(r))) return "field-app";
  return "access-denied";
};
