# CLAUDE_OPERATIONS.md — Detailed Schema, Status & Build Order

> **Read `CLAUDE.md` first** — this file contains the detailed operational sections extracted to keep CLAUDE.md under 30k chars.
>
> Source: extracted from original `CLAUDE.md`. Full original at `CLAUDE_ARCHIVE.md`.

---

## DATABASE SCHEMA

### Applied Tables (75 total — in `supabase/types.ts`)
```
AUTHENTICATION:   profiles, user_roles
STAFF:            staff, schedules, attendance, leave_records, staff_certifications
SITES/CLIENTS:    sites, clients, client_contacts, client_finances, contracts
INCIDENTS:        incidents, incident_evidence, mobile_incidents
PATROLS:          patrols, patrol_checkpoints, mobile_patrols, welfare_events
ALARMS:           alarm_activations, alarm_sensors, sos_alerts
DOB:              dob_entries
DISPATCH/MDT:     dispatch_logs, dispatch_requests, mdt_messages, operator_statuses
COMMS:            calls, comms_records, sms_messages, whatsapp_messages,
                  communication_tickets, support_tickets
BODY CAM:         body_cam_clips, body_cam_devices, body_cam_footage,
                  clip_chain_of_custody, device_assignment_log
INVESTIGATIONS:   investigation_attachments
LOSS CONTROL:     loss_control_records, loss_control_behavior_patterns,
                  loss_control_corrective_actions, loss_control_escalations,
                  loss_control_risk_scores
CIT:              crew_members (+ cit_module.sql pending)
TECHNICAL:        technical_client_sites, technical_equipment, technical_inspections,
                  technical_maintenance_schedules, technical_performance_metrics,
                  technical_risk_assessments, technical_service_history,
                  technical_work_orders
FLEET:            vehicles
DOCUMENTS:        documents, document_access_logs
TRAINING:         training_programs, training_records, training_sessions
REPORTING:        reports, risk_assessments, shift_logs, status_history
CUSTOMER SERVICE: client_complaints, cs_categories
ADVISORY:         strategic_advisories, strategic_advisory_audit, advisory_history
GOVERNANCE:       audit_trail, tasks
EVENTS:           event_staff_assignments, security_events
MISC:             checkpoints, dispatch_logs, reports
```

### Key DB Conventions
```sql
-- All primary keys are UUIDs:
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- All timestamps:
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- Foreign keys follow pattern:
client_id UUID REFERENCES public.clients(id)
site_id UUID REFERENCES public.sites(id)
staff_id UUID REFERENCES public.staff(id)   -- operational reference
user_id UUID REFERENCES public.profiles(id) -- auth user reference

-- RLS helpers (always use these in policies):
public.has_role(auth.uid(), 'ceo'::app_role)      -- exact role check
public.is_elevated_user(auth.uid())                -- ceo/coo/ops_supervisor/system_admin
```

### Pending Migrations (in `.lovable/pending_migrations/` — NOT YET APPLIED)

| File | Purpose |
|------|---------|
| `cit_module.sql` | CIT runs, manifests, vault, routes tables |
| `k9_module.sql` | K9 dog/handler/deployment/incident tables |
| `visitor_access_armoury.sql` | Visitor pre-clearance, badge log, armoury custody chain |
| `cmc_module.sql` | Crisis Management Centre activation, decisions, resources |
| `field_portal_phase2.sql` | Field officer mobile portal enhancements |
| `hq_connect.sql` | HQ-to-branch comms and directives |
| `hr_finance_payroll_governance.sql` | Payroll runs, payslips, expense claims, statutory |
| `incident_command_v2.sql` | Incident command structure, task assignment |
| `auto_dispatch_rules.sql` | Auto-dispatch rule engine tables |
| `cctv_cameras.sql` | Camera registry, zones, recording schedules |
| `dob_soft_delete.sql` | Soft delete for DOB entries |
| `enterprise_first_wave.sql` | Multi-branch/entity structures |
| `directives_audit.sql` | Directive log and acknowledgement tracking |

### Phase 6 + Phase 7 (Written, Needs Deploy)

**Phase 6** (`PHASE6_MIGRATION.md`): evidence vault RLS, `evidence_access_log`, `training_drills`, `drill_runs`, `client_branding`.

**Phase 7** (`PHASE7_MIGRATION.md`): `tenants`, `tenant_members`, `audit_log`, `user_presence`, `auto_dispatch_rules`, `welfare_check_ins`, `false_alarm_log`.

Apply both via Lovable Cloud → SQL Editor.

