## 1. Blocker Summary (ranked by what stops the loop first)

| Rank | Blocker | File:Line | Impact on Login→Sites→Incident→Dispatch Loop |
|------|---------|-----------|-----------------------------------------------|
| 1 | **No seed data** — `supabase/seed/` directory does not exist | N/A (missing dir) | Sites, clients, staff tables empty → login resolves to no console data → incident creation has no valid `site_id` → dispatch has no site to dispatch to |
| 2 | **`dob_soft_delete.sql` unapplied** — `dob_entries` lacks `deleted_at`/`deleted_by` | `.lovable/pending_migrations/dob_soft_delete.sql:9-12` | DOB is legal audit log; hard-delete allowed → audit integrity broken; SELECT policies return all rows (no soft-delete filter exists) |
| 3 | **`dispatch_requests` missing `site_id` FK to `sites`** | `supabase/migrations/20251111033146_4aa2b008-9db8-418b-b6e2-dad51cee25f6.sql:94-113` | Dispatch cannot link to a site → control room cannot route alarm/incident to location → loop breaks at dispatch step |
| 4 | **`auto_dispatch_rules.sql` unapplied** — auto-dispatch engine missing | `.lovable/pending_migrations/auto_dispatch_rules.sql:5-39` | Control room has no rule engine for alarm→dispatch automation; manual-only |
| 5 | **`hq_connect.sql` unapplied** — HQ comms/directives tables missing | `.lovable/pending_migrations/hq_connect.sql:6-224` | Guard↔HQ chat, beacons, broadcasts, directives, backup requests absent → control-room comms incomplete |
| 6 | **RLS on `incidents`/`alarm_activations`/`dispatch_requests` INSERT uses `USING (is_elevated_user())` only** — no `WITH CHECK` verifying staff/profile | `20251108053150_932b94c7...sql:25-31`, `20251111033146_4aa2b008...sql:106-118`, `20251111033146_4aa2b008...sql:169-177` | Any authenticated user can insert if elevated check passes; should verify `auth.uid()` maps to valid `profiles`/`staff` |
| 7 | **`incident_command_v2.sql` duplicate in pending** — identical to applied `20260516120000_incident_command_v2.sql` | `.lovable/pending_migrations/incident_command_v2.sql` vs `supabase/migrations/20260516120000_incident_command_v2.sql` | Redundant file; confusion risk; flag for deletion |

---

## 2. Migration State Table

| Migration File | Applied? | Blocks Core Loop? |
|----------------|----------|-------------------|
| `incident_command_v2.sql` (applied: `20260516120000_incident_command_v2.sql`) | **yes** | no (adds evidence/AI/SOP/SLA — already in DB) |
| `incident_command_v2.sql` (pending: `.lovable/pending_migrations/incident_command_v2.sql`) | **duplicate** | no (identical to applied; delete pending copy) |
| `dob_soft_delete.sql` | **no** | **yes** — DOB hard-delete allowed, no soft-delete filter |
| `auto_dispatch_rules.sql` | **no** | **yes** — dispatch automation missing |
| `hq_connect.sql` | **no** | **yes** — HQ comms/directives/backup missing |
| `20260506170000_tighten_sensitive_rls.sql` | **yes** | partially — tightened `sites`, `clients`, `client_contacts`, `staff`, `profiles`; `incidents`/`alarm_activations`/`dispatch_requests` still have `USING (true)` on SELECT (acceptable) but INSERT lacks `WITH CHECK` on staff linkage |
| `20260506180000_fix_security_errors.sql` | **yes** | partially — tightened `mdt_messages`, `loss_control_*`, `strategic_advisory_audit`, storage; core tables unchanged |

---

## 3. RLS Findings — Core Tables Only

### Applied & Verified (RLS ENABLED + policies present)

