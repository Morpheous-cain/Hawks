# CLAUDE.md — Alpha Pride Security (Black Hawk SOC-OS)

> **Read this file completely before touching any code.** It is the single source of truth for how this project is structured, what exists, what is missing, and how to build it correctly.

---

## 1. PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **Project** | Alpha Pride Security — Black Hawk SOC-OS |
| **Purpose** | Enterprise Security Operations Platform for a Kenyan private security company |
| **Repo** | `https://github.com/Morpheous-cain/Alpha-Pride-Security` |
| **Forked from** | `jibrilrashyd-sketch/Black-Hawk` |
| **Built with** | Lovable (AI-assisted frontend scaffolding) |
| **Live URL** | `https://blackkhawk.com` |

---

## 2. TECH STACK

### Frontend
- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **React Router v6** — all routes in `src/App.tsx`
- **TanStack Query v5** — all server state, `staleTime: 30s`, `gcTime: 5min`
- **Framer Motion** — animations
- **Mapbox GL** — interactive maps
- **jsPDF + jspdf-autotable** — PDF report generation
- **React Hook Form + Zod** — all forms
- **Recharts** — charts and analytics

### Backend
- **Supabase** — Postgres database, Auth, Row Level Security, Edge Functions, Realtime, Storage
- **Supabase client** at `src/integrations/supabase/client.ts` — typed via `src/integrations/supabase/types.ts`
- **Edge Functions** in `supabase/functions/` — all written in Deno TypeScript, call OpenAI
- **Migrations** in `supabase/migrations/` — numbered SQL files applied chronologically

### Key Patterns
```typescript
// Import the supabase client ALWAYS like this:
import { supabase } from "@/integrations/supabase/client";

// Import types ALWAYS like this:
import type { Database } from "@/integrations/supabase/types";

// Lazy-load ALL pages with safeLazy (not React.lazy directly):
import { safeLazy } from "@/utils/safeLazy";
const MyPage = safeLazy("MyPage", () => import("./pages/MyPage"));

// Access control — NEVER read roles from sessionStorage:
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
```

---

## 3. REPOSITORY STRUCTURE

```
/
├── src/
│   ├── App.tsx                        # All routes defined here
│   ├── main.tsx
│   ├── components/
│   │   ├── shell/WorkspaceShell.tsx   # Main app shell (sidebar + topbar)
│   │   ├── auth/
│   │   │   ├── RequireRole.tsx        # Route-level role guard
│   │   │   └── RequirePermission.tsx  # Element-level permission guard
│   │   ├── copilot/CopilotDrawer.tsx  # AI Copilot sidebar
│   │   ├── shared/ErrorBoundary.tsx
│   │   └── [module]/                  # Feature-specific components
│   ├── pages/
│   │   ├── [Page].tsx                 # Top-level pages
│   │   ├── modules/                   # Sub-module pages
│   │   ├── dashboards/                # Role-specific dashboards
│   │   ├── hr/                        # HR sub-pages
│   │   └── courier/                   # Courier sub-pages
│   ├── hooks/
│   │   ├── useAuth.ts                 # Auth context — DO NOT MODIFY
│   │   ├── usePermissions.ts          # Derives permissions from DB role
│   │   └── use[Module].ts             # Feature data hooks
│   ├── config/
│   │   └── accessControl.ts           # THE SINGLE SOURCE OF TRUTH for permissions
│   ├── integrations/supabase/
│   │   ├── client.ts                  # Supabase client (auto-generated, do not edit)
│   │   └── types.ts                   # DB types (auto-generated, do not edit)
│   └── utils/
│       ├── safeLazy.tsx               # Resilient lazy loader
│       ├── auditLog.ts                # logAudit() helper
│       └── chunkReload.ts             # Auto-reload on chunk error
├── supabase/
│   ├── migrations/                    # Applied migrations (chronological)
│   ├── functions/                     # Edge functions (Deno TS)
│   └── seed/                          # Seed SQL files
└── .lovable/
    └── pending_migrations/            # Migrations written but NOT YET APPLIED
```

---

## 4. AUTH & PERMISSIONS SYSTEM

### How Auth Works
1. `AuthProvider` in `src/hooks/useAuth.ts` wraps the entire app
2. Auth state is set ONLY from `supabase.auth.onAuthStateChange` (never `getSession`)
3. On login, user role is fetched from `user_roles` table via `fetchUserRole(userId)`
4. Role is stored in `AuthContext.userRole` — this is the server-side source of truth
5. `signOut` uses `scope: 'global'` to revoke server-side sessions

### Role System
The DB `app_role` enum (defined in migration 01) contains the **canonical** roles:
```sql
'ceo', 'coo', 'control_room_officer', 'operations_supervisor',
'hr_custodian', 'administrator', 'bdo', 'system_admin'
```

The `accessControl.ts` file defines a broader set of `DesignationId` strings used by the frontend access matrix. The `RequireRole` component maps DB roles to these designations.

