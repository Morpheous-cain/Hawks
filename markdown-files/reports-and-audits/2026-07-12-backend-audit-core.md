## 1. Auth Flow — Confirmed Safe / Issues Found
Confirmed safe. `loading` state logic in `src/hooks/useAuth.ts` correctly blocks rendering until role fetch settles. `RequireRole.tsx` safely manages hooks. `signOut` scope `global` ensures clean exit. No hooks called after conditional returns.

## 2. Staff & Sites & Clients — Current State + Minimal Hooks Needed (with code)
`StaffManagement.tsx` queries `staff` inline (`src/pages/StaffManagement.tsx:46`). `ClientManagement.tsx` queries `clients` inline (`src/pages/ClientManagement.tsx:47`). Minimal hooks `useStaff.ts` and `useClients.ts` recommended for consistency and cache invalidation.

**Minimal `src/hooks/useStaff.ts`**
```typescript
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStaff = () => {
  const [data, setData] = useState<any[]>([]);
  const fetchStaff = useCallback(async () => {
    const { data, error } = await supabase.from("staff").select("*");
    if (error) { toast.error("Failed to load staff"); return; }
    setData(data);
  }, []);
  return { data, fetchStaff };
};
```

## 3. Incidents — Trace + Fixes
Robust. `useIncidents.ts` uses real Supabase queries with realtime subscriptions. It properly cleans up channels on unmount (`line: 186`). No logic issues found.

## 4. Alarms — Trace + Fixes
Robust. `useAlarms.ts` uses parallel data fetching (`line: 80`) and cleans up realtime channels (`line: 162`). No hardcoded references to `auto_dispatch_rules` found.

## 5. Dispatch / Control Room — Trace + Minimal Hook Needed (with code)
`DispatchFleetControl.tsx` is mock-heavy (stats calculated client-side from `vehicles` only, `line: 33`). `AssignmentCommandHub.tsx` reads `dispatch_requests` table inline (`line: 23`). A dedicated hook is needed.

**Minimal `src/hooks/useDispatch.ts`**
```typescript
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDispatch = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const fetchRequests = useCallback(async () => {
    const { data } = await supabase.from("dispatch_requests").select("*");
    setRequests(data || []);
  }, []);

  useEffect(() => {
    fetchRequests();
    const ch = supabase.channel("dispatch").on("postgres_changes", { event: "*", schema: "public", table: "dispatch_requests" }, fetchRequests).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchRequests]);

  return { requests };
};
```

## 6. DOB — Trace + Fixes
**CRITICAL:** `useDOBEntries.ts` queries `deleted_at` column (`line: 129`, `line: 198`, `line: 209`) which does not exist in `dob_entries` schema (verified via `types.ts`). This WILL cause a runtime SQL error. Fix: Remove `deleted_at` query filter or apply the corresponding migration.

## 7. Realtime Cleanup Check
`useIncidents.ts`, `useAlarms.ts`, `useDOBEntries.ts`, and `ControlRoom.tsx` all properly implement realtime channel cleanup in `useEffect` return functions.

## 8. Deferred — Not Core
CIT, K9, HR, Payroll, etc., deferred per instructions.
