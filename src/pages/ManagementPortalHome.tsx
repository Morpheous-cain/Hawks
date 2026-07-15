import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // Added import

/**
 * Designation selection happens at the Auth screen. This route simply forwards
 * the authenticated user to the platform that matches their selected designation.
 * All designation routes resolve to the isolated /platform/:platformId surface.
 */
const ManagementPortalHome = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth(); // Added hook call

  useEffect(() => {
    const sessionRole = sessionStorage.getItem("selected_management_role");
    const role = sessionRole || userRole; // Use userRole as fallback
    const map: Record<string, string> = {
      ceo: "/platform/ceo",
      coo: "/platform/coo",
      gm: "/platform/gm",
      control: "/platform/control-room",
      contract_manager: "/platform/contract-manager",
      guard_force_admin: "/platform/guard-force-admin",
      hr: "/platform/hr-manager",
      hr_officer: "/platform/hr-officer",
      finance: "/platform/finance-manager",
      finance_officer: "/platform/finance-officer",
      payroll_officer: "/platform/payroll-officer",
      ops_manager: "/platform/ops-manager",
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
      // Added missing canonical DB roles from CLAUDE.md/core-loop-blockers.md
      administrator: "/platform/coo", // mapped to coo
      bdo: "/platform/ops-manager", // mapped to ops-manager
      hr_custodian: "/platform/hr-manager", // mapped to hr-manager
      operations_supervisor: "/platform/ops-manager", // mapped to ops-manager
      control_room_officer: "/platform/control-room", // mapped to control-room
      customer_service_officer: "/platform/customer-service-officer", // From PlatformPage.tsx
      country_director: "/platform/country-director", // From PlatformPage.tsx
      risk_director: "/platform/risk-director", // From PlatformPage.tsx
      finance_director: "/platform/finance-director", // From PlatformPage.tsx
      regional_ops_manager: "/platform/regional-ops-manager", // From PlatformPage.tsx
      branch_ops_manager: "/platform/branch-ops-manager", // From PlatformPage.tsx
      assistant_senior_ops_manager: "/platform/asst-snr-ops-manager", // From PlatformPage.tsx
      area_manager: "/platform/area-manager", // From PlatformPage.tsx
      facilities_ops_manager: "/platform/facilities-ops-manager", // From PlatformPage.tsx
      // Additional aliases from PlatformPage.tsx
      exec_leadership: "/platform/ceo",
      executive_leadership: "/platform/ceo",
      exec_director: "/platform/ceo",
      executive_director: "/platform/ceo",
      managing_director: "/platform/country-director",
      director: "/platform/ceo",
      operations_director: "/platform/coo",
      investigations_officer: "/platform/ops-manager",
      technical_officer: "/platform/ops-manager",
      guard: "/platform/coo",
      supervisor: "/platform/ops-manager",
      response: "/platform/control-room",
      technician: "/platform/ops-manager",
      k9: "/platform/ops-manager",
      escort: "/platform/ops-manager",
      investigator: "/platform/ops-manager",
      courier: "/platform/courier-manager",
      events: "/platform/ops-manager",
      control_operator: "/platform/control-room",
      operations_officer: "/platform/ops-manager",
      training_officer: "/platform/ops-manager",
      deployment_officer: "/platform/ops-manager",
      field_ops_officer: "/platform/ops-manager",
    };

    if (!role || !map[role]) {
      navigate("/auth", { replace: true });
      return;
    }

    navigate(map[role], { replace: true });
  }, [navigate]);

  return null;
};

export default ManagementPortalHome;