### Permission Levels (escalating)
```
none → view → edit → create → delete
```

### Using Permissions in Code
```typescript
// In a component:
const { can, rule, visible } = usePermissions();

// Check if user can perform an action:
if (can("ops.incidents", "create")) { ... }

// Get full rule (level + scope):
const r = rule("hr.staff"); // { level: "edit", scope: "branch", reason: "..." }

// Route guard — wrap in App.tsx:
<RequireRole allowedRoles={["coo", "ops_manager"]}>
  <SensitivePage />
</RequireRole>

// Element guard — in a component:
<RequirePermission module="fin.billing" level="edit">
  <ApproveButton />
</RequirePermission>
```

### Access Matrix Summary (key roles)
| Role | Key Modules |
|------|------------|
| `ceo` | Executive dashboard (full), all others view-only |
| `coo` | Full operations: control room, incidents, alarms, fleet, CIT, patrol |
| `gm` | Full client management + contracts, finance view |
| `ops_manager` | Full ops: dispatch, incidents, alarms, MDT, patrol |
| `control` | Control room (full), incidents (create), alarms (edit), CCTV/bodycam (view) |
| `hr` | Full HR suite |
| `finance` | Full finance: billing, invoicing, bank rec, loss control |
| `payroll_officer` | Pay runs, payslips, statutory (PAYE/NHIF/NSSF) |
| `cit_manager` | Full CIT: runs, manifests, vault, routes, crews |
| `courier_manager` | Full courier operations |
| `system_admin` | Users, roles, settings, tenants — NO operational data |
| `compliance` | Full governance + audit |
| `customer_service_manager` | Full CS: tickets, complaints, team, config |

---

## 5. DATABASE SCHEMA

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
COMMS:            sms_messages, whatsapp_messages
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
These files exist but are **empty** — they need to be **written and applied**:

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

### Applied But Needs Deploy (Phase 6 + Phase 7)
Phase 6 SQL is in `PHASE6_MIGRATION.md` — adds: evidence vault RLS, `evidence_access_log`, `training_drills`, `drill_runs`, `client_branding`.

Phase 7 SQL is in `PHASE7_MIGRATION.md` — adds: `tenants`, `tenant_members`, `audit_log`, `user_presence`, `auto_dispatch_rules`, `welfare_check_ins`, `false_alarm_log`.

**Both Phase 6 and Phase 7 have been written but must be applied via Lovable Cloud → SQL Editor.**

---

## 6. EDGE FUNCTIONS

All edge functions are in `supabase/functions/`. They are written in Deno TypeScript and call OpenAI. They need to be deployed and require the `OPENAI_API_KEY` environment variable set in Supabase.

| Function | Lines | Status | Purpose |
|----------|-------|--------|---------|
| `copilot-assistant` | 287 | Written | AI copilot chat for SOC operators |
| `generate-briefing` | 229 | Written | Auto-generate shift briefings |
| `strategic-advisory` | 185 | Written | AI strategic advisory generation |
| `threat-analysis` | 190 | Written | Threat classification and scoring |
| `patrol-anomaly-detection` | 176 | Written | Detect patrol gaps/anomalies |
| `incident-ai-summary` | 122 | Written | Summarise incidents with AI |
| `shift-briefing` | 122 | Written | Daily shift briefing generation |
| `risk-forecast` | 80 | Written | Risk scoring and forecasting |
| `evidence-sign-url` | — | Written | Signed URL for evidence vault access |
| `attendance-anomaly-detection` | — | Written | Flag attendance anomalies |
| `public-api` | 54 | Written | External client API |
| `create-user-account` | — | Written | Admin user creation |
| `fetch-advisories` | — | Written | Fetch external advisory feeds |
| `training-drill-inject` | — | Written | Inject training drill scenarios |