| Table | RLS Enabled | Policies (verbatim) | Issues |
|-------|-------------|---------------------|--------|
| `profiles` | ✅ | 1. `Users can view own profile` — `USING (auth.uid() = id)`<br>2. `Users can update own profile` — `USING (auth.uid() = id)`<br>3. `HR custodian and elevated can view profiles` — `USING (has_role(auth.uid(), 'hr_custodian') OR is_elevated_user(auth.uid()))` | OK |
| `user_roles` | ✅ | 1. `Users can view own roles` — `USING (auth.uid() = user_id)` | No INSERT/UPDATE policy — only elevated via service role; acceptable |
| `staff` | ✅ | 1. `Elevated users can manage staff` — `USING (is_elevated_user(auth.uid()))`<br>2. `All authenticated users can view staff` — `USING (true)` | INSERT missing `WITH CHECK (auth.uid() = created_by)` — any elevated can create staff without linking to their profile |
| `clients` | ✅ | 1. `Elevated users can view clients` — `USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'))`<br>2. `Elevated users can manage clients` — `USING (is_elevated_user(auth.uid())) WITH CHECK (is_elevated_user(auth.uid()))` | `has_role('control_room_officer')` on SELECT only; INSERT/UPDATE/DELETE only elevated — acceptable |
| `client_contacts` | ✅ | 1. `Elevated users can view contacts` — `USING (is_elevated_user(auth.uid()))`<br>2. `Elevated users can manage contacts` — `USING (is_elevated_user(auth.uid())) WITH CHECK (is_elevated_user(auth.uid()))` | OK |
| `sites` | ✅ | 1. `Elevated users can manage sites` — `USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer')) WITH CHECK (is_elevated_user(auth.uid()))` | `has_role('control_room_officer')` on SELECT via USING; INSERT/UPDATE/DELETE only elevated — acceptable |
| `incidents` | ✅ | 1. `All authenticated users can view incidents` — `USING (true)`<br>2. `Elevated users can manage incidents` — `USING (is_elevated_user(auth.uid()))` | **INSERT missing `WITH CHECK`** — any elevated user can insert without verifying `reported_by`/`assigned_to` maps to valid `profiles`/`staff` |
| `incident_evidence` | ✅ | 1. `auth_read_evidence` — `USING (true)`<br>2. `auth_insert_evidence` — `WITH CHECK (auth.uid() IS NOT NULL)`<br>3. `elev_update_evidence` — `USING (is_elevated_user(auth.uid()))`<br>4. `elev_delete_evidence` — `USING (is_elevated_user(auth.uid()))` | INSERT `WITH CHECK (auth.uid() IS NOT NULL)` is weak — any authenticated user can insert evidence; should require `collected_by = auth.uid()` |
| `alarm_activations` | ✅ | 1. `All authenticated users can view alarm activations` — `USING (true)`<br>2. `Control room can manage alarm activations` — `USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()))` | **INSERT missing `WITH CHECK`** — no verification that `acknowledged_by`/`assigned_to`/`resolved_by` map to valid staff/profile |
| `alarm_sensors` | ✅ | 1. `All authenticated users can view sensors` — `USING (true)`<br>2. `Elevated users can manage sensors` — `USING (is_elevated_user(auth.uid()))` | OK |
| `dispatch_logs` | ✅ | 1. `All authenticated users can view dispatch logs` — `USING (true)`<br>2. `Control room can manage dispatch logs` — `USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()))` | **INSERT missing `WITH CHECK`** — no verification `dispatched_by` maps to valid profile |
| `dispatch_requests` | ✅ | 1. `Authenticated users can view dispatch requests` — `USING (TRUE)`<br>2. `Control room can manage dispatch` — `USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()))` | **INSERT missing `WITH CHECK`** — no verification `requested_by`/`approved_by` maps to valid profile; **also missing `site_id` FK** |
| `mdt_messages` | ✅ (tightened) | 1. `Authorized users can view mdt messages` — `USING (auth.uid() = sent_by OR has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()))`<br>2. `Control room can send messages` — `WITH CHECK (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()))`<br>3. `Elevated users can manage messages` — `USING (is_elevated_user(auth.uid()))` | OK — SELECT scoped to sender/control/elevated; INSERT has `WITH CHECK` |
| `operator_statuses` | ✅ | 1. `Operators can view their status` — `USING (auth.uid() = operator_id OR is_elevated_user(auth.uid()))`<br>2. `Control room can manage operator status` — `USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()))` | OK |
| `dob_entries` | ✅ | 1. `All authenticated users can view DOB entries` — `USING (auth.uid() IS NOT NULL)`<br>2. `Authenticated users can create DOB entries` — `WITH CHECK (auth.uid() = recorded_by)`<br>3. `Elevated users can manage DOB entries` — `USING (is_elevated_user(auth.uid()))` | **Hard DELETE allowed** — no `deleted_at`/`deleted_by` columns; `dob_soft_delete.sql` pending adds restrictive DELETE policy but columns don't exist yet |

