# Session Learnings — 2026-07-12

**Task:** Run frontend audit prompt `fix-prompts/03-frontend-audit-CORE.md` against 5 core-loop screens.
**Outcome:** Full audit + 2 blocking bugs + secondary findings. Report saved as `2026-07-12-frontend-audit-core.md`.

---

## Architecture facts learned (not derivable from a single file)

### Two parallel shells, one routing tree
- `ConsoleLayout` (`App.tsx:135`) wraps pages in `WorkspaceShell` (sidebar + header + `<main overflow-y-auto>`). Routes: `/clients`, `/incidents`, `/control-room`, etc.
- `PlatformPage` (`App.tsx:272-281`) renders `PlatformShell` (own sidebar + `<main overflow-y-auto>`) — **isolated from ConsoleLayout**. Routes: `/platform/:platformId/m/:moduleKey/*`.
- A page like `ControlRoom.tsx` is reachable BOTH ways: `/control-room` (ConsoleLayout) AND `/platform/control-room/m/control-room` (PlatformPage via `moduleImporters["control-room"]`). Same component, two shells. Any change to ControlRoom must satisfy both scroll contexts.
- `moduleImporters` (`src/components/platform/modulePrefetch.ts:16`) maps `"control-room"` → `@/pages/ControlRoom`, `"incidents"` → `@/pages/IncidentManagement`, `"clients"` → `@/pages/ClientManagement`. Shared between the two shells.

### Role routing has THREE maps that must stay in sync
1. `Auth.tsx:298-364` `roleRoutes` (login → portal URL)
2. `PlatformPage.tsx:46-93` `designationToPlatform` (URL platformId → platform id)
3. `ManagementPortalHome.tsx:14-45` `map` (role → platform URL, used by Landing "Open Console")

**`ManagementPortalHome.map` is the only one missing the 5 canonical DB enum roles** (`administrator`, `bdo`, `hr_custodian`, `operations_supervisor`, `control_room_officer`). The other two maps already include them. Drift = bounce-to-`/auth` bug.

### Canonical DB `app_role` enum (8 values, migration 01)
`ceo`, `coo`, `control_room_officer`, `operations_supervisor`, `hr_custodian`, `administrator`, `bdo`, `system_admin`.

`RequireRole.tsx:11-36` `CONSOLE_ROLES` set includes all 8 + ~50 aliases. `isConsoleRole` (line 38) also does substring fallback. So `RequireRole` itself never rejects a valid DB role — the bounce bug is in `ManagementPortalHome` BEFORE `RequireRole` runs, or in `PlatformPage` if `system_admin` cross-platform check trips.

### Permission system exists but is unevenly applied
- `usePermissions.ts` derives `designation` from `useAuth().userRole`, normalises lowercase, checks against `accessControl.ts` `accessMatrix`.
- `accessControl.ts` defines `ModuleKey` values: `ops.incidents`, `ops.dispatch`, `ops.controlRoom`, `ops.mdt`, `courier.dispatch`, etc. with `none→view→edit→create→delete` levels.
- `RequirePermission` element guard exists (`src/components/auth/RequirePermission.tsx`) but is **NOT used** on the core loop's create buttons (ClientManagement "New Client", IncidentManagement "Report Incident", DispatchFleetControl "Dispatch"). All three bypass permission checks entirely.
- `RequireRole` (route guard) checked on all 5 core routes — passes for all 8 DB roles. Regression from earlier "No Role Assigned" bug is **NOT** present in `RequireRole` itself; the regression hides in `ManagementPortalHome`'s `map`.

### Scroll chain
- Root: `index.html:9-10` + `index.css:217,227` set `html, body, #root { height: 100% }`, `#root { display: flex; flex-direction: column }`.
- Both shells: outer `flex h-screen overflow-hidden` + inner `<main flex-1 overflow-y-auto>`.
- **Pitfall:** page components using `min-h-screen` inside the shell's scrolling main re-break the chain (forces 100vh inside an already-scrolling container → nested scrollbars). `ControlRoom.tsx:159` does this. Other pages (`ClientManagement`, `IncidentManagement`) correctly use `space-y-6` only.
- Mobile 430px: scroll chain holds on Screens 1-4, breaks on Screen 5 due to the above.

### Incident + dispatch data flow
- `useIncidents.ts` owns: incidents, clients, sites, staff, timeline, escalations, evidence, realtime channels, all CRUD. Single `useCallback` actions (NOT `useMutation`), so **no `isPending` available** — pages must add their own submitting-state for double-submit protection.
- Realtime: `incidents-hook` channel subscribes to `incidents`, `incident_timeline`, `incident_escalations`, `incident_evidence` — refetch on change.
- Incident transitions: `INCIDENT_TRANSITIONS` (line 62) is the enum source of truth: `open→investigating`, `investigating→resolved|closed`, `in_progress→resolved|closed`, `resolved→closed`. Status select in IncidentManagement pulls from this, so no stale mock strings.
- Dispatch surface = `DispatchFleetControl.tsx` inside ControlRoom's "dispatch" tab. Pulls `vehicles` table every 10s. **Dispatch button is a stub** (no `onClick`).
- AI brief: `supabase.functions.invoke("incident-ai-summary")` edge function — present, wired, toast feedback.

### Audit-prompt "known facts" verification
1. ✅ Login routing: all 8 DB roles + aliases resolve via `Auth.tsx roleRoutes` and `PlatformPage.designationToPlatform`. **Confirmed for direct login.**
2. ❌ But `ManagementPortalHome.map` (the `/management` forwarder) omits 5 of those 8 — so the "Open Console" path regresses for those roles. **Partial regression.**
3. ✅ `vercel.json` SPA rewrite `/(.*) → /index.html` present. Hard-refresh of all 5 screens will not 404.
4. ⚠️ Scroll fix holds on Screens 1-4, **re-breaks on Screen 5** due to `ControlRoom.tsx:159` `min-h-screen`.

---

## Process notes for next audit run

- Read the page component AND the shell that mounts it AND the route table (`App.tsx`) AND `RequireRole` AND `accessControl.ts` for any route reachable in multiple ways. Single-file reads miss the dual-shell + dual-route pattern.
- For permission checks: `RequireRole` (route) passes for all valid roles by design. The bugs hide in the forwarder components (`ManagementPortalHome`) and the missing element guards (`RequirePermission` not applied). Check both layers.
- For "no `isPending`" bugs: `useIncidents` uses `useCallback` not `useMutation`. Any page using it for writes needs local submitting-state. Pattern likely repeats across other `use*` hooks in this repo — audit them the same way.
- For scroll issues: grep page root div for `min-h-screen` — any hit inside ConsoleLayout/PlatformShell is suspect.
- `moduleImporters` (`src/components/platform/modulePrefetch.ts`) is the dispatch table for which page renders under which platform module key — use it to confirm a "module" actually exists before assuming a sidebar link is dead.

---

## Files touched this session
- Created: `reports-and-audits/2026-07-12-frontend-audit-core.md` (full audit report)
- Created: `reports-and-audits/2026-07-12-session-learnings.md` (this file)
- Memory: `~/.claude/projects/.../memory/core-loop-blockers.md` + `MEMORY.md` index (persisted for future sessions)

## No code changed
Audit-only session. Fixes not applied. Next step: apply the 2 blockers + secondary batch (see report).