**To call an edge function from the frontend:**
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1: value1 }
});
```

---

## 7. WHAT IS BUILT VS WHAT IS MISSING

### STATUS LEGEND
- ✅ **DONE** — Frontend + backend both complete, real data flows
- 🟡 **UI DONE** — Frontend complete, backend partially wired or missing tables
- 🔴 **STUB** — Page/component exists but is UI shell only, no real data
- ❌ **MISSING** — Backend tables/migrations not written yet

### Module Status

#### Core Auth & Platform
| Module | Status | Notes |
|--------|--------|-------|
| Auth (login/logout) | ✅ | Solid, race-condition safe, global signout |
| `user_roles` assignment | 🟡 | Schema exists, no admin UI to assign roles yet |
| `pending_activation` flow | 🔴 | Page file is empty (0 bytes) |
| Workspace shell / sidebar | ✅ | `WorkspaceShell.tsx` renders nav |
| `RequireRole` guard | ✅ | Protects all console routes |
| `accessControl.ts` matrix | ✅ | Full permission matrix defined |

#### Operations Core
| Module | Status | Notes |
|--------|--------|-------|
| Incidents | ✅ | 1746 lines, `useIncidents` hook (344 lines), real DB |
| Alarms | 🟡 | 428 lines, `useAlarms` hook, needs Phase 7 applied |
| DOB (Digital Occurrence Book) | 🟡 | 340 lines, needs `dob_soft_delete.sql` |
| Control Room | 🟡 | 328 lines, dispatch not fully wired |
| MDT Management | 🟡 | Pages exist, hooks need real dispatch tables |
| Patrol Suite | 🟡 | Shell tab wrapper only (72 lines), sub-pages need hooks |
| GPS Patrol Tracking | 🔴 | Page exists, no real GPS hooks |
| Supervision Patrol | 🔴 | Page exists, needs patrol data hooks |
| Field App (officer mobile) | 🟡 | Exists, needs `field_portal_phase2.sql` |

#### Security Operations
| Module | Status | Notes |
|--------|--------|-------|
| CCTV | 🟡 | 205 lines, `CCTVOperatorConsole` (434 lines), no camera table |
| Body Cam | 🟡 | 58-line shell + 4 components (~200 lines each), needs Phase 6 applied |
| Access Control | 🟡 | 187 lines, needs visitor/armoury migration |
| Visitor Access | 🔴 | Delegates to `VisitorAccessModule`, no DB tables yet |
| Armoury Custody | 🔴 | Delegates to `ArmouryCustodyModule`, no DB tables yet |
| Loss Control | 🟡 | 236 lines, tables exist in schema |
| Escort Operations | 🟡 | 496 lines, needs real hook wiring |
| K9 | 🔴 | 367 lines of UI, `k9_module.sql` not written |
| Event Security | ✅ | 1060 lines, substantive implementation |
| Investigations | ✅ | 1746 lines, most complete module |
| War Room / CMC | 🔴 | 198 lines UI, `cmc_module.sql` not written |

#### People & HR
| Module | Status | Notes |
|--------|--------|-------|
| Staff Management | 🟡 | 353 lines, reads real DB |
| HR Suite (tab shell) | 🟡 | 88 lines, delegates to sub-pages |
| HR Recruitment | 🔴 | 149 lines, UI only |
| HR Onboarding | 🔴 | 135 lines, UI only |
| HR Attendance | 🔴 | 163 lines, UI only |
| HR Performance | 🔴 | 131 lines, UI only |
| HR Disciplinary | 🔴 | 125 lines, UI only |
| Staff Scheduling | 🟡 | Redirects into HR Suite |
| Leave Management | 🟡 | Redirects into HR Suite |
| Field Officers Mgmt | 🟡 | Redirects into HR Suite |
| Training Management | 🟡 | 251 lines, tables exist |
| Training Drills | 🟡 | Needs Phase 6 applied (`training_drills` table) |

#### Finance
| Module | Status | Notes |
|--------|--------|-------|
| Billing & Invoicing | ✅ | 1220 lines, most complete finance page |
| Payroll Runs | 🔴 | 129 lines UI, needs `hr_finance_payroll_governance.sql` |
| Payslips | 🔴 | 88 lines UI, same migration needed |
| Expenses | 🔴 | 139 lines UI, same migration needed |
| Statutory Returns | 🔴 | 81 lines UI, same migration needed |
| Finance Dashboard | 🟡 | 390 lines, needs real finance data |

#### Clients & Contracts
| Module | Status | Notes |
|--------|--------|-------|
| Client Management | 🟡 | 327 lines, reads real DB |
| Client Detail | 🟡 | Exists, needs full wiring |
| Client Portal | 🟡 | Multiple sub-pages, mostly UI |

#### Specialised Departments
| Module | Status | Notes |
|--------|--------|-------|
| CIT (Cash in Transit) | 🔴 | 632 lines UI, `cit_module.sql` not written |
| Courier Operations | 🔴 | 3 pages in `pages/courier/`, no DB tables |
| Communications (Call Centre) | 🟡 | 73-line shell, 8 sub-components (~200 lines each), mostly mock data |
| Technical Security (TIMU) | 🟡 | 88 lines, 7 components, tables exist |

#### Intelligence & Advisory
| Module | Status | Notes |
|--------|--------|-------|
| Strategic Advisory (RTSI) | 🟡 | 311 lines, edge functions written, needs deploy |
| Analytics Dashboard | 🟡 | 415 lines, hooks wired |
| Executive Dashboard | 🟡 | 415 lines, `useDashboardMetrics` reads real DB |

#### Governance
| Module | Status | Notes |
|--------|--------|-------|
| Audit Log | 🔴 | Page exists, needs Phase 7 applied |
| Compliance | 🔴 | 83 lines, UI only |
| Compliance Register | 🔴 | 113 lines, UI only |
| Approvals Inbox | 🔴 | 79 lines, UI only |
| Directive Log | 🔴 | Page exists, needs `directives_audit.sql` |
| SOP Library | 🔴 | Exists, UI only |
| Policy Library | 🔴 | 113 lines, UI only |
| Emergency Plans | 🔴 | UI only |

#### Admin & System
| Module | Status | Notes |
|--------|--------|-------|
| User Management | 🟡 | Page exists, no role assignment UI |
| Tenant Admin | 🔴 | Exists, needs Phase 7 applied |
| Settings | 🟡 | Exists |
| Customer Service | 🔴 | 6 pages in `pages/cs/`, needs `customer_service_schema.sql` |

---

## 8. BUILD ORDER — SECTION BY SECTION

Work through these in strict order. Each phase unlocks the next.

---

### PHASE A — FOUNDATION (Do This First)
Everything else depends on real users, sites, and staff existing in the DB.

#### A1. User Management & Role Assignment
**Goal:** Admin can create users and assign correct DB roles.

**What to build:**
1. Write `UserManagement.tsx` with real CRUD — create Supabase auth user, insert `profiles`, assign `user_roles`
2. Role assignment must write to `user_roles.role` using the `app_role` enum (not the broader designation strings)
3. Build `PendingActivation.tsx` — screen shown when a user has an auth account but no role assigned yet
4. Add `is_elevated_user()` check to `user_roles` RLS so only admins can write roles

**Files to create/modify:**
- `src/pages/UserManagement.tsx` — real CRUD
- `src/pages/PendingActivation.tsx` — currently empty
- `src/hooks/useUserManagement.ts` — new hook

**DB check:** `user_roles` table exists, `profiles` table exists. No new migration needed.

---

#### A2. Sites & Clients Seed Data
**Goal:** Real Alpha Pride client sites exist in the DB so all other modules can reference them.

**What to build:**
1. Write `supabase/seed/001_sites.sql` with real Nairobi client sites:
   - JKIA Terminal 2, Villa Rosa Kempinski, Two Rivers Mall, Nairobi Hospital, Westgate Mall, plus Alpha Pride's own sites
2. Write `supabase/seed/002_staff.sql` with placeholder staff records (at least 20 guards + supervisors)
3. Confirm `ClientManagement.tsx` reads and writes real data

**Files to create/modify:**
- `supabase/seed/001_sites.sql` — write real seed data
- `supabase/seed/002_staff.sql` — write staff seed data
- `supabase/seed/run_all.sql` — orchestrates all seeds

---

#### A3. Staff Management (Full Backend Wiring)
**Goal:** HR can create, edit, and view real staff records.

**What to build:**
1. `src/hooks/useStaff.ts` — full CRUD hook: list, create, update, deactivate
2. Wire `StaffManagement.tsx` to real DB (currently partially wired)
3. Implement staff photo upload to Supabase Storage bucket `staff-photos`
4. Staff search + filter by site, status, rank, duty category

**DB:** `staff` table exists. Check RLS — HR and elevated users should have `create`/`edit`, field officers read own.

---

### PHASE B — DAILY OPERATIONS

#### B1. Alarms (Complete Wiring)
**Goal:** Full alarm lifecycle — trigger → acknowledge → dispatch → resolve.

**What to build:**
1. Apply Phase 7 migration (`PHASE7_MIGRATION.md`) — adds `auto_dispatch_rules`, `welfare_check_ins`, `false_alarm_log`
2. Wire `AutoDispatchRules.tsx` to real `auto_dispatch_rules` table
3. Ensure `useAlarms` hook covers: `alarm_activations`, `alarm_sensors`, `sos_alerts`
4. Build alarm resolve/false-alarm flow writing to `false_alarm_log`

**Files:** `src/pages/Alarms.tsx` (428 lines), `src/hooks/useAlarms.ts`, `src/pages/AutoDispatchRules.tsx`

---

#### B2. DOB — Digital Occurrence Book
**Goal:** Officers can log, search, and export occurrence book entries.

**What to build:**
1. Apply `dob_soft_delete.sql` pending migration (write it first)
2. Ensure `DOB.tsx` (340 lines) writes real entries to `dob_entries`
3. Add soft-delete: set `deleted_at` timestamp, filter it out in queries
4. DOB entry auto-creation triggered from: incident create, alarm acknowledge, patrol checkpoint

**Soft delete migration to write:**
```sql
ALTER TABLE public.dob_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.dob_entries ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_dob_entries_deleted ON public.dob_entries(deleted_at) WHERE deleted_at IS NULL;
```

---

#### B3. Patrol Suite (Full Backend)
**Goal:** Supervisors can track real patrol activity.

**What to build:**
1. Write `supabase/migrations/[timestamp]_field_portal_phase2.sql`:
   - Add `patrol_sessions` table (start/end/officer/site/route)
   - Add `checkpoint_scans` table (qr_code, officer_id, scanned_at, location)
   - Add `patrol_gaps` view (missed checkpoints beyond SLA)
2. Build `src/hooks/usePatrols.ts` — real CRUD for patrols
3. Wire `SupervisionPatrol.tsx` to real patrol data
4. Wire `PatrolCheckpoints.tsx` to `patrol_checkpoints` + `checkpoint_scans`
5. Wire `GPSPatrolTracking.tsx` to `mobile_patrols` (has lat/lng columns)
6. Wire `PatrolIntelligence.tsx` to `patrol-anomaly-detection` edge function

---

#### B4. Communications / Call Centre
**Goal:** Operators can log, track, and resolve calls and tickets.

**What to build:**
1. Build `src/hooks/useComms.ts`:
   - `calls` table: create, update status, link to incident
   - `communication_tickets` table: create, assign, resolve
   - `whatsapp_messages` + `sms_messages`: log inbound/outbound
2. Wire `Communications.tsx` sub-components to real data:
   - `LiveCallsDashboard` → `calls` table with realtime
   - `CallHandlingScreen` → create/update call records
   - `WhatsAppSMSCenter` → `whatsapp_messages` + `sms_messages`
   - `CommunicationLog` → query all comms by date/type
   - `DispatchEscalation` → link comms to dispatch
3. `CallOperatorConsole` is the main operator view — make it primary

---

#### B5. Control Room & Dispatch
**Goal:** Control room can dispatch units and monitor operations in real time.

**What to build:**
1. Build `src/hooks/useDispatch.ts` — CRUD for `dispatch_requests`, `dispatch_logs`
2. Write and apply `hq_connect.sql`:
   - `directives` table (from HQ to branch, with acknowledgement)
   - `directive_acknowledgements` table
3. Wire `ControlRoom.tsx` to real dispatch data
4. Wire `MDTManagement.tsx` to `mdt_messages` table
5. `ControlRoomDashboard` reads `useDashboardMetrics` — confirm it works once data exists

---

### PHASE C — SPECIALISED DEPARTMENTS

#### C1. CCTV (Camera Registry + Live View)
**Goal:** Operators can manage cameras and view incidents by camera.

**What to build:**
1. Write and apply `cctv_cameras.sql`:
```sql
CREATE TABLE public.cctv_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id),
  zone TEXT,
  ip_address TEXT,
  stream_url TEXT,
  status TEXT DEFAULT 'online', -- online, offline, fault
  recording_enabled BOOLEAN DEFAULT true,
  retention_days INTEGER DEFAULT 30,
  last_seen TIMESTAMPTZ,
  installed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cctv_cameras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view cameras" ON public.cctv_cameras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Elevated manage cameras" ON public.cctv_cameras FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));
