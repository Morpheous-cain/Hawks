const CHUNK_RELOAD_FLAG = "bh_socos_chunk_reload_attempt";
// Allow a single automatic stale-chunk recovery, then back off for a long
// cooldown so the app can't get trapped in self-refresh loops after idle.
const CHUNK_RELOAD_COOLDOWN_MS = 10 * 60_000;

const CHUNK_ERROR_RE =
  /Importing a module script failed|Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk \d+ failed|error loading dynamically imported module|Load failed|_result\.default|undefined is not an object \(evaluating '[a-z]\._result|loaded but exposes no React component|does not export a React component/i;

function stringifyError(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (input instanceof Error) return `${input.name}: ${input.message}`;
  const maybeMessage = (input as { message?: unknown }).message;
  return typeof maybeMessage === "string" ? maybeMessage : String(input);
}

export function isChunkLoadError(input: unknown): boolean {
  return CHUNK_ERROR_RE.test(stringifyError(input));
}

export function clearChunkReloadGuard() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
  } catch {
    // no-op
  }
}

export function reloadForChunkError(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_FLAG) || 0);
    if (last && Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) {
      console.warn("[chunkReload] Auto-reload skipped to prevent a refresh loop.");
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, String(Date.now()));
  } catch {
    // fall through and still try to reload
  }

  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key))).catch(() => {});
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((reg) => reg.unregister())).catch(() => {});
  }

  window.setTimeout(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString());
    window.location.replace(url.toString());
  }, 50);

  return true;
}