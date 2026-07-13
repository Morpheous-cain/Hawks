# npm Build Fix — 2026-07-11

## Root Causes (2)

### 1. Stale lockfile blocking vite@8
- `package-lock.json` pinned `@vitejs/plugin-react-swc@3.11.0` (peer `vite@^4-7`) + `lovable-tagger@1.1.11` (peer `vite@<8`)
- `package.json` declared `vite@^8.1.4` — conflict
- npm refused install, error: `Cannot find package '@vitejs/plugin-react-swc'`

**Fix:**
- Bump `plugin-react-swc` to `^4.3.1` (supports vite@8)
- `lovable-tagger@^1.1.11` → latest 1.3.1 (peer `<9`)
- Delete `package-lock.json` + `node_modules`, `npm install` fresh

### 2. Invalid CSS from dynamic Tailwind class
- `src/pages/Compliance.tsx:24`: `toneClass = (t) => \`text-[hsl(var(--${t}))]\``
- Template literal leaked `${t}` into built CSS: `.text-\[hsl\(var\(--\$\{t\}\)\)\]`
- lightningcss minifier: `SyntaxError: Unexpected token Delim('$')`

**Fix:**
```ts
const TONE_CLASS: Record<string, string> = {
  "alert-caution": "text-[hsl(var(--alert-caution))]",
  "alert-critical": "text-[hsl(var(--alert-critical))]",
  "alert-normal": "text-[hsl(var(--alert-normal))]",
  primary: "text-[hsl(var(--primary))]",
};
```

## Files Changed
- `package.json` (plugin bump)
- `package-lock.json` (regenerated)
- `src/pages/Compliance.tsx` (static class map)

## Result
```
✓ built in 26.76s
```