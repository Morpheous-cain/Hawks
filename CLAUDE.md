# CLAUDE.md — Alpha Pride Security (Black Hawk SOC-OS)

> **Read this file completely before touching any code.** Single source of truth for project structure and rules.
>
> **Detailed sections** (schema, build order, module status, coding patterns) are in `CLAUDE_OPERATIONS.md`. Full original at `CLAUDE_ARCHIVE.md`.

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
- **Framer Motion** (animations), **Mapbox GL** (maps)
- **jsPDF + jspdf-autotable** (PDF reports), **Recharts** (charts)
- **React Hook Form + Zod** — all forms

### Backend
- **Supabase** — Postgres, Auth, RLS, Edge Functions (Deno TS), Realtime, Storage
- Client at `src/integrations/supabase/client.ts` — typed via `types.ts`
- Edge Functions in `supabase/functions/` (Deno TS, call OpenAI)
- Migrations in `supabase/migrations/` (numbered SQL, chronological)

### Key Patterns
```typescript
// Supabase client:
import { supabase } from "@/integrations/supabase/client";
// Types:
import type { Database } from "@/integrations/supabase/types";
// Lazy-load ALL pages (never React.lazy):
import { safeLazy } from "@/utils/safeLazy";
const MyPage = safeLazy("MyPage", () => import("./pages/MyPage"));
// Access control:
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
```

---

## 3. REPOSITORY STRUCTURE

```
src/
├── App.tsx                        # All routes (ConsoleLayout)
├── components/
│   ├── shell/WorkspaceShell.tsx     # Sidebar + topbar
│   ├── auth/RequireRole.tsx        # Route guard
│   ├── auth/RequirePermission.tsx   # Element guard
│   └── [module]/                   # Feature components
├── pages/                          # Pages (default exports)
├── hooks/                          # useAuth, usePermissions, use[Module]
├── config/accessControl.ts         # PERMISSION source of truth
├── integrations/supabase/          # client.ts + types.ts (do not edit)
└── utils/                          # safeLazy, auditLog, chunkReload
supabase/
├── migrations/                     # Applied SQL (chronological)
├── functions/                      # Edge Functions (Deno TS)
└── seed/                           # Seed SQL
.lovable/pending_migrations/         # Empty — need writing + applying
```

---

## 4. AUTH & PERMISSIONS

### Auth Flow
1. `AuthProvider` in `src/hooks/useAuth.ts` wraps app
2. Auth state ONLY from `supabase.auth.onAuthStateChange` (never `getSession`)
3. Role fetched from `user_roles` table via `fetchUserRole(userId)`
4. Stored in `AuthContext.userRole` (server-side source of truth)
5. `signOut` uses `scope: 'global'`

### Roles
DB `app_role` enum (migration 01):
```sql
'ceo', 'coo', 'control_room_officer', 'operations_supervisor',
'hr_custodian', 'administrator', 'bdo', 'system_admin'
```
`accessControl.ts` defines broader `DesignationId` strings for frontend. `RequireRole` maps DB roles → designations.

### Permission Levels
```
none → view → edit → create → delete
```

### Usage
```typescript
const { can, rule, visible } = usePermissions();
if (can("ops.incidents", "create")) { ... }
const r = rule("hr.staff"); // { level, scope, reason }

<RequireRole allowedRoles={["coo", "ops_manager"]}><Page /></RequireRole>
<RequirePermission module="fin.billing" level="edit"><Btn /></RequirePermission>
```

### Access Matrix Summary
| Role | Key Modules |
|------|------------|
| `ceo` | Executive (full), others view-only |
| `coo` | Full ops: control room, incidents, alarms, fleet, CIT, patrol |
| `gm` | Client mgmt + contracts, finance view |
| `ops_manager` | Full ops: dispatch, incidents, alarms, MDT, patrol |
| `control` | Control room (full), incidents (create), alarms (edit), CCTV/bodycam (view) |
| `hr` | Full HR suite |
| `finance` | Full finance: billing, invoicing, bank rec, loss control |
| `payroll_officer` | Pay runs, payslips, statutory |
| `cit_manager` | Full CIT |
| `courier_manager` | Full courier |
| `system_admin` | Users, roles, settings, tenants — NO operational data |
| `compliance` | Full governance + audit |
| `customer_service_manager` | Full CS |