```
2. Wire `CCTVOperatorConsole.tsx` to real camera registry
3. Link camera to incidents: `incidents.camera_id UUID REFERENCES cctv_cameras(id)`

---

#### C2. Body Cam (Evidence Vault)
**Goal:** Evidence can be uploaded, accessed with audit trail, chain of custody maintained.

**What to build:**
1. Apply Phase 6 migration (in `PHASE6_MIGRATION.md`) — adds evidence vault RLS, `evidence_access_log`
2. Create Supabase Storage bucket `evidence-vault` (if not already created)
3. Wire `EvidenceLibrary.tsx` to `body_cam_clips` table
4. Wire `DeviceManagement.tsx` to `body_cam_devices` table
5. Use `evidence-sign-url` edge function for all evidence downloads (logs access)
6. Wire `ClipDetailDialog.tsx` to `clip_chain_of_custody`

---

#### C3. Armoury & Visitor Access
**Goal:** Track weapons, radios, and equipment. Log all visitors.

**What to build:**
1. Write and apply `visitor_access_armoury.sql`:
```sql
-- Visitor pre-clearance
CREATE TABLE public.visitor_pre_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id),
  visitor_name TEXT NOT NULL,
  visitor_id_number TEXT,
  host_staff_id UUID REFERENCES public.staff(id),
  purpose TEXT,
  expected_arrival TIMESTAMPTZ,
  expected_departure TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, approved, denied
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitor log (actual visits)
CREATE TABLE public.visitor_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_clearance_id UUID REFERENCES public.visitor_pre_clearances(id),
  site_id UUID REFERENCES public.sites(id),
  visitor_name TEXT NOT NULL,
  visitor_id_number TEXT,
  badge_number TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  vehicle_reg TEXT,
  officer_id UUID REFERENCES public.staff(id),
  watchlist_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Armoury custody