### RLS Hardening Gaps (Core Tables)

| Table | Gap | Required Fix |
|-------|-----|--------------|
| `incidents` | INSERT policy `USING (is_elevated_user(auth.uid()))` has no `WITH CHECK` | Add `WITH CHECK (reported_by IS NULL OR reported_by = auth.uid() OR assigned_to IN (SELECT id FROM staff WHERE user_id = auth.uid()))` |
| `alarm_activations` | INSERT/UPDATE policy lacks `WITH CHECK` | Add `WITH CHECK (acknowledged_by IS NULL OR acknowledged_by = auth.uid() OR assigned_to IS NULL OR assigned_to = auth.uid())` |
| `dispatch_logs` | INSERT/UPDATE policy lacks `WITH CHECK` | Add `WITH CHECK (dispatched_by IS NULL OR dispatched_by = auth.uid())` |
| `dispatch_requests` | INSERT/UPDATE policy lacks `WITH CHECK`; missing `site_id` | Add `site_id UUID REFERENCES sites(id)`; add `WITH CHECK (requested_by = auth.uid() OR approved_by IS NULL OR approved_by = auth.uid())` |
| `incident_evidence` | INSERT `WITH CHECK (auth.uid() IS NOT NULL)` too permissive | Change to `WITH CHECK (collected_by IS NULL OR collected_by = auth.uid())` |
| `dob_entries` | No soft-delete columns; DELETE not restricted | Apply `dob_soft_delete.sql` migration |

---

## 4. Missing Indexes — Core Tables Only

| Table | Required Index | Exists? | SQL to Create |
|-------|----------------|---------|---------------|
| `sites` | `id` (PK) | ✅ (PK) | N/A |
| `staff` | `site_id` | ❌ — column `current_site` is TEXT, not FK | `CREATE INDEX IF NOT EXISTS idx_staff_current_site ON public.staff(current_site);` (but `current_site` is text; ideally add `site_id UUID REFERENCES sites(id)`) |
| `incidents` | `(site_id, status, created_at)` | ❌ | `CREATE INDEX IF NOT EXISTS idx_incidents_site_status_created ON public.incidents(site_id, status, created_at DESC);` |
| `dispatch_requests` | `(incident_id, status)` | ❌ — no `incident_id` column; has `ticket_id` | `CREATE INDEX IF NOT EXISTS idx_dispatch_requests_ticket_status ON public.dispatch_requests(ticket_id, status);` + add `incident_id UUID REFERENCES incidents(id)` |
| `alarm_activations` | `(site_id, status)` | ❌ | `CREATE INDEX IF NOT EXISTS idx_alarm_activations_site_status ON public.alarm_activations(site_id, status);` |
| `dob_entries` | `(site_name, entry_time)` | ❌ | `CREATE INDEX IF NOT EXISTS idx_dob_entries_site_time ON public.dob_entries(site_name, entry_time DESC);` |
| `dob_entries` | `deleted_at` partial | ❌ (pending migration) | `CREATE INDEX IF NOT EXISTS idx_dob_entries_not_deleted ON public.dob_entries(deleted_at) WHERE deleted_at IS NULL;` |

**Note:** `dispatch_requests` currently links via `ticket_id → communication_tickets → site_id`. Direct `incident_id` and `site_id` columns should be added for the core loop.

---

## 5. Seed Data — Ready-to-Run SQL