---

## EDGE FUNCTIONS

In `supabase/functions/` — Deno TypeScript, call OpenAI. Need deploy + `OPENAI_API_KEY` secret.

| Function | Lines | Status |
|----------|-------|--------|
| `copilot-assistant` | 287 | Written |
| `generate-briefing` | 229 | Written |
| `strategic-advisory` | 185 | Written |
| `threat-analysis` | 190 | Written |
| `patrol-anomaly-detection` | 176 | Written |
| `incident-ai-summary` | 122 | Written |
| `shift-briefing` | 122 | Written |
| `risk-forecast` | 80 | Written |
| `evidence-sign-url` | — | Written |
| `attendance-anomaly-detection` | — | Written |
| `public-api` | 54 | Written |
| `create-user-account` | — | Written |
| `fetch-advisories` | — | Written |
| `training-drill-inject` | — | Written |

---

## MODULE STATUS MATRIX (Built vs Missing)

**Legend:** ✅ DONE | 🟡 UI DONE (partial backend) | 🔴 STUB (UI shell) | ❌ MISSING (no DB tables)

### Core Auth & Platform
| Module | Status | Notes |
|--------|--------|-------|
| Auth (login/logout) | ✅ | Race-condition safe, global signout |
| `user_roles` assignment | 🟡 | No admin UI to assign roles |
| `pending_activation` flow | 🔴 | Page is empty (0 bytes) |
| Workspace shell / sidebar | ✅ | `WorkspaceShell.tsx` |
| `RequireRole` guard | ✅ | All console routes protected |
| `accessControl.ts` matrix | ✅ | Full permission matrix |

### Operations Core
| Module | Status | Notes |
|--------|--------|-------|
| Incidents | ✅ | 1746 lines, `useIncidents` (344 lines) |
| Alarms | 🟡 | 428 lines, needs Phase 7 |
| DOB | 🟡 | 340 lines, needs `dob_soft_delete.sql` |
| Control Room | 🟡 | 328 lines, dispatch not wired |
| MDT Management | 🟡 | Needs real dispatch tables |
| Patrol Suite | 🟡 | 72-line shell, sub-pages need hooks |
| GPS Patrol Tracking | 🔴 | No real GPS hooks |
| Supervision Patrol | 🔴 | Needs patrol data hooks |
| Field App | 🟡 | Needs `field_portal_phase2.sql` |

### Security Operations
| Module | Status | Notes |
|--------|--------|-------|
| CCTV | 🟡 | 205 lines, `CCTVOperatorConsole` 434 lines, no camera table |
| Body Cam | 🟡 | 58-line shell + 4 components, needs Phase 6 |
| Access Control | 🟡 | 187 lines, needs visitor/armoury migration |
| Visitor Access | 🔴 | No DB tables |
| Armoury Custody | 🔴 | No DB tables |
| Loss Control | 🟡 | 236 lines, tables exist |
| Escort Operations | 🟡 | 496 lines, needs hooks |
| K9 | 🔴 | 367 lines UI, `k9_module.sql` not written |
| Event Security | ✅ | 1060 lines |
| Investigations | ✅ | 1746 lines |
| War Room / CMC | 🔴 | 198 lines UI, `cmc_module.sql` not written |

### People & HR
| Module | Status | Notes |
|--------|--------|-------|
| Staff Management | 🟡 | 353 lines |
| HR Suite (tab shell) | 🟡 | 88 lines |
| HR Recruitment | 🔴 | 149 lines UI |
| HR Onboarding | 🔴 | 135 lines UI |
| HR Attendance | 🔴 | 163 lines UI |
| HR Performance | 🔴 | 131 lines UI |
| HR Disciplinary | 🔴 | 125 lines UI |
| Staff Scheduling | 🟡 | Redirects to HR Suite |
| Leave Management | 🟡 | Redirects to HR Suite |
| Field Officers | 🟡 | Redirects to HR Suite |
| Training Management | 🟡 | 251 lines, tables exist |
| Training Drills | 🟡 | Needs Phase 6 |

### Finance
| Module | Status | Notes |
|--------|--------|-------|
| Billing & Invoicing | ✅ | 1220 lines |
| Payroll Runs | 🔴 | 129 lines UI |
| Payslips | 🔴 | 88 lines UI |
| Expenses | 🔴 | 139 lines UI |
| Statutory Returns | 🔴 | 81 lines UI |
| Finance Dashboard | 🟡 | 390 lines |

