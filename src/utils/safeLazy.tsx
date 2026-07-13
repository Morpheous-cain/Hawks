import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { isChunkLoadError, reloadForChunkError } from "@/utils/chunkReload";

type AnyModule = Record<string, unknown> & { default?: ComponentType<any> };

const isReactComponentLike = (value: unknown): value is ComponentType<any> => {
  if (typeof value === "function") return true;
  return typeof value === "object" && value !== null;
};

/**
 * Resilient wrapper around React.lazy().
 *
 * - Logs the offending module name when a dynamic import resolves without a
 *   default export (the minified `_result.default` crash hides this).
 * - Falls back to the first uppercase named component export when present.
 * - Treats missing-default as a chunk-load error so the app reloads to pick
 *   up a fresh bundle instead of showing a fatal ErrorBoundary.
 */
export function safeLazy<T extends ComponentType<any>>(
  name: string,
  importer: () => Promise<AnyModule>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await importer();
      if (mod && "default" in mod && isReactComponentLike(mod.default)) {
        return { default: mod.default as T };
      }
      // Try a named uppercase component as a graceful fallback.
      const named = Object.entries(mod ?? {}).find(
        ([k, v]) => /^[A-Z]/.test(k) && isReactComponentLike(v),
      )?.[1] as T | undefined;
      if (named) {
        console.warn(`[safeLazy] "${name}" has no default export — using named export fallback.`);
        return { default: named };
      }
      const err = new Error(
        `[safeLazy] Module "${name}" loaded but exposes no React component (default or named).`,
      );
      console.error(err);
      // Treat as chunk error so the auto-reload path triggers.
      reloadForChunkError();
      throw err;
    } catch (err) {
      if (isChunkLoadError(err)) reloadForChunkError();
      console.error(`[safeLazy] Failed to load "${name}":`, err);
      throw err;
    }
  }) as LazyExoticComponent<T>;
}