CREATE TABLE public.armoury_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  item_type TEXT NOT NULL, -- firearm, radio, baton, body_cam, taser
  make TEXT, model TEXT, serial_number TEXT,
  status TEXT DEFAULT 'in_store', -- in_store, issued, maintenance, decommissioned
  current_holder UUID REFERENCES public.staff(id),
  site_id UUID REFERENCES public.sites(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.armoury_custody_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.armoury_items(id),
  issued_to UUID REFERENCES public.staff(id),
  issued_by UUID REFERENCES public.profiles(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  returned_to UUID REFERENCES public.profiles(id),
  condition_on_issue TEXT,
  condition_on_return TEXT,
  notes TEXT
);

-- RLS on all above tables
ALTER TABLE public.visitor_pre_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armoury_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armoury_custody_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read visitor" ON public.visitor_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Officers log visitors" ON public.visitor_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated read armoury" ON public.armoury_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Elevated manage armoury" ON public.armoury_items FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));
CREATE POLICY "Authenticated read custody" ON public.armoury_custody_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Officers log custody" ON public.armoury_custody_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
```
2. Wire `ArmouryCustodyModule.tsx` and `VisitorAccessModule.tsx` to real tables

---

#### C4. K9 Module
**What to build:**
1. Write and apply `k9_module.sql`:
```sql
CREATE TABLE public.k9_dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  date_of_birth DATE,
  status TEXT DEFAULT 'active', -- active, retired, sick, deceased
  certifications TEXT[],
  current_handler_id UUID REFERENCES public.staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.k9_handlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) UNIQUE,
  dog_id UUID REFERENCES public.k9_dogs(id),
  certified_since DATE,
  certification_expiry DATE,
  status TEXT DEFAULT 'active'
);
CREATE TABLE public.k9_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES public.k9_dogs(id),
  handler_id UUID REFERENCES public.staff(id),
  site_id UUID REFERENCES public.sites(id),
  deployment_type TEXT, -- patrol, search, escort, event
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT
);
CREATE TABLE public.k9_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES public.k9_dogs(id),
  handler_id UUID REFERENCES public.staff(id),
  incident_id UUID REFERENCES public.incidents(id),
  incident_type TEXT, -- bite, loss, injury, missing
  severity TEXT,
  description TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS on all K9 tables
