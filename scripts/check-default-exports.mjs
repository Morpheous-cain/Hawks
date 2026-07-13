#!/usr/bin/env node
/**
 * Scans every dynamic `import("...")` call in App.tsx and modulePrefetch.ts
 * and verifies the target module has a default export (direct or re-exported).
 *
 * Wave-1 stability guard — run this in CI / pre-commit to prevent the
 * `_result.default` lazy-route crash from reappearing.
 *
 *   node scripts/check-default-exports.mjs
 */
import fs from "fs";
import path from "path";

const ENTRY_FILES = [
  "src/App.tsx",
  "src/components/platform/modulePrefetch.ts",
];

const targets = new Set();
for (const f of ENTRY_FILES) {
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) targets.add(m[1]);
}

const missing = [];
for (const t of targets) {
  const bases = [
    t.replace(/^@\//, "src/"),
    t.startsWith(".") ? "src/" + t.replace(/^\.\//, "") : t,
  ];
  let resolved = null;
  for (const b of bases) {
    for (const ext of ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]) {
      if (fs.existsSync(b + ext)) { resolved = b + ext; break; }
    }
    if (resolved) break;
  }
  if (!resolved) { missing.push({ import: t, reason: "file not found" }); continue; }

  const src = fs.readFileSync(resolved, "utf8");
  const hasDefault =
    /export\s+default/.test(src) ||
    /export\s*\{[^}]*\bdefault\b[^}]*\}/.test(src);
  if (!hasDefault) missing.push({ import: t, resolved, reason: "no default export" });
}

console.log(`Scanned ${targets.size} lazy imports across ${ENTRY_FILES.length} entry files.`);
if (missing.length === 0) {
  console.log("✓ All lazy targets expose a default export.");
  process.exit(0);
}
console.error("✗ Missing default exports:");
for (const m of missing) console.error("  ", m);
process.exit(1);