---

## 5. DATABASE SCHEMA (Summary)

**75 applied tables** across: auth, staff, sites/clients, incidents, patrols, alarms, DOB, dispatch/MDT, comms, body cam, investigations, loss control, CIT, technical, fleet, documents, training, reporting, CS, advisory, governance, events.

**Pending migrations** (13 files in `.lovable/pending_migrations/` — empty, need writing): `cit_module.sql`, `k9_module.sql`, `visitor_access_armoury.sql`, `cmc_module.sql`, `field_portal_phase2.sql`, `hq_connect.sql`, `hr_finance_payroll_governance.sql`, `incident_command_v2.sql`, `auto_dispatch_rules.sql`, `cctv_cameras.sql`, `dob_soft_delete.sql`, `enterprise_first_wave.sql`, `directives_audit.sql`.

**Phase 6 + Phase 7** written, need deploy via Lovable Cloud SQL Editor. See `PHASE6_MIGRATION.md` and `PHASE7_MIGRATION.md`.

👉 **Full table list, conventions, RLS helpers, and migration details: `CLAUDE_OPERATIONS.md`**

---

## 6. EDGE FUNCTIONS

14 functions in `supabase/functions/` — all Deno TS, call OpenAI. Need deploy + `OPENAI_API_KEY` secret. Key ones: `copilot-assistant`, `generate-briefing`, `strategic-advisory`, `threat-analysis`, `patrol-anomaly-detection`, `incident-ai-summary`, `evidence-sign-url`.

```typescript
const { data, error } = await supabase.functions.invoke('name', { body: {...} });
```

---

## 7. MODULE STATUS (Summary)

| Layer | Status |
|-------|--------|
| ✅ DONE | Auth, Incidents, Investigations, Event Security, Billing & Invoicing |
| 🟡 UI DONE (partial backend) | Alarms, DOB, Control Room, Patrol Suite, CCTV, Body Cam, Staff, HR Suite, Finance Dashboard, Clients, Comms, Technical, Analytics, Executive Dashboard |
| 🔴 STUB | K9, CMC, Visitor Access, Armoury, HR sub-pages, Payroll, Payslips, Expenses, Statutory, CS, Courier, Audit, Compliance, Approvals, Directives, Tenant Admin |
| ❌ MISSING DB | CIT, K9, CMC, Armoury, Visitor, HR finance, CS, Courier tables |

👉 **Full per-module status matrix with line counts: `CLAUDE_OPERATIONS.md`**

---

## 8. BUILD ORDER (Phases A–H)

1. **Phase A — Foundation:** User mgmt + role assignment, Sites/clients seed, Staff mgmt wiring
2. **Phase B — Daily Ops:** Alarms, DOB, Patrol Suite, Comms, Control Room + Dispatch
3. **Phase C — Specialised Depts:** CCTV, Body Cam, Armoury/Visitor, K9, CIT, CMC
4. **Phase D — HR & Finance:** Payroll/payslips/expenses, Recruitment/Onboarding
5. **Phase E — Intelligence:** Deploy edge functions, wire dashboards, RTSI map
6. **Phase F — Governance:** Audit log, Compliance, Approvals, Directives, SOP/Policy
7. **Phase G — CS & Courier:** Customer service schema, Courier operations
8. **Phase H — Hardening:** Multi-tenancy, PWA, audit trail, rate limiting, envs

👉 **Full phase breakdown with SQL snippets and file lists: `CLAUDE_OPERATIONS.md`**

---

## 9. CODING RULES (Essential)

### DB Queries
```typescript
const { data, error } = await supabase.from('incidents').select('*, staff(*)').eq('status', 'open');
if (error) throw error;

// Use React Query (never supabase directly in useEffect):
const { data, isLoading } = useQuery({
  queryKey: ['incidents', filters],
  queryFn: () => fetchIncidents(filters),
});
```