ALTER TABLE public.k9_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.k9_handlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.k9_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.k9_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read k9" ON public.k9_dogs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Elevated manage k9" ON public.k9_dogs FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));
CREATE POLICY "Authenticated read k9_deployments" ON public.k9_deployments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operators log k9 deployments" ON public.k9_deployments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
```
2. Wire `K9.tsx` to real tables

---

#### C5. CIT (Cash In Transit)
**What to build:**
1. Write and apply `cit_module.sql`:
```sql
CREATE TABLE public.cit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  departed_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_transit, delivered, aborted
  vehicle_id UUID REFERENCES public.vehicles(id),
  crew_leader_id UUID REFERENCES public.staff(id),
  declared_value NUMERIC,
  currency TEXT DEFAULT 'KES',
  seal_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.cit_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.cit_runs(id),
  package_count INTEGER DEFAULT 0,
  total_value NUMERIC,
  currency TEXT DEFAULT 'KES',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' -- draft, approved, dispatched, delivered
);
CREATE TABLE public.cit_vault_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.cit_runs(id),
  movement_type TEXT NOT NULL, -- deposit, withdrawal, transfer
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  from_vault TEXT,
  to_vault TEXT,
  authorized_by UUID REFERENCES public.profiles(id),
  witnessed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.cit_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  waypoints JSONB, -- array of {lat, lng, label}
  estimated_duration_mins INTEGER,
  risk_level TEXT DEFAULT 'low',
  active BOOLEAN DEFAULT true
);
-- crew_members table already exists in schema
-- Enable RLS
ALTER TABLE public.cit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cit_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cit_vault_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cit_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CIT authenticated read" ON public.cit_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "CIT managers write runs" ON public.cit_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coo'::app_role) OR public.is_elevated_user(auth.uid()));
```
2. Wire `CashInTransit.tsx` (632 lines) to real tables
3. Wire CIT dashboard sub-pages

---

#### C6. CMC (Crisis Management Centre)
**What to build:**
1. Write and apply `cmc_module.sql`:
```sql
CREATE TABLE public.cmc_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code TEXT UNIQUE NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- elevated, crisis, catastrophic
  activated_by UUID REFERENCES public.profiles(id),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active',
  briefing TEXT,
  geographic_scope TEXT
);
CREATE TABLE public.cmc_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id UUID REFERENCES public.cmc_activations(id),
  decision_text TEXT NOT NULL,
  made_by UUID REFERENCES public.profiles(id),
  made_at TIMESTAMPTZ DEFAULT NOW(),
  rationale TEXT,
  priority TEXT DEFAULT 'normal'
);
CREATE TABLE public.cmc_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id UUID REFERENCES public.cmc_activations(id),
  resource_type TEXT NOT NULL, -- vehicle, officer, equipment
  resource_id TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  status TEXT DEFAULT 'committed'
);
ALTER TABLE public.cmc_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmc_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmc_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated read CMC" ON public.cmc_activations FOR SELECT TO authenticated USING (true);
CREATE POLICY "COO/CEO activate CMC" ON public.cmc_activations FOR INSERT TO authenticated
  WITH CHECK (public.is_elevated_user(auth.uid()));
