import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Designation selection happens at the Auth screen. This route simply forwards
 * the authenticated user to the platform that matches their selected designation.
 * All designation routes resolve to the isolated /platform/:platformId surface.
 */
const ManagementPortalHome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem("selected_management_role");
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
