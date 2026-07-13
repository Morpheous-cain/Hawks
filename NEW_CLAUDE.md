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