```
2. Wire `WarRoom.tsx` and CMC components to real tables

---

### PHASE D — HR & FINANCE BACKEND

#### D1. HR Sub-pages (Full Wiring)
Apply `hr_finance_payroll_governance.sql` — write this migration first:

```sql
-- Payroll runs
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_month INTEGER NOT NULL,
  run_year INTEGER NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, processing, approved, paid
  total_gross NUMERIC DEFAULT 0,
  total_net NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_month, run_year)
);
-- Payslips
CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id),
  staff_id UUID REFERENCES public.staff(id),
  basic_pay NUMERIC NOT NULL,
  allowances JSONB DEFAULT '{}',
  deductions JSONB DEFAULT '{}',
  gross_pay NUMERIC NOT NULL,
  paye NUMERIC DEFAULT 0,
  nhif NUMERIC DEFAULT 0,
  nssf NUMERIC DEFAULT 0,
  net_pay NUMERIC NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Expense claims
CREATE TABLE public.expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  category TEXT NOT NULL, -- fuel, accommodation, meals, equipment, other
  description TEXT NOT NULL,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Disciplinary records
CREATE TABLE public.disciplinary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id),
  incident_type TEXT NOT NULL,
  severity TEXT DEFAULT 'minor', -- minor, major, gross_misconduct
  description TEXT NOT NULL,
  action_taken TEXT,
  hearing_date DATE,
  outcome TEXT,
  appeal_deadline DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Performance reviews
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id),
  review_period TEXT NOT NULL, -- e.g. "Q1 2025"
  reviewer_id UUID REFERENCES public.profiles(id),
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 5),
  categories JSONB DEFAULT '{}',
  comments TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS on all
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
-- Payroll: only payroll officers and elevated
CREATE POLICY "Payroll officers manage runs" ON public.payroll_runs FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()));
-- Payslips: own record or payroll officer
CREATE POLICY "Staff view own payslip" ON public.payslips FOR SELECT TO authenticated
  USING (staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid()) OR public.is_elevated_user(auth.uid()));
-- Expenses: own or approver
CREATE POLICY "Own expenses" ON public.expense_claims FOR ALL TO authenticated
  USING (claimant_id = auth.uid() OR public.is_elevated_user(auth.uid()));
-- HR manage disciplinary
CREATE POLICY "HR manage disciplinary" ON public.disciplinary_records FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()));
```

Then build `src/hooks/useHR.ts` covering all HR sub-modules and wire each page.

---

#### D2. Recruitment & Onboarding
Build `src/hooks/useRecruitment.ts`:
- `job_postings` table (write migration)
- `applications` table
- `onboarding_checklists` table
Wire `HRRecruitment.tsx` and `HROnboarding.tsx`

---

### PHASE E — INTELLIGENCE & ANALYTICS

#### E1. Deploy Edge Functions
1. Set `OPENAI_API_KEY` in Supabase project secrets
2. Deploy all functions via Supabase CLI: `supabase functions deploy <name>`
3. Wire `StrategicAdvisory.tsx` to `strategic-advisory` + `threat-analysis` edge functions
4. Wire `CopilotDrawer.tsx` to `copilot-assistant` edge function (already has 137-line component)
5. Wire `generate-briefing` to shift handover page
6. Wire `patrol-anomaly-detection` to PatrolIntelligence page

---

#### E2. Executive Dashboards
Once data exists from phases A-D, the `useDashboardMetrics` hook (real Supabase queries) will automatically populate:
- `ExecutiveDashboard.tsx` (415 lines)
- `CEODashboard` (alias of ExecutiveDashboard)
- `HRDashboard.tsx` (108 lines)
- `FinanceDashboard.tsx` (390 lines)
- `GMDashboard.tsx` (104 lines)
- `CITDashboard.tsx` (103 lines)

The hook pattern is:
```typescript
const metrics = useDashboardMetrics([
  { key: "activeIncidents", table: "incidents", filter: q => q.eq("status", "open") },
  { key: "staffOnDuty", table: "staff", filter: q => q.eq("status", "active") },
]);
```

---

#### E3. RTSI Strategic Advisory Map
Reference spec: `BlackHawk_strategic_advisory_dashboard_global_map_spec.md`

Build the globe map component:
- Use Mapbox GL (already in dependencies)
- Left panel: Traffic + Protest
- Right panel: Terror + Weather + Crime
- Color coding: NORMAL=green, CAUTION=amber, CRITICAL=red
- Connects to `strategic_advisories` table + edge functions

---

### PHASE F — GOVERNANCE & COMPLIANCE

Apply Phase 7 migration for: `audit_log`, `user_presence`, `auto_dispatch_rules`

Wire remaining stub pages:
- `AuditLog.tsx` → `audit_log` table
- `Compliance.tsx` + `ComplianceRegister.tsx` → new `compliance_items` table
- `ApprovalsInbox.tsx` → new `approval_requests` table
- `DirectiveLog.tsx` → `directives` table (from `hq_connect.sql`)
- `SOPLibrary.tsx` + `PolicyLibrary.tsx` → `documents` table filtered by type

---

### PHASE G — CUSTOMER SERVICE & COURIER

#### G1. Customer Service
Apply `customer_service_schema.sql` (write it first):
- `cs_tickets` table
- `cs_complaints` table
- `cs_notes` table (already partially in schema)
- `cs_categories` table (already in schema)
Wire 6 pages in `src/pages/cs/`

#### G2. Courier Operations
Write courier migration:
- `courier_jobs` table
- `courier_riders` table (extend existing `staff` with `rider_profile`)
- `courier_routes` table
Wire 3 pages in `src/pages/courier/`

---

### PHASE H — PRODUCTION HARDENING

1. **Multi-tenancy** — apply Phase 7 `tenants`/`tenant_members`, wire `TenantAdmin.tsx`
2. **PWA & Offline** — test `useOfflineSync.ts` (203 lines), ensure service worker caches critical routes
3. **Audit trail** — ensure `logAudit()` is called on every destructive action
4. **Phase 6 Evidence Vault** — security audit of RLS policies for body cam evidence
5. **Rate limiting** — configure Supabase auth rate limits
6. **Environment variables** — confirm all envs set in production: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`

