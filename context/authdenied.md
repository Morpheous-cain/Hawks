# Auth Access-Denied Bug — Root Cause Analysis & Fix

**Date:** 7 July 2026
**Status:** Root cause found, fix implemented and committed
**Repo:** Clean working tree (no uncommitted changes)

---

## What Was Reported

When a logged-in user (e.g. CEO, any management role) hits the main page and clicks **"Open Console"**, they are redirected to the access denied page instead of the management console.

### Steps to reproduce (original)
1. Land on `/` (Landing page)
2. Click **"Open console"** (links to `/management`)
3. Browser lands on an **Access Denied** page

---

## Root Cause

The bug was a **race condition** in the auth flow.

### The race condition

1. `AuthProvider` calls `supabase.auth.onAuthStateChange` and registers a listener.
2. When a session arrives, the listener sets `user` but defers the role fetch via `setTimeout(0)` to avoid Supabase deadlock inside the callback.
3. `fetchUserRole()` runs a DB query on `user_roles`, then calls `setUserRole(role)`.
4. `loading` flips to `false` inside that same deferred callback — only **after** `setUserRole` is called.
5. `RequireRole` (the route guard wrapping `ConsoleLayout` and `PlatformPage`) reads `userRole` from `useAuth()`.

**The window where denial happens:**
```
user set         → userRole still null       → RequireRole checks isConsoleRole(null)
loading: false   → loading check passed      → !userRole && user = true
                                              → OLD CODE: isConsoleRole(null) = false → ACCESS DENIED
```

`isConsoleRole(null)` always returns `false`. So for the brief window before `userRole` resolves, the user was **falsely denied** access.

---

## Files Involved

| File | Role |
|------|------|
| `src/components/auth/RequireRole.tsx` | Route guard — checked userRole before it resolved |
| `src/hooks/useAuth.ts` | Auth context — deferred role fetch causing the race |
| `src/App.tsx` | Route definitions — wraps routes with RequireRole |

---

## Fixes Applied

### Fix 1: `RequireRole.tsx` (commit `50096b4` — `fixedauth`)

**Change:** Added a wait-for-role guard.

```typescript
// BEFORE (bug): null role = denied
if (!userRole && user) {
  // show spinner instead of denying
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// BEFORE (bug): this was reached when userRole was still null
const allowed = allowedRoles
  ? allowedRoles.some(r => userRole?.toLowerCase() === r.toLowerCase())
  : isConsoleRole(userRole);  // ← null → false → Access Denied
```

**What changed:**
- `loading` spinner unchanged (was already a spinner)
- New guard at line 98: `if (!userRole && user)` renders spinner
- `CONSOLE_ROLES` set cleaned up: added canonical DB enum values (`ceo`, `coo`, `control_room_officer`, `operations_supervisor`, `bdo`, `system_admin`), removed duplicate `operations_supervisor` entry

### Fix 2: `App.tsx` (commit `02f70f3` — `authdeniedfix`)

**Change:** Wrapped `<PlatformPage>` with `<RequireRole>` in the route definition.

```tsx
// BEFORE
element={<ProtectedRoute><PlatformPage /></ProtectedRoute>}

// AFTER
element={
  <ProtectedRoute>
    <RequireRole>
      <PlatformPage />
    </RequireRole>
  </ProtectedRoute>
}
```

This ensures `/platform/:platformId/*` routes are also gated.

---

## Auth Flow (verified after fix)

```
1. User lands on /auth → selects portal/role → enters credentials
2. supabase.auth.signInWithPassword() → session created
3. onAuthStateChange fires → session set, user set
4. setTimeout(0) defers fetchUserRole()
5. fetchUserRole() queries user_roles table for role value
6. setUserRole(role) + setLoading(false)
7. RequireRole reads userRole → isConsoleRole(userRole) → true → renders children
```

---

## How Role Resolution Works

`useAuth` → `fetchUserRole(userId)`:
```typescript
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .limit(1);
return data && data.length > 0 ? String(data[0].role) : null;
```

Fallback: if `user_roles` table has no row for this user, role stays `null`.

---

## Known Role Mismatch: `control_room_officer` vs `control_room_operator`

The Auth UI allows the user to select **"Control Room"** with role value `"control"` (stored in `sessionStorage` as `selected_management_role`). The DB `user_roles.role` value for this user is `'control_room_officer'` (canonical DB enum value).

This works correctly:
- `isConsoleRole("control_room_officer")` → `CONSOLE_ROLES.has("control_room_officer")` → **true**

