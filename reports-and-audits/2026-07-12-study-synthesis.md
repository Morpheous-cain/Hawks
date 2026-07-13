# Study Synthesis — Memory + Reports + fix-prompts + context + Prompts

**Date:** 2026-07-12
**Scope:** Consolidated read of `memory/`, `reports-and-audits/`, `fix-prompts/`, `context/`, `Prompts/`.
**Purpose:** Single index of project state before running DB + backend CORE audits.

---

## 1. Project state

**Alpha Pride Security / Black Hawk SOC-OS** — enterprise SOC platform, Kenyan private security company.
**Actual stack:** React 18 + TypeScript + Vite 5 + Tailwind + shadcn/ui + Supabase (Postgres, Auth, RLS, Edge Functions Deno TS, Realtime, Storage). Live at `https://blackkhawk.com`.
**Core loop (the only thing that matters tonight):** login → see seeded sites & staff → open incident → dispatch it. **Cannot complete end-to-end today.**

---

## 2. Blocking bugs (source-verified, frontend audit 2026-07-12)

1. **`src/pages/ManagementPortalHome.tsx:14-45`** — role `map` omits 5 of 8 canonical DB `app_role` enum roles (`administrator`, `bdo`, `hr_custodian`, `operations_supervisor`, `control_room_officer`). Landing "Open Console" → `/management` bounces them to `/auth`. Only reads `sessionStorage`, no `useAuth().userRole` fallback. Regresses the Access Denied fix. **Fix:** extend `map` with 5 missing roles (mirror `PlatformPage.tsx:46-93` `designationToPlatform`) + `useAuth().userRole` fallback when sessionStorage flag empty.
2. **`src/components/control-room/DispatchFleetControl.tsx:168`** — Dispatch button **no `onClick`** (Track `:164` / Contact `:170` also dead). Loop terminates; operator sees vehicles, can't assign. **Fix:** wire `onClick` to `useDispatch` assignment mutation, `isPending` on button, `<RequirePermission module="ops.dispatch" level="edit">` gate.

---

## 3. Secondary findings (frontend, non-blocking, batch with blockers)

- `IncidentManagement:295` Submit no `isPending` — double-submit duplicates (`useIncidents.createIncident` is `useCallback`, not `useMutation`).
- `IncidentManagement:239` "Report Incident" no `RequirePermission ops.incidents create` — every console role sees it.
- `ClientManagement:194` "New Client" no `RequirePermission` despite Admin/BDO/COO-only governance notice.
- `ControlRoom.tsx:159` `min-h-screen` inside PlatformShell/WorkspaceShell `main` re-breaks scroll chain on Screen 5 (nested scrollbar, mobile 430px jank).
- `DispatchFleetControl` enRoute/onScene stat tiles hardcoded 0 (misleading); no loading/error toast on vehicle fetch; status badge collapses real DB `en_route`/`on_scene` enum to binary available/deployed.
- `ControlRoom.tsx:108-156` calls `supabase` directly in component body (CLAUDE.md §10 violation), swallows shift-init errors (no toast on RLS-blocked insert).
- `ClientManagement` nested `ScrollArea h-[600px]` inside already-scrolling main — mobile double-scroll.

---

## 4. DB / migration blockers (from CORE prompts + handoff — NOT yet source-verified, DB audit will confirm)

| Gap | Impact | Source |
|---|---|---|
| `supabase/seed/` missing | sites/clients/staff empty, FK chain untestable | 01-DB-CORE, CORE_FUNCTIONALITY |
| `dob_soft_delete.sql` unapplied | `dob_entries` lacks `deleted_at`/`deleted_by`; `useDOBEntries` runtime risk | 01-DB-CORE, HANDOFF |
| `incident_number_sequence.sql` unapplied | no readable auto-increment incident number | CORE_FUNCTIONALITY |
| Phase 6 pending | `evidence_access_log`, `training_drills`, `client_branding` | PHASE6_MIGRATION |
| Phase 7 pending | `tenants`, `audit_log`, `user_presence`, `auto_dispatch_rules`, `welfare_check_ins`, `false_alarm_log` | PHASE7_MIGRATION |
| K9/DOB/CCTV migrations written, unapplied | in `.lovable/pending_migrations/`, blocked on execution | HANDOFF |
| `audit_trail` RLS 403 | blocks client-side `logAudit()` inserts | Latest-auth.txt, Phase 7 fixes |
| `incident_command_v2.sql` duplicate | applied migration + stale copy in pending | 01-DB-CORE |