---

## 9. CODING RULES — ALWAYS FOLLOW THESE

### DB Queries
```typescript
// ALWAYS use the typed client:
const { data, error } = await supabase
  .from('incidents')          // table name must match schema
  .select('*, staff(*)')     // explicit column selection
  .eq('status', 'open')
  .order('created_at', { ascending: false });

if (error) throw error;      // always handle errors

// NEVER call supabase from useEffect directly — use React Query:
const { data, isLoading } = useQuery({
  queryKey: ['incidents', filters],
  queryFn: () => fetchIncidents(filters),
});
```

### Realtime Subscriptions
```typescript
// Pattern for realtime in hooks:
useEffect(() => {
  const channel = supabase
    .channel('incidents-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'incidents',
    }, () => queryClient.invalidateQueries({ queryKey: ['incidents'] }))
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

### Writing Migrations
```sql
-- ALWAYS wrap in idempotent checks:
CREATE TABLE IF NOT EXISTS public.my_table (...);
ALTER TABLE public.my_table ADD COLUMN IF NOT EXISTS new_col TEXT;
CREATE INDEX IF NOT EXISTS idx_name ON public.my_table(column);

-- ALWAYS enable RLS on new tables:
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- ALWAYS use DROP POLICY IF EXISTS before CREATE POLICY:
DROP POLICY IF EXISTS "policy_name" ON public.my_table;
CREATE POLICY "policy_name" ON public.my_table ...;
```

### Component Structure
```typescript
// Page component pattern:
const MyPage = () => {
  const { data, isLoading } = useMyHook();   // data from hook
  const [dialog, setDialog] = useState();    // local UI state only

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
// Data hook pattern:
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
    mutationFn: async (payload: MyType) => {
      const { data, error } = await supabase.from('my_table').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-feature'] }),
  });

  return { data, isLoading, create: create.mutateAsync };
};
```

---

## 10. CRITICAL DON'TS

- **NEVER** use `React.lazy()` directly — always use `safeLazy()` from `@/utils/safeLazy`
- **NEVER** read user roles from `sessionStorage` — only from `useAuth().userRole`
- **NEVER** write a page without a `default export` — `safeLazy` requires it
- **NEVER** modify `src/integrations/supabase/client.ts` or `types.ts` — auto-generated
- **NEVER** call `supabase` from inside a component body — always in hooks or query functions
- **NEVER** create an RLS policy without `DROP POLICY IF EXISTS` first
- **NEVER** create a migration that isn't idempotent (`IF NOT EXISTS` everywhere)
- **NEVER** access `auth.users` directly — use `public.profiles` table
- **NEVER** hardcode Supabase URLs or keys — always use `import.meta.env.VITE_*`
- **NEVER** add a new route in `App.tsx` without also adding it to the sidebar navigation in `WorkspaceShell`

---

## 11. FILE NAMING CONVENTIONS

```
src/pages/MyPage.tsx               # PascalCase, default export
src/pages/modules/MyModule.tsx     # Sub-modules
src/pages/hr/HRSubPage.tsx         # Department prefix
src/pages/dashboards/RoleDash.tsx  # Dashboard per role
src/components/feature/MyComp.tsx  # Feature folder
src/hooks/useMyFeature.ts          # camelCase, use prefix
src/utils/myUtil.ts                # camelCase
supabase/migrations/YYYYMMDDHHMMSS_description.sql
supabase/functions/function-name/index.ts
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Supabase project secrets (set via dashboard or CLI)
OPENAI_API_KEY=sk-...
```

---

## 13. QUICK REFERENCE — WHERE THINGS LIVE

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

*Last updated: June 2026 — reflects codebase state at the time of analysis. Update this file whenever a major section is completed.*