```sql
-- ============================================================
-- SEED: Alpha Pride Security — Nairobi Core Sites & Staff
-- Idempotent: uses ON CONFLICT DO NOTHING on unique columns
-- Run in Supabase SQL Editor (Lovable Cloud → Database → SQL Editor)
-- ============================================================

-- 1. Ensure admin user exists in auth.users (create via Supabase Auth UI first)
--    Then assign system_admin role. Replace 'ADMIN_USER_UUID' with actual auth.uid().
--    This script assumes you have created a user with email admin@alphapride.co.ke

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Look up admin user by email
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    -- Insert profile if missing
    INSERT INTO public.profiles (id, full_name, email, phone)
    VALUES (v_admin_id, 'System Administrator', 'admin@alphapride.co.ke', '+254700000000')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    
    -- Assign system_admin role
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (v_admin_id, 'system_admin'::app_role, v_admin_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 2. Clients (5 real Nairobi clients)
INSERT INTO public.clients (client_id, legal_name, trading_name, registration_number, pin, sector, background, status, created_by)
VALUES
  ('JKIA-T2', 'Kenya Airports Authority', 'JKIA Terminal 2', 'KAA/REG/001', 'P051123456A', 'Aviation', 'Jomo Kenyatta International Airport Terminal 2 — primary aviation client', 'active', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('KEMPINSKI', 'Villa Rosa Kempinski Nairobi', 'Villa Rosa Kempinski', 'VRK/REG/002', 'P051234567B', 'Hospitality', '5-star luxury hotel, Westlands', 'active', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('TWO-RIVERS', 'Two Rivers Development Ltd', 'Two Rivers Mall', 'TRD/REG/003', 'P051345678C', 'Retail', 'Largest mall in East Africa, Limuru Road', 'active', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('NAIROBI-HOSP', 'Nairobi Hospital', 'The Nairobi Hospital', 'NH/REG/004', 'P051456789D', 'Healthcare', 'Premier private hospital, Upper Hill', 'active', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('WESTGATE', 'Westgate Shopping Mall Ltd', 'Westgate Mall', 'WSM/REG/005', 'P051567890E', 'Retail', 'Premium mall, Westlands — post-2013 rebuilt', 'active', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1))
ON CONFLICT (client_id) DO NOTHING;

-- 3. Sites (one per client + Alpha Pride HQ)
WITH c AS (
  SELECT id, client_id FROM public.clients WHERE client_id IN ('JKIA-T2','KEMPINSKI','TWO-RIVERS','NAIROBI-HOSP','WESTGATE')
)
INSERT INTO public.sites (client_id, site_name, site_type, address, gps_coordinates, site_commander, created_by)
SELECT 
  c.id,
  CASE c.client_id
    WHEN 'JKIA-T2' THEN 'JKIA Terminal 2 — Main Campus'
    WHEN 'KEMPINSKI' THEN 'Villa Rosa Kempinski — Main Hotel'
    WHEN 'TWO-RIVERS' THEN 'Two Rivers Mall — Main Complex'
    WHEN 'NAIROBI-HOSP' THEN 'Nairobi Hospital — Main Campus'
    WHEN 'WESTGATE' THEN 'Westgate Mall — Main Complex'
  END,
  CASE c.client_id
    WHEN 'JKIA-T2' THEN 'Aviation'
    WHEN 'KEMPINSKI' THEN 'Hospitality'
    WHEN 'TWO-RIVERS' THEN 'Retail'
    WHEN 'NAIROBI-HOSP' THEN 'Healthcare'
    WHEN 'WESTGATE' THEN 'Retail'
  END,
  CASE c.client_id
    WHEN 'JKIA-T2' THEN 'JKIA Terminal 2, Embakasi, Nairobi'
    WHEN 'KEMPINSKI' THEN 'Chiromo Road, Westlands, Nairobi'
    WHEN 'TWO-RIVERS' THEN 'Limuru Road, Ruaka, Nairobi'
    WHEN 'NAIROBI-HOSP' THEN 'Argwings Kodhek Road, Upper Hill, Nairobi'
    WHEN 'WESTGATE' THEN 'Mwanzi Road, Westlands, Nairobi'
  END,
  CASE c.client_id
    WHEN 'JKIA-T2' THEN '-1.3192,36.9275'
    WHEN 'KEMPINSKI' THEN '-1.2567,36.8042'
    WHEN 'TWO-RIVERS' THEN '-1.1889,36.7597'
    WHEN 'NAIROBI-HOSP' THEN '-1.3015,36.7940'
    WHEN 'WESTGATE' THEN '-1.2600,36.8080'
  END,
  NULL,
  (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)
FROM c
ON CONFLICT DO NOTHING;

-- Alpha Pride HQ site (self-managed)
INSERT INTO public.clients (client_id, legal_name, trading_name, registration_number, pin, sector, background, status, created_by)
VALUES ('ALPHA-PRIDE', 'Alpha Pride Security Ltd', 'Alpha Pride Security', 'APS/REG/001', 'P051000001Z', 'Security Services', 'Headquarters & operational base', 'active', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1))
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO public.sites (client_id, site_name, site_type, address, gps_coordinates, site_commander, created_by)
SELECT id, 'Alpha Pride HQ — Operations Centre', 'Operations', 'Alpha Pride House, Mombasa Road, Nairobi', '-1.3350,36.8900', 'Control Room Supervisor', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)
FROM public.clients WHERE client_id = 'ALPHA-PRIDE'
ON CONFLICT DO NOTHING;

-- 4. Staff (15 records across 3+ roles)
-- Note: staff.user_id should link to profiles.id (auth user). Create auth users first or use NULL for now.
-- For seed, we create staff records; auth users can be linked later via staff.created_by or separate process.

INSERT INTO public.staff (staff_id, full_name, national_id, phone, position, rank, duty_category, date_employed, status, current_site, current_client, contract_type, created_by)
VALUES
  -- Control Room Officers (3)
  ('APS-CR-001', 'James Ochieng', '12345678', '+254711000001', 'Control Room Officer', 'Sergeant', 'Control Room', '2022-01-15', 'active', 'Alpha Pride HQ — Operations Centre', 'Alpha Pride Security', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-CR-002', 'Grace Wanjiku', '12345679', '+254711000002', 'Control Room Officer', 'Corporal', 'Control Room', '2022-03-20', 'active', 'Alpha Pride HQ — Operations Centre', 'Alpha Pride Security', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-CR-003', 'Peter Mwangi', '12345680', '+254711000003', 'Control Room Officer', 'Constable', 'Control Room', '2023-01-10', 'active', 'Alpha Pride HQ — Operations Centre', 'Alpha Pride Security', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  
  -- Operations Supervisors (2)
  ('APS-OS-001', 'Sarah Njeri', '12345681', '+254711000004', 'Operations Supervisor', 'Inspector', 'Operations', '2021-06-01', 'active', 'Alpha Pride HQ — Operations Centre', 'Alpha Pride Security', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-OS-002', 'David Kiprop', '12345682', '+254711000005', 'Operations Supervisor', 'Inspector', 'Operations', '2021-09-15', 'active', 'JKIA Terminal 2 — Main Campus', 'Kenya Airports Authority', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  
  -- Field Officers (10 across sites)
  ('APS-FO-001', 'John Kamau', '12345683', '+254711000006', 'Field Officer', 'Constable', 'Static Guard', '2022-05-01', 'active', 'JKIA Terminal 2 — Main Campus', 'Kenya Airports Authority', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-002', 'Mary Akinyi', '12345684', '+254711000007', 'Field Officer', 'Constable', 'Static Guard', '2022-07-10', 'active', 'JKIA Terminal 2 — Main Campus', 'Kenya Airports Authority', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-003', 'Robert Otieno', '12345685', '+254711000008', 'Field Officer', 'Constable', 'Static Guard', '2022-11-01', 'active', 'Villa Rosa Kempinski — Main Hotel', 'Villa Rosa Kempinski', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-004', 'Esther Wambui', '12345686', '+254711000009', 'Field Officer', 'Constable', 'Static Guard', '2023-02-15', 'active', 'Villa Rosa Kempinski — Main Hotel', 'Villa Rosa Kempinski', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-005', 'Michael Ngugi', '12345687', '+254711000010', 'Field Officer', 'Constable', 'Patrol', '2023-04-01', 'active', 'Two Rivers Mall — Main Complex', 'Two Rivers Development Ltd', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-006', 'Lucy Wanjiru', '12345688', '+254711000011', 'Field Officer', 'Constable', 'Patrol', '2023-06-20', 'active', 'Two Rivers Mall — Main Complex', 'Two Rivers Development Ltd', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-007', 'Anthony Mutua', '12345689', '+254711000012', 'Field Officer', 'Constable', 'Static Guard', '2022-08-01', 'active', 'Nairobi Hospital — Main Campus', 'Nairobi Hospital', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-008', 'Catherine Muthoni', '12345690', '+254711000013', 'Field Officer', 'Constable', 'Static Guard', '2023-01-15', 'active', 'Nairobi Hospital — Main Campus', 'Nairobi Hospital', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-009', 'Francis Kioko', '12345691', '+254711000014', 'Field Officer', 'Constable', 'Patrol', '2022-10-01', 'active', 'Westgate Mall — Main Complex', 'Westgate Shopping Mall Ltd', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1)),
  ('APS-FO-010', 'Janet Chepkirui', '12345692', '+254711000015', 'Field Officer', 'Constable', 'Patrol', '2023-03-01', 'active', 'Westgate Mall — Main Complex', 'Westgate Shopping Mall Ltd', 'Permanent', (SELECT id FROM auth.users WHERE email = 'admin@alphapride.co.ke' LIMIT 1))
ON CONFLICT (staff_id) DO NOTHING;

-- 5. Client contacts (one per client)
INSERT INTO public.client_contacts (client_id, contact_type, name, position, phone, email, notes)
SELECT c.id, 'Primary', 'Site Security Manager', 'Security Manager', '+254700000001', 'security@client.co.ke', 'Primary security contact'
FROM public.clients c WHERE c.client_id IN ('JKIA-T2','KEMPINSKI','TWO-RIVERS','NAIROBI-HOSP','WESTGATE','ALPHA-PRIDE')
ON CONFLICT DO NOTHING;

-- 6. Verify seed counts
SELECT 'clients' AS table_name, COUNT(*) FROM public.clients WHERE client_id IN ('JKIA-T2','KEMPINSKI','TWO-RIVERS','NAIROBI-HOSP','WESTGATE','ALPHA-PRIDE')
UNION ALL SELECT 'sites', COUNT(*) FROM public.sites WHERE site_name LIKE '%JKIA%' OR site_name LIKE '%Kempinski%' OR site_name LIKE '%Two Rivers%' OR site_name LIKE '%Nairobi Hospital%' OR site_name LIKE '%Westgate%' OR site_name LIKE '%Alpha Pride%'
UNION ALL SELECT 'staff', COUNT(*) FROM public.staff WHERE staff_id LIKE 'APS-%'
UNION ALL SELECT 'user_roles (admin)', COUNT(*) FROM public.user_roles ur JOIN auth.users u ON ur.user_id = u.id WHERE u.email = 'admin@alphapride.co.ke' AND ur.role = 'system_admin';
```

