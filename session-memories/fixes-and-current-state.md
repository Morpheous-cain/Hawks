---
name: fixes-and-current-state
description: Complete record of fixes, current state, and learnings from guard portal session
metadata:
  type: project
  originSessionId: current
---

# Fixes & Current State — Alpha Pride Security (Black Hawk SOC-OS)

**Session Date:** 2026-07-15
**Branch:** guard-portal-trim
**Base Commit:** 7f3c956 (field-portal-feature-audit)

---

## Executive Summary

This session resolved **two blocking core-loop bugs** from the 2026-07-12 frontend audit, added missing permission guards, fixed a migration FK reference, and **refactored the guard field portal Clock tab** to auto-populate from the logged-in guard's context instead of showing dropdowns.

All changes verified: `npm run build` ✓, `npx tsc --noEmit` ✓.

---

## 1. Core-Loop Blockers (from audit 2026-07-12)

### Blocker #1: ManagementPortalHome Role-Map Omission

**File:** `src/pages/ManagementPortalHome.tsx`

**Problem:** The role map only had 23 designations — missing 5 canonical DB `app_role` enum values. Users with those roles hitting `/management` were bounced to `/auth`. Also relied solely on `sessionStorage` with no `useAuth().userRole` fallback.

**Fix:**
```typescript
const { userRole } = useAuth();  // Added hook
const role = sessionRole || userRole;  // Fallback chain

// Added 5 canonical roles + 35+ aliases from PlatformPage.tsx
const map: Record<string, string> = {
  // ... existing 23 ...
  administrator: "/platform/coo",
  bdo: "/platform/ops-manager",
  hr_custodian: "/platform/hr-manager",
  operations_supervisor: "/platform/ops-manager",
  control_room_officer: "/platform/control-room",
  // + 35 more from PlatformPage.tsx
};
```

**Impact:** Any user with a valid DB role now routes correctly to their platform.

---

### Blocker #2: Dead Dispatch/Track/Contact Buttons

**File:** `src/components/control-room/DispatchFleetControl.tsx`

**Problem:** Three buttons had no `onClick` handlers — core loop terminated at dispatch assignment.

**Fix:**
- Added `handleDispatch()` — creates dispatch request via `useDispatch` hook + marks vehicle assigned via `useVehicles.updateVehicle()`
- Added `handleTrack()` — opens Google Maps with GPS coords
- Added `handleContact()` — placeholder alert (ponytail: wire to real crew contact)
- Wrapped Dispatch with `<RequirePermission module="ops.dispatch" level="edit">`
- Added loading state (`isCreatingDispatchRequest`) + disabled when vehicle already assigned
- Replaced raw Supabase queries with `useVehicles`/`useDispatch` hooks

**Impact:** Control room officers can now dispatch vehicles end-to-end.

---

## 2. Secondary Permission Guards

### ClientManagement.tsx — "New Client" Button

**File:** `src/pages/ClientManagement.tsx`

```tsx
<RequirePermission module="client.management" level="create">
  <Button onClick={() => setShowCreateDialog(true)}>
    <Plus className="w-4 h-4" /> New Client
  </Button>
</RequirePermission>
```

### IncidentManagement.tsx — "Report Incident" Button

**File:** `src/pages/IncidentManagement.tsx`

```tsx
<RequirePermission module="ops.incidents" level="create">
  <DialogTrigger asChild>
    <Button><Plus className="h-4 w-4 mr-2" /> Report Incident</Button>
  </DialogTrigger>
</RequirePermission>
```

---

## 3. Migration Fix

### 20260714000000_field_portal_phase2.sql

**Problem:** 4 FK references to `public.client_sites(id)` — table is named `sites`.

**Fix:** All 4 occurrences changed to `public.sites(id)`:
- `visitor_logs.site_id`
- `vehicle_inspections.site_id`  
- `key_custody_logs.site_id`
- `site_audits.site_id`

---

## 4. Guard Field Portal Clock Tab Refactor

### OfficerClockScreen.tsx — Major Refactor

**Goal:** Remove dropdowns, auto-populate from logged-in guard's context.

**Before:** Component accepted `officerId`/`siteId` props, showed "Select Officer" dropdown (fetching all active staff) and "Select Site" dropdown (hardcoded fallback sites).

**After:** Component derives everything from auth context.

#### Key Changes:

| Aspect | Before | After |
|--------|--------|-------|
| Props | `officerId?: string, siteId?: string` | None (auto-derived) |
| Officer selection | Dropdown with all active staff | Read-only card showing logged-in guard's name, position, staff ID |
| Site selection | Hardcoded 5 sites + DB fallback | `assignedSites` from `useOfficerAssignments()` (real DB data) |
| Auto-select site | None | First assigned site |
| Internal state | `selectedOfficer`, `staffMembers[]` | `officerId`, `officerName` from context |
| Clock actions | Used `selectedOfficer` | Use `officerId` directly |
| Button disabled | `!selectedOfficer` | `!officerId` |

#### Code Changes:

