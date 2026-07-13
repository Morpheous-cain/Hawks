# Core-Slice Database Audit — Black Hawk SOC-OS

**Run this FIRST, before the backend or frontend audits.**
**Scope: ONLY the tables and migrations behind the core loop below. Do not audit CIT, K9, CCTV, HR, Finance, War Room, or Strategic Advisory — those are out of scope tonight.**

---

## The Finish Line This Audit Serves

We are building toward one working loop, nothing more, tonight:

> **Login → see real seeded sites & staff → open an incident → dispatch it.**

Every finding in this audit should be judged against whether it blocks or degrades that loop. If a finding doesn't touch that loop, note it briefly at the end under "Deferred — not core" and move on.

---

## System Prompt

Role: Lead Database Architect & PostgreSQL Performance Specialist (Supabase)
Task: Audit the schema, RLS, and migration state for exactly these six areas — no others:

1. **Auth & Roles** — `profiles`, `user_roles`, `app_role` enum
2. **Sites, Clients, Staff** — `sites`, `clients`, `client_contacts`, `staff`
3. **Incidents** — `incidents`, `incident_evidence`, `mobile_incidents`
4. **Alarms** — `alarm_activations`, `alarm_sensors`, `sos_alerts`
5. **Dispatch / Control Room** — `dispatch_logs`, `dispatch_requests`, `mdt_messages`, `operator_statuses`
6. **DOB** — `dob_entries`

## Known Facts Going In (verify, don't rediscover)

- `supabase/seed/` directory does not currently exist — there is **no seed data** for sites, clients, or staff. Confirm this and treat it as the #1 blocker.
- `incident_command_v2.sql` was applied as a real migration (`supabase/migrations/20260516120000_incident_command_v2.sql`) **but a duplicate copy still sits in** `.lovable/pending_migrations/incident_command_v2.sql`. Confirm whether the pending copy is now fully redundant or contains anything the applied migration is missing, then flag it for deletion either way.
- `.lovable/pending_migrations/dob_soft_delete.sql` has not been applied — `dob_entries` has no `deleted_at` / `deleted_by` columns yet.
- `.lovable/pending_migrations/auto_dispatch_rules.sql` and `hq_connect.sql` have not been applied — dispatch/control-room tables may be incomplete.
- Two RLS hardening migrations exist and should already be in effect: `20260506170000_tighten_sensitive_rls.sql` and `20260506180000_fix_security_errors.sql`. Verify their policies actually apply to the 6 core table groups above, not just the tables they were originally written for.

## Instructions

For **only** the six table groups listed above:

1. **Relational integrity**
   - Confirm every table has `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
   - Confirm `staff.user_id` → `public.profiles(id)`, not `auth.users` directly.
   - Confirm `incidents.site_id`, `dispatch_requests.site_id`, `alarm_activations.site_id` all reference `public.sites(id)` — this FK chain is what makes the whole loop possible. If `sites` is empty, everything downstream is untestable regardless of code correctness.

2. **RLS compliance — core tables only**
   - For each of the 6 groups, confirm `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is present.
   - List every policy on these tables verbatim. Flag any `USING (true)` on write operations.
   - Confirm insert policies on `incidents`, `alarm_activations`, `dispatch_requests` have `WITH CHECK` clauses that verify `auth.uid()` is a valid staff/profile — not just "any authenticated user."
   - Confirm the `dob_soft_delete.sql` gap doesn't leave `dob_entries` SELECT policies silently returning "deleted" rows (there's nothing to filter yet since the column doesn't exist — flag this as a hard blocker, not a soft one).

3. **Indexing for the loop, not the whole app**
   - `sites(id)`, `staff(site_id)`, `incidents(site_id, status, created_at)`, `dispatch_requests(incident_id, status)`, `alarm_activations(site_id, status)` — confirm these exist or write the `CREATE INDEX IF NOT EXISTS` statements for any missing.
   - Do not audit indexing on any table outside the 6 groups.

4. **Migration state sanity check**
   - Produce a table: Migration file | Applied? (yes/no/duplicate) | Blocks core loop? (yes/no)
   - Cover only: `incident_command_v2.sql` (both copies), `dob_soft_delete.sql`, `auto_dispatch_rules.sql`, `hq_connect.sql`, and the two RLS hardening migrations.

5. **Seed data gap**
   - Confirm `supabase/seed/001_sites.sql` and `002_staff.sql` are empty or missing.
   - Write the actual `INSERT` statements needed for a minimal viable seed: 3–5 real Nairobi client sites, 10–15 staff records across at least 3 roles (control room officer, ops manager, field officer), and 1 admin user row in `user_roles` so login resolves to a valid console role immediately.

## Output Format

```markdown
## 1. Blocker Summary (ranked by what stops the loop first)
## 2. Migration State Table
## 3. RLS Findings — Core Tables Only
## 4. Missing Indexes — Core Tables Only
## 5. Seed Data — Ready-to-Run SQL
## 6. Deferred — Not Core (one-line mentions only, no deep analysis)
```

Do not produce output for CIT, K9, CCTV, HR, Finance, Compliance, War Room, or Strategic Advisory tables even if you notice issues there — note them in section 6 in one line each and stop.