---

## 5. Auth history (already fixed — verify persisted)

- **Race condition root cause:** `loading` flipped false before `userRole` resolved → `RequireRole` saw null → `isConsoleRole(null)==false` → false Access Denied. Fix: wait-for-role spinner guard in `RequireRole.tsx` (commits `50096b4`, `02f70f3`).
- React error #310: `useEffect` after conditional return in `RequireRole` → moved hooks above returns (minified-build crash).
- `<PlatformPage>` wrapped in `<RequireRole>` in `App.tsx` so `/platform/:platformId/*` gated.
- `exec_leadership`/`executive_leadership` aliases → `/platform/ceo` added in Auth.tsx + PlatformPage `designationToPlatform`.

### Still open (auth)
- **`hr_custodian` STILL missing from `CONSOLE_ROLES`** in `RequireRole.tsx` (intentionally left until HR UI wired) — false denial risk for HR users.
- **`PendingActivation.tsx` 0 bytes** — users with no `user_roles` row spin forever. Route `/pending-activation` not wired. Recommended 5s timeout → redirect.

---

## 6. Deployment blockers (blackhawk.com production)

From `DEPLOYMENT_FIXES.md` (Immersicloud Consulting, July 2026):
1. Scroll — CSS fix deployed to `WorkspaceShell.tsx` (`overflow-x-hidden min-h-full` main, `min-h-[200vh]` content) + `index.css` (`html,body{height:100%;overflow:hidden} #root{height:100%;overflow-y:auto}`).
2. Login — Supabase needs authorized redirect URLs: add `https://blackhawk.com`, `/auth`, `www` variants.
3. No prod users — create `admin@blackhawk.com / TempPassword123!` via Supabase Dashboard.
4. `profiles` empty — `handle_new_user()` trigger to auto-create profile on signup.
5. CORS/SSL — `VITE_SUPABASE_URL` must be HTTPS.
6. Redirect loop — `ProtectedRoute` pattern in `useAuth.ts` (fetch role from `user_roles` inside `onAuthStateChange`).

---

## 7. Stack-mismatch warning (CLAUDE.md flag confirmed)

Prompts assume **Next.js + Go/Fiber + PostgreSQL**. Actual = **React 18 + Vite + Supabase (Deno Edge)**.

| File | Stack match | Notes |
|---|---|---|
| cowboy.txt | ✅ (role line wrong) | master 20-pt audit spec |
| master.md | agnostic | Vertical Slice method |
| phase 3 to 4.txt | ❌ heaviest rewrite | Backend auditor: Deno `serve()` + secrets + CORS |
| phase_1_inventory_prompt.md | ❌ | Next.js + Go |
| phase_2.txt | ❌ minor | Next.js |
| zoo.md | ✅ is the spec | reconciliation memo, maps Next/Go → React/Vite/Supabase |

**Supabase gaps prompts miss:** RLS policies, Edge Function env secrets, Auth session/refresh, typed `Database` from `types.ts`, Realtime channel cleanup, Storage RLS, `user_roles` + `has_role()`.
**Already corrected + stack-matched:** `01-database-audit-CORE`, `02-backend-audit-CORE`, `03-frontend-audit-CORE`.

---

## 8. Sprint 23-issue status (from SESSION_COMPLETE.md)

