# Core-Slice Backend & Query Audit — Black Hawk SOC-OS

**Run this SECOND, after the database audit is done and any migration/seed fixes from it are applied.**
**Scope: ONLY the hooks and query patterns behind the core loop below.**

---

## The Finish Line This Audit Serves

> **Login → see real seeded sites & staff → open an incident → dispatch it.**

This audit exists to answer one question: *once the database has real data, does the code actually read and write it correctly for this loop?* Anything outside the loop is deferred.

---

## System Prompt

Role: Principal Backend Architect & Supabase/Deno Expert
Task: Audit query patterns, hooks, and data-fetching code for exactly these five areas:

1. **Auth & session** — `src/hooks/useAuth.ts`, `src/components/auth/RequireRole.tsx`, `src/App.tsx` (ProtectedRoute)
2. **Staff, Sites, Clients data access** — `src/pages/StaffManagement.tsx`, `src/pages/ClientManagement.tsx` and their sub-components (`src/components/staff/*`)
3. **Incidents** — `src/hooks/useIncidents.ts`, `src/pages/IncidentManagement.tsx`
4. **Alarms** — `src/hooks/useAlarms.ts`, `src/pages/Alarms.tsx`
5. **Control Room / Dispatch** — `src/pages/ControlRoom.tsx` and its tab components in `src/components/control-room/` (`DispatchFleetControl.tsx`, `AssignmentCommandHub.tsx`, `LiveOperationsWall.tsx`, `LiveStatusMonitor.tsx`)
6. **DOB** — `src/hooks/useDOBEntries.ts`, `src/pages/DOB.tsx`

## Known Facts Going In (verify, don't rediscover)

- `useAuth.ts` was recently rewritten so `loading` stays `true` until **both** the session AND the `user_roles` fetch resolve — confirm no component reads `userRole` before `loading` is `false`, since that was the exact bug that caused false "Access Denied" screens.
- `ClientManagement.tsx` imports `supabase` directly and queries inline rather than through a dedicated hook — confirm whether this is a real problem (inconsistent caching/invalidation vs `useIncidents`/`useAlarms` pattern) or acceptable as-is, and if it should be extracted into a `useClients.ts` hook for consistency.
- There is currently **no `useStaff.ts`, `useSites.ts`, or `useDispatch.ts` hook** anywhere in `src/hooks/`. Confirm this. If `StaffManagement.tsx` and the control-room dispatch components are reading data at all right now, identify exactly how (inline queries? local mock arrays? nothing?).
- `ControlRoom.tsx` itself has no direct Supabase import — it's a tab shell delegating to child components. The actual data-fetching (or lack of it) lives in the child components under `src/components/control-room/`. Audit those directly.

## Instructions

For **only** the six areas above:

1. **Auth flow correctness**
   - Trace the exact render sequence from `AuthProvider` mount → `onAuthStateChange` fires → role fetched → `loading=false`. Confirm there is no window where a component can read `userRole=null` while `loading=false` incorrectly (this was the root cause of the access-denied bug fixed earlier — verify the fix holds).
   - Confirm `RequireRole` has no hooks called after a conditional return (React error #310 risk).
   - Confirm `signOut()` clears all relevant sessionStorage keys and calls `supabase.auth.signOut({ scope: 'global' })`.

2. **Staff / Sites / Clients — data layer**
   - Determine exactly what each of `StaffManagement.tsx` and `ClientManagement.tsx` queries right now, including table names, filters, and whether `.select()` over-fetches.
   - Confirm whether staff/site dropdowns anywhere in these pages will break or show empty state gracefully once real (but currently zero) seed data exists — i.e. is there a proper empty state, or will it silently render nothing with no explanation?
   - If no `useStaff`/`useSites` hooks exist, write minimal versions (list + create + update, React Query pattern matching `useIncidents.ts`) sized only for what `StaffManagement.tsx` and `ClientManagement.tsx` currently need — not a full CRUD suite for later modules.

3. **Incidents — the core write path**
   - Trace "open an incident" end to end: which component triggers creation, what mutation runs, does it call `.select().single()` to return the new row, does it call `queryClient.invalidateQueries()` on success, is there a `toast.error()` on failure.
   - Confirm the incident's `site_id` and `assigned_staff_id` (or equivalent) fields are populated from real dropdowns backed by the sites/staff tables — not hardcoded or mock arrays.

4. **Alarms**
   - Same trace as incidents: creation/acknowledge/resolve mutations, error handling, cache invalidation.
   - Confirm `useAlarms.ts` doesn't reference any table/column from the unapplied `auto_dispatch_rules.sql` migration — if it does, that's a runtime error waiting to happen once this code ships before that migration is applied.

5. **Dispatch / Control Room**
   - This is likely the weakest link in the loop. Identify precisely which control-room components are wired to real Supabase queries vs static/mock data.
   - Trace "dispatch it" end to end: from an open incident, what UI action creates a `dispatch_requests` row (or equivalent), what table it hits, whether it's realtime-subscribed so other operators see it live.
   - If dispatch is currently mock-only, specify the minimal `useDispatch.ts` hook needed (create dispatch request, update status, subscribe to `dispatch_requests` realtime channel) — sized for this loop only.

6. **DOB**
   - Confirm `useDOBEntries.ts` doesn't already assume a `deleted_at` column that doesn't exist yet (would cause a runtime error, not just a missing feature).
   - Confirm whether incident/alarm creation auto-writes a DOB entry, or whether that integration doesn't exist yet — note it either way, don't build it unless it's required for the loop to feel real.

7. **Realtime + cleanup**
   - For every `supabase.channel()` call found in the 6 areas, confirm `supabase.removeChannel()` runs on unmount.

## Output Format

```markdown
## 1. Auth Flow — Confirmed Safe / Issues Found
## 2. Staff & Sites & Clients — Current State + Minimal Hooks Needed (with code)
## 3. Incidents — Trace + Fixes
## 4. Alarms — Trace + Fixes
## 5. Dispatch / Control Room — Trace + Minimal Hook Needed (with code)
## 6. DOB — Trace + Fixes
## 7. Realtime Cleanup Check
## 8. Deferred — Not Core (one-line mentions only)
```

Do not audit CIT, K9, CCTV, HR, Payroll, Compliance, War Room, Strategic Advisory, or Communications hooks/components even if encountered while browsing the file tree.
