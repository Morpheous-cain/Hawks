import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { useParams, Navigate, Routes, Route } from "react-router-dom";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PlatformWelcome } from "@/components/platform/PlatformWelcome";
import { platforms, type PlatformId } from "@/components/platform/platformRegistry";
import { moduleImporters, isSlowNetwork, type ModuleKey } from "@/components/platform/modulePrefetch";

type LazyModule = Record<string, unknown> & {
  default?: ComponentType;
};

const normalizeLazyModule = (key: string, mod: LazyModule) => {
  if (mod?.default) return { default: mod.default };

  const namedComponent = Object.entries(mod ?? {}).find(
    ([exportName, value]) => /^[A-Z]/.test(exportName) && typeof value === "function",
  )?.[1];

  if (namedComponent) {
    console.warn(`[PlatformPage] Module "${key}" is missing a default export; using named export fallback.`);
    return { default: namedComponent as ComponentType };
  }

  throw new Error(`Platform module "${key}" does not export a React component.`);
};

/**
 * Isolated platform page.
 *
 * CRITICAL: Every module a designation can access is rendered as a NESTED
 * route inside this PlatformShell. This is what eliminates the "two pages /
 * two sidebars" problem — module pages no longer escape into ConsoleLayout's
 * WorkspaceShell. There is exactly ONE shell on screen at any time.
 *
 * Zero-leak: URL platformId must match the user's selected designation
 * (system_admin can audit any).
 */

// Lazy components built from the shared importer registry. Keeping the
// importers in their own module lets PlatformShell prefetch on hover/focus
// using the exact same chunk identity (so React.lazy() resolves instantly).
const pages = Object.fromEntries(
  Object.entries(moduleImporters).map(([k, fn]) => [k, lazy(() => fn().then((mod) => normalizeLazyModule(k, mod)))])
) as Record<ModuleKey, ReturnType<typeof lazy>>;

const designationToPlatform: Record<string, PlatformId> = {
  ceo: "ceo", coo: "coo", gm: "gm", control: "control-room",
  country_director: "country-director", risk_director: "risk-director", finance_director: "finance-director",
  regional_ops_manager: "regional-ops-manager", branch_ops_manager: "branch-ops-manager",
  assistant_senior_ops_manager: "asst-snr-ops-manager", area_manager: "area-manager",
  facilities_ops_manager: "facilities-ops-manager",
  contract_manager: "contract-manager", guard_force_admin: "guard-force-admin",
  hr: "hr-manager", hr_officer: "hr-officer",
  finance: "finance-manager", finance_officer: "finance-officer", payroll_officer: "payroll-officer",
  ops_manager: "ops-manager", admin_manager: "admin-manager", admin_officer: "admin-officer",
  branch_manager: "branch-manager", regional_manager: "regional-manager",
  cit_manager: "cit-manager", cit_officer: "cit-officer",
  courier_manager: "courier-manager", courier_dispatcher: "courier-dispatcher", courier_officer: "courier-officer",
  compliance: "compliance", system_admin: "system-admin",
  customer_service_manager: "customer-service-manager",
  // Canonical DB roles → nearest platform
  administrator: "coo",
  bdo: "ops-manager",
  hr_custodian: "hr-manager",
  operations_supervisor: "ops-manager",
  control_room_officer: "control-room",
  customer_service_officer: "customer-service-officer",
  // All DB role strings + legacy aliases → nearest platform
  exec_leadership: "ceo",
  executive_leadership: "ceo",
  exec_director: "ceo",
  executive_director: "ceo",
  managing_director: "country-director",
  director: "ceo",
  operations_director: "coo",
  finance_officer: "finance-officer",
  investigations_officer: "ops-manager",
  technical_officer: "ops-manager",
  guard: "coo",
  supervisor: "ops-manager",
  response: "control-room",
  technician: "ops-manager",
  k9: "ops-manager",
  escort: "ops-manager",
  investigator: "ops-manager",
  courier: "courier-manager",
  events: "ops-manager",
  control_operator: "control-room",
  operations_officer: "ops-manager",
  training_officer: "ops-manager",
  deployment_officer: "ops-manager",
  field_ops_officer: "ops-manager",
};

const Loader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
  </div>
);

const PlatformPage = () => {
  const { platformId } = useParams<{ platformId: string }>();

  if (!platformId || !(platformId in platforms)) {
    return <Navigate to="/auth" replace />;
  }

  const designation =
    typeof window !== "undefined"
      ? sessionStorage.getItem("selected_management_role")
      : null;

  if (designation && designation !== "system_admin") {
    const ownPlatform = designationToPlatform[designation];
    if (ownPlatform && platformId !== ownPlatform) {
      return <Navigate to={`/platform/${ownPlatform}`} replace />;
    }
  }

  const platform = platforms[platformId as PlatformId];

  // Build allow-list of module keys this platform exposes (zero-leak).
  const allowedKeys = new Set(
    platform.modules
      .map((m) => m.moduleKey)
      .filter((k): k is ModuleKey => Boolean(k && k in pages)),
  );

  // Prefetch this platform's module chunks. Strategy:
  //  • Skip aggressive prefetch on Save-Data / 2g (poor networks).
  //  • Otherwise stagger imports across idle callbacks so we never block
  //    the main thread or saturate the connection — opening any module
  //    becomes near-instant with no Suspense flash.
  useEffect(() => {
    if (isSlowNetwork()) return;
    const keys = Array.from(allowedKeys).slice(0, 8);
    const idle: (cb: () => void) => number =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => window.setTimeout(cb, 200));
    const cancel: (h: number) => void =
      (window as any).cancelIdleCallback || window.clearTimeout;
    const handles: number[] = [];

    // Stagger: 4 chunks per idle tick so slow CPUs aren't pegged.
    const BATCH = 2;
    for (let i = 0; i < keys.length; i += BATCH) {
      const slice = keys.slice(i, i + BATCH);
      handles.push(
        idle(() => {
          slice.forEach((k) => {
            try { (moduleImporters as any)[k]?.(); } catch { /* swallow */ }
          });
        }),
      );
    }
    return () => { handles.forEach((h) => { try { cancel(h); } catch { /* noop */ } }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformId]);

  return (
    <PlatformShell platform={platform}>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route index element={<PlatformWelcome platform={platform} />} />
          {Array.from(allowedKeys).map((key) => {
            const Comp = pages[key];
            return <Route key={key} path={`m/${key}/*`} element={<Comp />} />;
          })}
          {/* anything else → back to welcome (prevents leakage) */}
          <Route path="*" element={<Navigate to={`/platform/${platformId}`} replace />} />
        </Routes>
      </Suspense>
    </PlatformShell>
  );
};

export default PlatformPage;