### Clients & Contracts
| Module | Status | Notes |
|--------|--------|-------|
| Client Management | 🟡 | 327 lines |
| Client Detail | 🟡 | Needs full wiring |
| Client Portal | 🟡 | Multiple sub-pages |

### Specialised Departments
| Module | Status | Notes |
|--------|--------|-------|
| CIT | 🔴 | 632 lines UI, `cit_module.sql` not written |
| Courier | 🔴 | 3 pages, no DB tables |
| Communications | 🟡 | 73-line shell, 8 sub-components |
| Technical Security (TIMU) | 🟡 | 88 lines, 7 components, tables exist |

### Intelligence & Advisory
| Module | Status | Notes |
|--------|--------|-------|
| Strategic Advisory (RTSI) | 🟡 | 311 lines, edge functions need deploy |
| Analytics Dashboard | 🟡 | 415 lines |
| Executive Dashboard | 🟡 | 415 lines |

### Governance
| Module | Status | Notes |
|--------|--------|-------|
| Audit Log | 🔴 | Needs Phase 7 |
| Compliance | 🔴 | 83 lines UI |
| Compliance Register | 🔴 | 113 lines UI |
| Approvals Inbox | 🔴 | 79 lines UI |
| Directive Log | 🔴 | Needs `directives_audit.sql` |
| SOP Library | 🔴 | UI only |
| Policy Library | 🔴 | 113 lines UI |
| Emergency Plans | 🔴 | UI only |

### Admin & System
| Module | Status | Notes |
|--------|--------|-------|
| User Management | 🟡 | No role assignment UI |
| Tenant Admin | 🔴 | Needs Phase 7 |
| Settings | 🟡 | Exists |
| Customer Service | 🔴 | 6 pages in `pages/cs/` |

---

## BUILD ORDER — PHASE A THROUGH H

Work through in strict order. Each phase unlocks the next.

### PHASE A — FOUNDATION

#### A1. User Management & Role Assignment
**Goal:** Admin can create users and assign correct DB roles.

1. Write `UserManagement.tsx` with real CRUD — create Supabase auth user, insert `profiles`, assign `user_roles`
2. Role assignment must write to `user_roles.role` using `app_role` enum
3. Build `PendingActivation.tsx`
4. Add `is_elevated_user()` check to `user_roles` RLS

**Files:** `src/pages/UserManagement.tsx`, `src/pages/PendingActivation.tsx`, `src/hooks/useUserManagement.ts`

#### A2. Sites & Clients Seed Data
**Goal:** Real Alpha Pride client sites in DB.

1. Write `supabase/seed/001_sites.sql` — JKIA Terminal 2, Villa Rosa Kempinski, Two Rivers Mall, Nairobi Hospital, Westgate Mall + Alpha Pride sites
2. Write `supabase/seed/002_staff.sql` — 20+ guards + supervisors
3. Confirm `ClientManagement.tsx` reads/writes real data

#### A3. Staff Management (Full Backend Wiring)
**Goal:** Full HR CRUD on staff.

1. `src/hooks/useStaff.ts` — list, create, update, deactivate
2. Wire `StaffManagement.tsx`
3. Staff photo upload to Supabase Storage `staff-photos`
4. Staff search/filter by site, status, rank, duty category

---

### PHASE B — DAILY OPERATIONS

#### B1. Alarms
Apply Phase 7 for `auto_dispatch_rules`, `welfare_check_ins`, `false_alarm_log`. Wire `AutoDispatchRules.tsx`, `useAlarms` hook. Build alarm resolve/false-alarm flow.

#### B2. DOB — Digital Occurrence Book
Write `dob_soft_delete.sql`:
```sql
ALTER TABLE public.dob_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.dob_entries ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_dob_entries_deleted ON public.dob_entries(deleted_at) WHERE deleted_at IS NULL;
```
Wire `DOB.tsx` to `dob_entries`. Auto-create DOB entries from incidents, alarms, patrols.

#### B3. Patrol Suite
Write `field_portal_phase2.sql` — add `patrol_sessions`, `checkpoint_scans`, `patrol_gaps` view.
Build `usePatrols.ts`. Wire `SupervisionPatrol`, `PatrolCheckpoints`, `GPSPatrolTracking`, `PatrolIntelligence`.

#### B4. Communications / Call Centre
Build `useComms.ts` covering `calls`, `communication_tickets`, `whatsapp_messages`, `sms_messages`.
Wire `LiveCallsDashboard`, `CallHandlingScreen`, `WhatsAppSMSCenter`, `CommunicationLog`, `DispatchEscalation`.