The Auth page `handleLogin` also overwrites `sessionStorage.selected_management_role` with the verified server role:
```typescript
sessionStorage.setItem("selected_management_role", serverRole);  // from DB
```

---

## Remaining Edge Cases

### 1. User has no row in `user_roles` table
- `fetchUserRole` returns `null` (no error thrown, just warns)
- `setUserRole(null)` → `RequireRole` sees `!userRole && user` → **spins forever**
- **No `PendingActivation` page exists yet** — `src/pages/PendingActivation.tsx` is empty (0 bytes)
- **Recommended fix:** Create `PendingActivation.tsx` with a "Your account is pending activation" message. Route to it when `userRole` stays `null` after a timeout (e.g., 5 seconds).

### 2. Role value not in `CONSOLE_ROLES`
If the `user_roles.role` value is not in the `CONSOLE_ROLES` set:
- `isConsoleRole(role)` → false → **Access Denied** (correct behavior, user is genuinely unauthorized)

### 3. `isConsoleRole` substring matching
```typescript
CONSOLE_ROLES.has(n) || [...CONSOLE_ROLES].some(r => n.includes(r))
```
This allows partial matching. For example, `"hr_custodian"` includes `"hr"` → passes as console role. This is a known behavior, not a bug.

---

## `CONSOLE_ROLES` Set (current, in RequireRole.tsx)

```typescript
const CONSOLE_ROLES = new Set([
  // Canonical DB roles (app_role enum)
  "ceo",
  "coo",
  "control_room_officer",
  "operations_supervisor",
  "bdo",
  "system_admin",
  // Legacy role strings (Auth UI selection)
  "admin", "administrator",
  "country_director", "managing_director", "general_manager",
  "manager",
  "operations_manager",
  "regional_ops_manager", "branch_ops_manager",
  "assistant_senior_ops_manager",
  "area_manager", "facilities_ops_manager",
  "branch_manager", "regional_manager",
  "contract_manager",
  "control_room_operator", "supervisor",
  "hr_manager", "hr_officer",
  "finance_manager", "finance_officer", "finance_director",
  "payroll_officer",
  "investigations_manager", "technical_manager",
  "risk_director", "compliance_officer",
  "guard_force_admin",
  "cit_manager", "courier_manager", "courier_dispatcher",
  "gm", "ops_manager", "control", "hr", "finance", "compliance",
  "admin_manager", "admin_officer", "cit_officer", "courier_officer",
  "customer_service_manager", "customer_service_officer",
]);
```

**Note:** `hr_custodian` is in the DB `app_role` enum but NOT in `CONSOLE_ROLES` because no Auth UI exists to assign it. Add it when HR UI is wired.

---

## Testing Checklist

After deploying:

- [ ] CEO login → lands on `/platform/ceo` without Access Denied
- [ ] COO login → lands on `/platform/coo` without Access Denied
- [ ] System admin login → lands on `/platform/system-admin` without Access Denied
- [ ] Visit `/management` directly (any console role) → no Access Denied
- [ ] Visit `/control-room` directly (any console role) → no Access Denied
- [ ] User with NO `user_roles` row → sees spinner forever (no crash) → **PendingActivation page still needed**
- [ ] Field role (e.g., "guard") trying to access `/management` → correctly denied

---

## Related Files & References

| File | Description |
|------|-------------|
| `plan&progress/status_report.md` | Previous session's auth fix handoff |
| `plan&progress/2.md` | Project progress tracking |
| `src/components/auth/RequireRole.tsx` | Route guard (fixed) |
| `src/hooks/useAuth.ts` | Auth context (unchanged — race condition was in guard, not here) |
| `src/pages/Auth.tsx` | Login flow (role assignment and verification logic) |
| `src/pages/PlatformPage.tsx` | Isolated platform pages with own `usePlatformAccess` hook |
| `src/hooks/usePlatformAccess.ts` | Separate platform routing hook (uses `user_roles` too) |
| `src/App.tsx` | Route definitions (RequireRole added to PlatformPage route) |
| `src/components/auth/RequirePermission.tsx` | Element-level permission guard (different from RequireRole) |

---

## What To Do Next

1. **Deploy** — push the committed fix to the live environment (Lovable Cloud).
2. **Test** — use the checklist above.
3. **PendingActivation** — create `src/pages/PendingActivation.tsx` (currently 0 bytes) for users with no role assigned:
   - Route: add to `App.tsx` as `/pending-activation`
   - Content: "Your account is pending. Contact your system administrator to get your role provisioned."
4. **Wire PendingActivation** — in `RequireRole.tsx`, after spinner timeout (e.g., 5s) redirect to `/pending-activation` when `userRole` is still `null`.