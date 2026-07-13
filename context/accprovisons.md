# Account Provisions & Session Synthesis — Alpha Pride Security / Black Hawk SOC-OS

**Date:** 2026-07-12
**Scope:** Consolidated project state, audit findings (Frontend + Database), and pending blockers for core-loop completion (login → sites/staff → incident → dispatch).

---

## 1. Executive Summary
Core loop is currently broken. Login works, but the path from login to functional incident dispatch is blocked by missing seed data, unapplied migrations, and inert UI actions.

---

## 2. Critical Blocking Bugs

### Frontend (Source-verified)
1. **`ManagementPortalHome.tsx:14-45` (Routing dead-end):** Role map omits 5 of 8 canonical DB `app_role` enums (`administrator`, `bdo`, `hr_custodian`, `operations_supervisor`, `control_room_officer`). Landing "Open Console" bounces these roles to `/auth`. No `useAuth().userRole` fallback.
2. **`DispatchFleetControl.tsx:168` (Dispatch button inert):** Dispatch button has no `onClick`. Track/Contact also dead. Loop terminates here.

### Database (Source-verified, audit 2026-07-12)
1. **`supabase/seed/` missing:** Sites/clients/staff tables empty. Entire FK chain downstream untestable.
2. **`dob_soft_delete.sql` unapplied:** `dob_entries` lacks `deleted_at`/`deleted_by`.
3. **`dispatch_requests` missing `site_id` FK:** Dispatch cannot link to site; loop breaks.
4. **`auto_dispatch_rules.sql` unapplied:** No alarm→dispatch automation.
5. **`hq_connect.sql` unapplied:** Guard↔HQ comms, directives, backup requests missing.
6. **RLS `INSERT` gaps:** `incidents`, `alarm_activations`, `dispatch_requests` lack `WITH CHECK` clauses verifying `auth.uid()` against `profiles`.
7. **Redundant pending migration:** `incident_command_v2.sql` exists in both `supabase/migrations/` (applied) and `.lovable/pending_migrations/` (delete the latter).

---

## 3. Auth & Deployment Status

- **Auth race condition:** Fixed via `RequireRole.tsx` wait-for-role spinner guard (commits `50096b4`, `02f70f3`).
- **`hr_custodian` missing:** Still excluded from `CONSOLE_ROLES` in `RequireRole.tsx` (intentional until HR UI wired).
- **`PendingActivation.tsx` 0 bytes:** Users with no `user_roles` row spin forever. Route `/pending-activation` not wired. Needs 5s timeout → redirect.
- **Production (blackhawk.com):** 6 blockers in DEPLOYMENT_FIXES.md. Critical: add authorized redirect URLs (`https://blackhawk.com` + `/auth` + www), ensure HTTPS, create `handle_new_user()` trigger for profiles. Scroll fix deployed.

---

## 4. Pending Migrations / Next Steps

### Phase 6 (Pending)
Evidence Vault hardening, Training Drill Simulator, White-label client portal. `evidence_access_log`, `training_drills` + `drill_runs` (4 seed drills), `client_branding`. Apply via Lovable Cloud SQL Editor.

### Phase 7 (Pending)
Tenants, `audit_log`, `user_presence`, `auto_dispatch_rules`, `welfare_check_ins`, `false_alarm_log`. Solves `audit_trail` 403 blocker.

### Next Priority
1. Apply pending migrations (Phase 6/7 + dob/hq/dispatch).
2. Run Database `supabase/seed/` SQL (to be written) to populate core sites/staff/clients.
3. Rerun backend CORE audit (02-backend-audit-CORE failed due to rate limit).
4. Apply the 2 frontend blocker fixes + secondary UI batch (isPending, permission gating, scroll, error toasts).