**19 fixed in code; 4 deferred pending DB migrations.**
- Done: #1 deploy route, #3 assignment hub, #7 dup Ops Dashboard removed (→ `/control-room`), #8 manual input fallback ~14 dialogs, #9 SOC Command removed 5 files, #10 Waze/TomTom research (TomTom recommended), #11 QRF Alarms→MDT, #12 global scroll, #13/14 CEO Supervision Portal rewrite (real `staff` data), #16 accessControl promoted, #17 DOB role selector, #18 CCTV site filter, #19 BodyCam officer filter, #20 Loss Control officer mgmt UI, #21 Tech Security audit.
- Deferred (DB): #2 incident_timeline (now done), #4 dob soft-delete, #5 visitor_passes, #6 training drills (Phase 6), #15 deployment_posts, #23 K9 module.

---

## 9. Architecture facts (not derivable from a single file)

- **Dual shell, one routing tree:** `ConsoleLayout` (`App.tsx:135` → `WorkspaceShell`) + `PlatformPage` (`App.tsx:272-281` → `PlatformShell`, isolated). Same component (e.g. `ControlRoom.tsx`) reachable both ways.
- **`moduleImporters`** (`src/components/platform/modulePrefetch.ts:16`) — dispatch table mapping module keys → pages. Shared by both shells.
- **Three role maps must stay in sync:** `Auth.tsx:298-364` `roleRoutes`, `PlatformPage.tsx:46-93` `designationToPlatform`, `ManagementPortalHome.tsx:14-45` `map`. **Only the third drifts** (missing 5 canonical roles).
- **Canonical DB `app_role` enum (8 values, migration 01):** `ceo`, `coo`, `control_room_officer`, `operations_supervisor`, `hr_custodian`, `administrator`, `bdo`, `system_admin`.
- `RequireRole` `CONSOLE_ROLES` has all 8 + ~50 aliases + substring fallback — `RequireRole` itself never rejects a valid DB role. Bounce bug is upstream in `ManagementPortalHome`.
- `useIncidents.ts` owns incidents/clients/sites/staff/timeline/escalations/evidence/realtime/CRUD. Uses `useCallback` not `useMutation` → **no `isPending`** — pages add own submitting-state.
- `INCIDENT_TRANSITIONS` (`useIncidents.ts:62`) — enum source of truth: `open→investigating`, `investigating→resolved|closed`, etc.

---

## 10. Gaps found (next work)

1. **DB + Backend CORE audit prompts NOT yet run** (only frontend-CORE ran tonight). Run 01 + 02 to source-verify the 8 DB blockers + confirm `useDispatch`/`useStaff`/`useSites` hook gaps.
2. **Memory stale risk** — `core-loop-blockers.md` reflects frontend audit only. After DB audit: add seed gap, `dob_soft_delete`, `incident_number_sequence`, `hr_custodian` CONSOLE_ROLES gap, `PendingActivation` 0-byte.
3. **Apply fixes** — 2 frontend blockers (source-verified) + DB blockers (after audit confirms).

---

## Key files

`src/pages/ManagementPortalHome.tsx` · `src/components/control-room/DispatchFleetControl.tsx` · `src/pages/IncidentManagement.tsx` · `src/pages/ClientManagement.tsx` · `src/pages/ControlRoom.tsx` · `src/components/auth/RequireRole.tsx` · `src/hooks/useAuth.ts` · `src/hooks/useIncidents.ts` · `src/hooks/useAlarms.ts` · `src/hooks/useDOBEntries.ts` · `src/config/accessControl.ts` · `src/integrations/supabase/types.ts` · `.lovable/pending_migrations/` · `supabase/migrations/` · `supabase/seed/`.

---

## Related reports

- `reports-and-audits/2026-07-12-frontend-audit-core.md` — full 5-screen audit (done)
- `reports-and-audits/2026-07-12-session-learnings.md` — architecture facts + process notes (done)
- `reports-and-audits/2026-07-12-database-audit-core.md` — 01-DB-CORE run (next, in progress)
- `reports-and-audits/2026-07-12-backend-audit-core.md` — 02-backend-CORE run (next, in progress)
