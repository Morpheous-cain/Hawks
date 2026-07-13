import { useEffect, useRef } from "react";

// One-time purge of legacy keys / stale routing flags that could
// strand a browser on the previous version.
const LEGACY_PURGE_KEY = "bh_socos_legacy_purge_v3";
function purgeLegacyState() {
  try {
    if (localStorage.getItem(LEGACY_PURGE_KEY) === "1") return;
    [
      "apsl_app_build_signature",
      "apsl_app_reloading_for_update",
      "apsl_pwa_purge_v3",
      "apsl-lang",
      "bh_app_build_signature",
      "bh_app_reloading_for_update",
      "bh_socos_build_signature",
      "bh_socos_reloading_for_update",
    ].forEach((k) => localStorage.removeItem(k));
    [
      "landing_visited",
      "explicit_auth_visit",
    ].forEach((k) => sessionStorage.removeItem(k));
    localStorage.setItem(LEGACY_PURGE_KEY, "1");
  } catch {}
}

export function useVersionCheck() {
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    // Purge any legacy storage that could re-trigger old redirects
    purgeLegacyState();

    // Recovery listeners now live centrally in src/main.tsx so we don't
    // double-register them and accidentally fire duplicate reload attempts.
  }, []);
}

export default useVersionCheck;