```tsx
// Added hooks
const { user } = useAuth();
const { staffRecord, assignedSites, isLoading: assignmentsLoading } = useOfficerAssignments();
const officerId = staffRecord?.id;
const officerName = staffRecord?.full_name;

// Removed: fetchStaffMembers(), selectedOfficer state, staffMembers state
// Added: auto-select first assigned site
useEffect(() => {
  if (assignedSites.length > 0 && !selectedSite) {
    setSelectedSite(assignedSites[0].id);
  }
}, [assignedSites, selectedSite]);

// Render: Officer display (no dropdown)
<div className="mt-1 p-3 bg-muted/30 rounded-lg border border-muted/20 flex items-center gap-3">
  <User className="h-5 w-5 text-muted-foreground" />
  <div className="flex-1">
    <p className="font-medium">{officerName || 'Unknown Officer'}</p>
    <p className="text-xs text-muted-foreground">{staffRecord?.position || 'Guard'}</p>
  </div>
  <Badge variant="outline" className="text-xs">{staffRecord?.staff_id || '—'}</Badge>
</div>

// Site select populated from assignedSites
<Select value={selectedSite} onValueChange={setSelectedSite}>
  <SelectContent>
    {sites.map(site => (
      <SelectItem key={site.id} value={site.id}>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          {site.name}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Files Affected:
- `src/components/patrol/OfficerClockScreen.tsx` — Full refactor

---

## 5. Current State

### Guard Field Portal — 7 Visible Modules (per `field-portal-guard-trim`)

| Module | Component | Backend Status |
|--------|-----------|----------------|
| Clock | `OfficerClockScreen` | ✅ Wired (attendance, sites, staff) |
| Pre-Shift Brief | `PreShiftBriefing` | ✅ Wired (incidents, casts `as any`) |
| Welfare Check | `WelfareCheck` | ⚠️ Needs `welfare_heartbeats` table (migration pending) |
| HQ Connect | `HQConnect` | ⚠️ Needs `hq_*` tables (migration pending) |
| Field OB | `FieldOpsOBPanel` | ✅ Wired (dob_entries) |
| Report Incident | `FieldIncidentReport` | ✅ Wired (incidents + realtime) |
| Bodycam | `OfficerBodyCamApp` | ⚠️ Upload simulated (needs Storage + edge fn) |

### Pending Migrations (need Lovable Cloud deploy)

1. **20260714000000_field_portal_phase2.sql** — `welfare_heartbeats`, `visitor_logs`, `vehicle_inspections`, `key_custody_logs`, `parcel_logs`, `drill_completions`, `site_audits`
2. **20260714010000_hq_connect.sql** — `hq_messages`, `guard_status_beacons`, `hq_broadcasts`, `hq_broadcast_acks`, `hq_directives`, `hq_backup_requests`

### TypeScript Types

After migration deploy, `src/integrations/supabase/types.ts` will regenerate. Current components use `(supabase as any)` casts for new tables — correct interim pattern per CLAUDE.md.

---

## 6. Key Learnings & Patterns

### Auth & Role Routing
- **Never** read roles from `sessionStorage` alone — always fall back to `useAuth().userRole`
- Role maps must include all canonical DB `app_role` enum values + frontend aliases
- Exact-match priority in `usePlatformAccess.ts` prevents `field_supervisor` → `supervisor` false Console redirect

### Permission Guards
- Use `<RequirePermission module="..." level="...">` on **every** create/edit/delete action
- Module keys defined in `src/config/accessControl.ts` → `ModuleKey` type
- Audit log auto-recorded on denial via `RequirePermission` component

### Data Fetching
- **Never** call Supabase directly in components — use TanStack Query hooks (`useVehicles`, `useDispatch`, `useIncidents`, etc.)
- Hooks handle caching, invalidation, loading states
- Realtime via `supabase.channel()` in `useEffect` with cleanup

### Migrations
- Always idempotent: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS`
- FK references must match actual table names (`sites` not `client_sites`)
- After deploy, `types.ts` auto-regenerates — never edit manually

### Field Portal Architecture
- `FieldApp.tsx` orchestrates: `useOfficerAssignments()` → provides `staffRecord`, `assignedSites` to dashboard + modules
- Modules lazy-loaded via `moduleComponents` map
- `RankDashboard` → `MissionBriefHero` + `QuickActionGrid` + `StickyTacticalBar`
- Guard rank filtered to 7 modules via `GUARD_VISIBLE_MODULES` in `rankSidebarConfig.ts`

---

## 7. Next Steps (Unblocked)

### Immediate (after migration deploy)
1. Apply 2 pending migrations via Lovable Cloud SQL Editor
2. Verify `types.ts` regenerates with new tables
3. Remove `(supabase as any)` casts in `WelfareCheck.tsx`, `HQConnect.tsx`, `OfficerBodyCamApp.tsx`

### Enhancements
1. **Bodycam** — Replace simulated upload with Supabase Storage + `evidence-sign-url` edge function
2. **OfficerClockScreen** — Add shift-type selection (day/night), break tracking
3. **HQ Connect** — Wire real PTT/audio, broadcast ack flow
4. **Welfare Check** — Add automated missed-checkin alerts to control room

### Technical Debt
- `DispatchFleetControl` enRoute/onScene stats hardcoded 0 — need vehicle status tracking
- `ControlRoom.tsx` `min-h-screen` inside shell breaks scroll chain
- Missing `RequirePermission` on several console pages (audit finding)

---

## 8. Related Memories

- [[core-loop-blockers]] — Two blocking bugs in login→sites→incident→dispatch loop
- [[field-portal-guard-trim]] — Guard rank trimmed to 7 modules
- [[field-app-roles-routing]] — Platform routing by exact match priority
- [[field-portal-auth-scroll]] — Auth rank selection scroll fix
- [[guard-module-backend-plan]] — Guard module backend integration plan (7 modules, 2 migrations)
- [[session-2026-07-15-guard-clock-fixes]] — This session's detailed log

---

## 9. Git Status

```
Modified:
  src/components/control-room/DispatchFleetControl.tsx
  src/components/patrol/OfficerClockScreen.tsx
  src/pages/ClientManagement.tsx
  src/pages/IncidentManagement.tsx
  src/pages/ManagementPortalHome.tsx
  supabase/migrations/20260714000000_field_portal_phase2.sql
```

**Branch:** `guard-portal-trim` (clean, builds pass)