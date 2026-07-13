import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  accessMatrix, can as canFn, getPermission, visibleModules,
  type DesignationId, type ModuleKey, type Permission, type Rule,
} from "@/config/accessControl";

/**
 * usePermissions — derives the current user's access rules from the
 * server-side role stored in AuthContext (fetched from user_roles on login).
 * The designation is never read from sessionStorage or any client-mutable source.
 */
export const usePermissions = () => {
  const { userRole } = useAuth();

  // Normalise the DB role string to the DesignationId enum.
  // The DB role may use slightly different casing; normalise to lowercase.
  const designation = useMemo((): DesignationId | null => {
    if (!userRole) return null;
    const normalised = userRole.toLowerCase().replace(/\s+/g, "_") as DesignationId;
    // Verify it is a known designation before trusting it.
    if (normalised in accessMatrix) return normalised;
    return null;
  }, [userRole]);

  return useMemo(() => ({
    designation,
    rule: (m: ModuleKey): Rule => getPermission(designation, m),
    can: (m: ModuleKey, level: Exclude<Permission, "none"> = "view") =>
      canFn(designation, m, level),
    visible: () => visibleModules(designation),
    matrix: accessMatrix,
  }), [designation]);
};