### Realtime
```typescript
useEffect(() => {
  const channel = supabase.channel('incidents-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' },
      () => queryClient.invalidateQueries({ queryKey: ['incidents'] }))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

### Migrations (always idempotent)
```sql
CREATE TABLE IF NOT EXISTS public.x (...);
ALTER TABLE public.x ADD COLUMN IF NOT EXISTS c TEXT;
CREATE INDEX IF NOT EXISTS idx_x ON public.x(c);
ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p" ON public.x;
CREATE POLICY "p" ON public.x ...;
```

### Components
```typescript
const MyPage = () => {
  const { data, isLoading } = useMyHook();
  if (isLoading) return <PageLoader />;
  return (<div className="space-y-6"><PageHeader ... /></div>);
};
export default MyPage;  // safeLazy requires default export
```

### Hooks
```typescript
export const useMyFeature = () => {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['my-feature'],
    queryFn: async () => {
      const { data, error } = await supabase.from('my_table').select('*');
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async (p) => {
      const { data, error } = await supabase.from('my_table').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-feature'] }),
  });
  return { data, isLoading, create: create.mutateAsync };
};
```

---

## 10. CRITICAL DON'TS

- **NEVER** use `React.lazy()` — use `safeLazy()`
- **NEVER** read roles from `sessionStorage` — only `useAuth().userRole`
- **NEVER** write page without `default export`
- **NEVER** modify `src/integrations/supabase/client.ts` or `types.ts`
- **NEVER** call `supabase` inside component body — use hooks
- **NEVER** create RLS policy without `DROP POLICY IF EXISTS` first
- **NEVER** create non-idempotent migration
- **NEVER** access `auth.users` — use `public.profiles`
- **NEVER** hardcode Supabase URLs/keys — use `import.meta.env.VITE_*`
- **NEVER** add route without adding sidebar entry in `WorkspaceShell`

---

## 11. FILE NAMING

```
src/pages/MyPage.tsx               # PascalCase, default export
src/pages/modules/MyModule.tsx
src/pages/hr/HRSubPage.tsx
src/pages/dashboards/RoleDash.tsx
src/components/feature/MyComp.tsx
src/hooks/useMyFeature.ts
src/utils/myUtil.ts
supabase/migrations/YYYYMMDDHHMMSS_description.sql
supabase/functions/function-name/index.ts
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
# Supabase project secrets
OPENAI_API_KEY=sk-...
```

---

## 13. QUICK REFERENCE

| Need | Location |
|------|----------|
| Add route | `src/App.tsx` → `ConsoleLayout` |
| Add sidebar nav | `src/components/shell/WorkspaceShell.tsx` |
| Check permissions | `src/config/accessControl.ts` |
| Add permission module | `accessControl.ts` → `ModuleKey` + matrix |
| Guard route | `<RequireRole>` in `App.tsx` |
| Guard element | `<RequirePermission module="..." level="...">` |
| Audit trail | `import { logAudit } from "@/utils/auditLog"` |
| PDF report | `import jsPDF from "jspdf"` + `jspdf-autotable` |
| Toast | `import { toast } from "sonner"` |
| Edge function | `supabase.functions.invoke('name', { body: {} })` |
| Realtime | `supabase.channel()` in `useEffect` |
| Existing tables | `src/integrations/supabase/types.ts` |
| Apply migration | Lovable Cloud → Database → SQL Editor |
| Deploy edge fn | `supabase functions deploy function-name` |

---

## RELATED FILES

- **`CLAUDE_OPERATIONS.md`** — Detailed schema, module status matrix, build order Phases A–H, coding patterns
- **`CLAUDE_ARCHIVE.md`** — Full original CLAUDE.md (47k chars)
- **`PHASE6_MIGRATION.md`** — Evidence vault, training drills, client branding
- **`PHASE7_MIGRATION.md`** — Tenants, audit_log, user_presence, auto_dispatch, welfare, false_alarm
- **`BlackHawk_strategic_advisory_dashboard_global_map_spec.md`** — RTSI map spec
- **`fix-prompts/`** — Corrected audit prompts (React+Vite+Supabase stack)
- **`Prompts/zoo.md`** — Stack mismatch notes

---

*Split into core + operations for context window efficiency. Update both files when major sections complete.*