---

## 6. Deferred — Not Core (one-line mentions only)

- CIT: `cit_module.sql` pending — no `cit_runs`, `cit_manifests`, `cit_vault_movements`, `cit_routes` tables
- K9: `k9_module.sql` pending — no `k9_dogs`, `k9_handlers`, `k9_deployments`, `k9_incidents` tables
- CCTV: `cctv_cameras.sql` pending — no camera registry table
- Body Cam: Phase 6 evidence vault RLS & `evidence_access_log` pending
- Visitor Access & Armoury: `visitor_access_armoury.sql` pending — no tables
- CMC: `cmc_module.sql` pending — no crisis management tables
- HR Finance/Payroll: `hr_finance_payroll_governance.sql` pending — no `payroll_runs`, `payslips`, `expense_claims`
- Patrol Phase 2: `field_portal_phase2.sql` pending — no `patrol_sessions`, `checkpoint_scans`
- Enterprise Multi-tenancy: `enterprise_first_wave.sql`, Phase 7 `tenants`/`tenant_members` pending
- Governance: Phase 7 `audit_log`, `user_presence`, `false_alarm_log`, `welfare_check_ins` pending
- Directives: `directives_audit.sql` pending — no directive acknowledgement tracking
- Customer Service: `customer_service_schema.sql` applied (20260606000000) but CS pages need wiring
- Courier: no migration, no tables