#### B5. Control Room & Dispatch
Build `useDispatch.ts`. Write `hq_connect.sql`:
- `directives` table (HQ to branch with acknowledgement)
- `directive_acknowledgements` table
Wire `ControlRoom.tsx`, `MDTManagement.tsx`.

---

### PHASE C — SPECIALISED DEPARTMENTS

#### C1. CCTV
Write `cctv_cameras.sql`:
```sql
CREATE TABLE public.cctv_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_code TEXT UNIQUE NOT NULL, label TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id), zone TEXT,
  ip_address TEXT, stream_url TEXT, status TEXT DEFAULT 'online',
  recording_enabled BOOLEAN DEFAULT true, retention_days INTEGER DEFAULT 30,
  last_seen TIMESTAMPTZ, installed_at DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cctv_cameras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view cameras" ON public.cctv_cameras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Elevated manage cameras" ON public.cctv_cameras FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS camera_id UUID REFERENCES public.cctv_cameras(id);
```
Wire `CCTVOperatorConsole.tsx`.

#### C2. Body Cam (Evidence Vault)
Apply Phase 6. Create Storage bucket `evidence-vault`. Wire `EvidenceLibrary`, `DeviceManagement`, `ClipDetailDialog`. Use `evidence-sign-url` for downloads.

#### C3. Armoury & Visitor Access
Write `visitor_access_armoury.sql` with tables: `visitor_pre_clearances`, `visitor_log`, `armoury_items`, `armoury_custody_log`. All with RLS. Wire to `ArmouryCustodyModule.tsx`, `VisitorAccessModule.tsx`.

#### C4. K9
Write `k9_module.sql` with tables: `k9_dogs`, `k9_handlers`, `k9_deployments`, `k9_incidents`. All with RLS. Wire `K9.tsx`.

#### C5. CIT
Write `cit_module.sql` with tables: `cit_runs`, `cit_manifests`, `cit_vault_movements`, `cit_routes`. All with RLS. Wire `CashInTransit.tsx` (632 lines) + CIT dashboards.

#### C6. CMC
Write `cmc_module.sql` with tables: `cmc_activations`, `cmc_decisions`, `cmc_resources`. All with RLS. Wire `WarRoom.tsx`.

---

### PHASE D — HR & FINANCE BACKEND

#### D1. HR Sub-pages
Write `hr_finance_payroll_governance.sql` with tables: `payroll_runs`, `payslips`, `expense_claims`, `disciplinary_records`, `performance_reviews`. All with RLS.
Build `useHR.ts`, wire each HR sub-page.

#### D2. Recruitment & Onboarding
Build `useRecruitment.ts` covering `job_postings`, `applications`, `onboarding_checklists`. Wire `HRRecruitment.tsx`, `HROnboarding.tsx`.

---

### PHASE E — INTELLIGENCE & ANALYTICS

1. Set `OPENAI_API_KEY` in Supabase secrets. Deploy all edge functions.
2. Wire `StrategicAdvisory.tsx`, `CopilotDrawer.tsx`, shift briefing, patrol intelligence.
3. Dashboards auto-populate: `ExecutiveDashboard` (415 lines), `HRDashboard` (108 lines), `FinanceDashboard` (390 lines), etc.
4. RTSI globe map — Mapbox GL, colour-coded advisories. Spec in `BlackHawk_strategic_advisory_dashboard_global_map_spec.md`.

---

### PHASE F — GOVERNANCE & COMPLIANCE

Apply Phase 7 for `audit_log`, `user_presence`, `auto_dispatch_rules`. Wire: `AuditLog`, `Compliance`, `ComplianceRegister`, `ApprovalsInbox`, `DirectiveLog`, `SOPLibrary`, `PolicyLibrary`.

---

### PHASE G — CUSTOMER SERVICE & COURIER

**G1:** Write `customer_service_schema.sql` — `cs_tickets`, `cs_complaints`, `cs_notes`, `cs_categories`. Wire 6 pages in `src/pages/cs/`.

**G2:** Write courier migration — `courier_jobs`, `courier_riders`, `courier_routes`. Wire 3 pages in `src/pages/courier/`.

---

### PHASE H — PRODUCTION HARDENING

1. Apply Phase 7 `tenants`/`tenant_members`, wire `TenantAdmin.tsx`
2. Test `useOfflineSync.ts` (203 lines), PWA service worker
3. Ensure `logAudit()` on every destructive action
4. Security audit of Phase 6 evidence vault RLS
5. Configure Supabase auth rate limits
6. Confirm env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`

---

## CODING RULES REFERENCE

### DB Queries
```typescript
const { data, error } = await supabase
  .from('incidents')
  .select('*, staff(*)')
  .eq('status', 'open')
  .order('created_at', { ascending: false });
if (error) throw error;

// ALWAYS use React Query, never supabase from useEffect:
const { data, isLoading } = useQuery({
  queryKey: ['incidents', filters],
  queryFn: () => fetchIncidents(filters),
});
```

### Realtime Subscriptions
```typescript
useEffect(() => {
  const channel = supabase
    .channel('incidents-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' },
      () => queryClient.invalidateQueries({ queryKey: ['incidents'] }))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

### Writing Migrations
```sql
CREATE TABLE IF NOT EXISTS public.my_table (...);
ALTER TABLE public.my_table ADD COLUMN IF NOT EXISTS new_col TEXT;
CREATE INDEX IF NOT EXISTS idx_name ON public.my_table(column);
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "policy_name" ON public.my_table;
CREATE POLICY "policy_name" ON public.my_table ...;
```

### Component Structure
```typescript
const MyPage = () => {
  const { data, isLoading } = useMyHook();
  const [dialog, setDialog] = useState();
  if (isLoading) return <PageLoader />;
  return (
    <div className="space-y-6">
      <PageHeader title="..." description="..." icon={IconName} />
      {/* content */}
    </div>
  );
};
export default MyPage;  // MUST be default export (safeLazy requires it)
```

### Hook Pattern
```typescript
export const useMyFeature = () => {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-feature'],
    queryFn: async () => {
      const { data, error } = await supabase.from('my_table').select('*');
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('my_table').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-feature'] }),
  });
  return { data, isLoading, create: create.mutateAsync };
};
```

## CRITICAL DON'TS

- **NEVER** `React.lazy()` — use `safeLazy()` from `@/utils/safeLazy`
- **NEVER** read roles from `sessionStorage` — only `useAuth().userRole`
- **NEVER** write page without `default export`
- **NEVER** modify `src/integrations/supabase/client.ts` or `types.ts`
- **NEVER** call `supabase` inside component body — use hooks
- **NEVER** create RLS policy without `DROP POLICY IF EXISTS` first
- **NEVER** create non-idempotent migration (`IF NOT EXISTS` everywhere)
- **NEVER** access `auth.users` directly — use `public.profiles`
- **NEVER** hardcode Supabase URLs/keys — use `import.meta.env.VITE_*`
- **NEVER** add route without adding sidebar entry

## FILE NAMING CONVENTIONS

```
src/pages/MyPage.tsx               # PascalCase, default export
src/pages/modules/MyModule.tsx
src/pages/hr/HRSubPage.tsx         # Department prefix
src/pages/dashboards/RoleDash.tsx
src/components/feature/MyComp.tsx
src/hooks/useMyFeature.ts          # camelCase, use prefix
src/utils/myUtil.ts                # camelCase
supabase/migrations/YYYYMMDDHHMMSS_description.sql
supabase/functions/function-name/index.ts
```

## ENVIRONMENT VARIABLES

```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
# Supabase project secrets (dashboard or CLI)
OPENAI_API_KEY=sk-...
```

## QUICK REFERENCE — WHERE THINGS LIVE

| I need to... | Go to... |
|-------------|---------|
| Add a new route | `src/App.tsx` → `ConsoleLayout` routes |
| Add a sidebar nav item | `src/components/shell/WorkspaceShell.tsx` |
| Check what a user can do | `src/config/accessControl.ts` |
| Add a new permission module | `accessControl.ts` → `ModuleKey` type + matrix |
| Guard a route by role | Wrap with `<RequireRole>` in `App.tsx` |
| Guard a UI element | Wrap with `<RequirePermission module="..." level="...">` |
| Write to the audit trail | `import { logAudit } from "@/utils/auditLog"` |
| Generate a PDF report | `import jsPDF from "jspdf"` + `jspdf-autotable` |
| Show a toast notification | `import { toast } from "sonner"` |
| Call an edge function | `supabase.functions.invoke('name', { body: {} })` |
| Add realtime to a hook | Subscribe via `supabase.channel()` in `useEffect` |
| Know which tables exist | `src/integrations/supabase/types.ts` |
| Apply a pending migration | Paste SQL into Lovable Cloud → Database → SQL Editor |
| Deploy an edge function | `supabase functions deploy function-name` |

---

*Extracted from original CLAUDE.md. See `CLAUDE.md` for core reference. See `CLAUDE_ARCHIVE.md` for full original.*