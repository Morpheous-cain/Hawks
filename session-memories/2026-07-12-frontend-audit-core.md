# Core-Slice Frontend & UX Audit — Black Hawk SOC-OS

**Date:** 2026-07-12
**Prompt source:** `fix-prompts/03-frontend-audit-CORE.md`
**Scope:** 5 critical-path screens (login → sites/staff → incident → dispatch)
**Stack:** React 18 + TypeScript + Vite 5 + TailwindCSS + shadcn/ui + Supabase

---

## Screen 1: Auth.tsx — Login
| Element | Current Code State | Deficiency | Fix |
|---|---|---|---|
| Sign In button | `Auth.tsx:439` `handleLogin` → zod `signinSchema` → `supabase.auth.signInWithPassword` → server role fetch from `user_roles` → `navigateToPortal`. Loading state via `disabled={loading}` ("Authenticating…"). Toast success (`"Welcome Back"`) + error (`"Authentication Failed"`). | None on critical path. | — |
| Forgot password | `Auth.tsx:276` `handleForgotPassword` → `resetPasswordForEmail` w/ redirect `/reset-password`. Toast fail/success, `disabled={loading}` missing on trigger (button is `<button type="button">`, no disable while pending). | Double-click during send possible — spams reset emails. | Add `disabled={loading}` to forgot-password button. |
| Sign up | `signupSchema` enforces 12+ chars + 4 char classes. | None — input validation solid. | — |
| Portal/rank pickers | `handlePortalSelect` / `handleManagementRoleSelect` store `selected_portal` / `selected_management_role` in sessionStorage. | Critical-path validation only. No deficiency. | — |
| Server-role override | `Auth.tsx:503-532` re-fetches role from `user_roles`, corrects mismatched portal silently, overwrites `selected_management_role`. | Good — defeats role spoofing. | — |

## Screen 2: Post-Login Dashboard
| Element | Current Code State | Deficiency | Fix |
|---|---|---|---|
| Role routing | `PlatformPage.tsx:108-117` reads `selected_management_role` from sessionStorage; if `designation !== platformId` (except `system_admin`) → `Navigate` to `/platform/${ownPlatform}`. `designationToPlatform` covers 8 DB roles + all aliases. | None on platform route. | — |
| Landing "Open Console" → `/management` | `ManagementPortalHome.tsx:14-45` only contains 23 designation aliases. **Missing canonical DB roles: `administrator`, `bdo`, `hr_custodian`, `operations_supervisor`, `control_room_officer`.** `if (!role || !map[role]) navigate("/auth")` → user with DB role `control_room_officer` hits `/management` → bounced to `/auth`. | **Critical dead-end.** Real seeded operator with DB enum role cannot reach platform via Landing "Open Console" button. Symptom: post-login bounce back to login screen. | Extend `map` in `ManagementPortalHome` to include the 5 missing canonical DB roles (mirror `designationToPlatform` in `PlatformPage.tsx:46-93`), or fall back to `userRole` from `useAuth()` instead of sessionStorage-only. |
| `/management` role source | Reads `sessionStorage.getItem("selected_management_role")` only. No `useAuth()` fallback. Deep-link/refresh that loses the flag → `/auth` even for provisioned users. | Resilience gap on hard-refresh of `/management`. | Use `useAuth().userRole` as fallback when `sessionStorage` flag empty (same fix as above). |
| Reach within 4 clicks | Login → PlatformWelcome → click "Control Room Command Centre" → `/platform/control-room/m/control-room` = 3 clicks to dispatch tab. | Within budget. | — |
| Scroll chain | `index.html:9-10` `html,body{height:100%} #root{height:100%;display:flex;flex-direction:column}`. `index.css:217` `body height:100%`, `:227 #root height:100%`. `PlatformShell.tsx:348` main `flex-1 overflow-y-auto`. WorkspaceShell `:21` same. OK everywhere **except ControlRoom** (see Screen 5). | See Screen 5. | — |
| vercel SPA rewrite | `vercel.json:3` `/(.*)` → `/index.html`. | Hard-refresh of 5 screens will not 404. Confirmed. | — |

## Screen 3: Sites/Staff Visibility (ClientManagement)
| Element | Current Code State | Deficiency | Fix |
|---|---|---|---|
| Clients table | `ClientManagement.tsx:45-58` `fetchClients` selects `clients.*, contracts(count), sites(count), risk_assessments(...)` ordered `created_at desc`. Renders `client_id`, `legal_name`, `primary_contact_name/role/phone`, `secondary_*`, `sector`, `contract_ref`, `active_sites_count`, geofence, `status`, `next_action`. | Uses real client fields from seeded schema. Field mismatch unlikely. `ScrollArea h-[600px]` inside main `overflow-y-auto` — nested scroll, mobile double-scroll likely. | Replace `ScrollArea` with plain `<div>` (main already scrolls) **OR** drop the fixed 600px height. |
| Empty state | `:224-229` `colSpan={11}` "No clients found matching your search criteria." | Empty state present **but** triggered only when `filteredClients.length === 0`. That branch fires for both zero rows AND filtered-to-zero — acceptable. | — |
| Status badge | `:271-273` `variant = status === 'active' ? 'default' : 'secondary'`; renders `status === 'pending_renewal' ? 'Pending' : client.status`. | Raw `client.status` rendered verbatim — matches DB enum. Good. | — |
| "New Client" button | `:194` `onClick={() => setShowCreateDialog(true)}`. **No `RequirePermission` / `usePermissions().can()` guard.** Governance notice `:304` states "Only Administrator, BDO, and COO can feed system." | Permission gap — every logged-in console role sees the create button. Contradicts stated policy. | Wrap `<Button>` in `<RequirePermission module="clients.management" level="create">` (or equivalent `ModuleKey` in `accessControl.ts`); add `ModuleKey` if missing. |
| View button → Detail dialog | `:282-285` opens `ClientDetailDialog` with `clientId`. | OK. | — |
| Auth redirect | `:34-37` `useEffect → navigate("/auth")` when `!authLoading && !user`. | Duplicates `ProtectedRoute` (which already mounts this route via `ConsoleLayout` under `RequireRole`). Redundant but harmless. | Defer — cosmetic only. |
| Sites/staff visibility | Sites appear only via `clients.sites(count)` aggregate. No standalone sites grid. Staff visible only inside HR Suite (`/hr`), not from ClientManagement. | Per prompt loop "sites/staff first become visible": staff reachable from ClientManagement only via detail dialog (if any). Core loop still OK because IncidentCreate dropdowns populate sites+staff from real hooks (`useIncidents` line 150-158). | No fix needed for loop; flag buried-staff as deferred. |

## Screen 4: Create/View Incident (IncidentManagement)
| Element | Current Code State | Deficiency | Fix |
|---|---|---|---|
| Create dialog | `IncidentManagement.tsx:237-298`. Required: Title, Incident Type, Severity, Occurred At, Location, Description. Client & Site are **optional** (`<Label>Client</Label>` no `*`; `<Label>Site</Label>` no `*`). | **DB schema risk:** if `incidents.site_id` or `incidents.client_id` is `NOT NULL` (usual for an incident tied to a site), Supabase insert throws — error surfaces only as toast from `useIncidents.createIncident` (`err.message`). No client-side guard. | Verify `incidents` schema in `types.ts`/migrations; if `site_id` NOT NULL, mark site `<Label>Site *</Label>` + require (`required`) + disable Submit until selected. Backend audit owns this check; flag if mismatch. |
| Site dropdown dependency | `:283` `sites.filter((s)=>s.client_id===formData.client_id)` — filtered by selected client. `disabled={!formData.client_id}` on Site select. | Correct cascading. If client optional but site mandatory, UX breaks (site disabled until client picked). Tied to above. | Same fix. |
| Staff dropdown | `:288-291` populated from `useIncidents.staff` (live `supabase.from('staff').select('id, full_name')`, line 158). | Real hook, not hardcoded. Good. | — |
| Client dropdown | `:275-278` from `useIncidents.clients` (live, line 153). | Real hook. Good. | — |
| Submit button | `:295` `<Button type="submit">Submit Report</Button>` — **no `disabled={isPending}`, no loading spinner.** Double-submit not prevented. `handleSubmit` awaits `createIncident` (async) — user can click again mid-flight. | Double-submit allows duplicate incident rows. `useIncidents.createIncident` is not a `useMutation` (plain `useCallback`), so no `isPending`. | Add local `submitting` state, `disabled={submitting}` + spinner label "Submitting…". Reset on `ok`. |
| Toasts | `useIncidents.ts:201` `toast.success("Incident reported · SOP auto-applied")` + `:204` `toast.error(err.message)`. | Both success + error via sonner. Good. | — |
| Severity badge / status badge | `:28-37` `SEV_TONE` + `STATUS_TONE` hardcoded `open/investigating/in_progress/resolved/closed`. `INCIDENT_TRANSITIONS` matches. Status `<Select>` (`:503-518`) only offers `INCIDENT_TRANSITIONS[current]` — guards illegal transitions server-side too (`useIncidents.updateStatus:212-217`). | Real enum values, no stale mock. Good. | — |
| Register table | `:489` empty state `colSpan={9}` "No incidents reported yet". | Empty state correct. | — |
| "Report Incident" button | `:239` DialogTrigger, **no `RequirePermission` / `can("ops.incidents","create")` guard.** `accessControl.ts:153` says `control_room_officer` gives `create` on `ops.incidents` — but every console role can click the button regardless of matrix. Per prompt §1: a role that shouldn't create must not see the button. | Permission bypass. CEO (`VIEW_ALL` on incidents per `accessControl.ts:107`) sees identical create button as COO (`FULL`). | Wrap `<DialogTrigger asChild>` in `<RequirePermission module="ops.incidents" level="create">` or guard with `const { can } = usePermissions(); if (!can("ops.incidents","create")) return null;` on the trigger. |
| Status transition select | `:503-518` live enum from `INCIDENT_TRANSITIONS`. | Good. | — |
| Resolve dialog | `:548` `disabled={resolveNotes.trim().length < 10}` — enforces 10-char notes. Double-submit prevented (button disabled). | Good. | — |

## Screen 5: Dispatch (ControlRoom + DispatchFleetControl)
| Element | Current Code State | Deficiency | Fix |
|---|---|---|---|
| ControlRoom mount scroll | `ControlRoom.tsx:159` outer `<div className="min-h-screen bg-background">` nested inside `PlatformShell` `main` (`flex-1 overflow-y-auto`) **and** inside `WorkspaceShell` `main` (`overflow-y-auto`, page mounted at `/control-room`). `min-h-screen` = 100vh inside an already-scrolling flex column → outer main grows to fit 100vh child, inner content overflow creates **second** scrollbar. | **Re-broken scroll on ControlRoom specifically** (audit "verify on these 5 screens" — this one fails). Desktop: nested scroll, sticky tabs shift. Mobile 430px: `min-h-screen` + operator bar + module-health stack forces outer main to scroll AND inner page attempts own scroll → janky/two-finger scroll. | Remove `min-h-screen` from `ControlRoom.tsx:159` outer div. Use `className="space-y-4"` (let shell main own scroll). Same fix applies at `/control-room` route (WorkspaceShell context) and `/platform/.../m/control-room` (PlatformShell context). |
| ControlRoom auth source | `:108-118` `supabase.auth.getUser()` → `profiles` → `setOperatorInfo`. `:121-156` `initializeShift` writes `shift_logs` row if none active. **Bypasses `useAuth()` hook** — direct supabase call inside component body. CLAUDE.md §10 "NEVER call supabase inside component body — use hooks." Also no toasts; shift creation failure swallowed (`if (newShift)` only sets state on truthy). | Style-rule violation + silent shift-init failure. On RLS-blocked insert, operator sees "Initializing…" shift ID forever, no toast. | Move fetch/init into `useControlRoomShift()` hook; `toast.error` on insert failure. Defer as non-core if shifts non-blocking. |
| ControlRoom tabs | 11 tabs (hub/operations/incidents/alarms/dispatch/comms/welfare/cctv/shift/analytics/settings). `TabsList grid-cols-4 lg:grid-cols-11`. | Mobile 430px: 11-col grid with text labels overflows horizontally, labels truncate awkwardly. Friction not blocking. | Consider horizontal scrollable TabsList on mobile (pragmatic, not redesign). Defer. |
| DispatchFleetControl data | `:23-40` `fetchVehicles` → `supabase.from('vehicles').select('*').eq('is_active', true)`. Polls every 10s via `setInterval`. No loading state, no error toast (only `const { data } = await` — error ignored). | No loading spinner (blank grid during fetch), no error feedback to operator on RLS/fetch fail. | Add `loading` state + `toast.error` on `error`. |
| DispatchFleetControl stats | `:33-38` `enRoute: 0, onScene: 0` hardcoded with comment "Would need status tracking". `available`/`deployed` derived from `current_assignment` (string) null check. | Stats partly fake — En Route / On Scene tiles always show 0. Misleading to operator on critical path. | Either hide the two non-functional tiles, or fetch `vehicle_status` field (see `getStatusColor:52-56` already handles `en_route`/`on_scene` — wire stats to same field). |
| **Dispatch button** | `:168` `<Button size="sm" variant="outline" className="text-xs">Dispatch</Button>` — **NO `onClick` handler.** Track (`:164`), Contact (`:170`) also dead. | **Critical broken dispatch action.** Core loop terminates here: incident opened but cannot be dispatched to this vehicle. Button is inert. | Wire `onClick` on Dispatch button to open an assignment dialog bound to a `useDispatch` hook (or at minimum `navigate(`/incidents`)` filtered to active + prefill `assigned_vehicle_id`). Per backend audit "wherever dispatch actually lives" — this IS the dispatch surface and it is non-functional. |
| Status badge on vehicle | `:144-147` `<Badge className={getStatusColor(status)}>` shows `status` from `getVehicleStatus` which only returns `'available'` or `'deployed'`. Real enum has `en_route` / `on_scene` per `getStatusColor:53-54` switch. | Stale mock binary status overwrites richer DB enum. | Source badge from `vehicle.vehicle_status` (DB field) instead of derived binary. |
| Permission on dispatch | No `RequirePermission` on the (dead) Dispatch button or the Dispatch tab. Per prompt §1: `control_room_officer` sees dispatch button (good — `accessControl.ts:152` `ops.dispatch: FULL`), but `ceo`/others also see it (`accessControl.ts:118` coo full, `:107` ceo VIEW_ALL on controlRoom). | Per matrix, VIEW_ALL roles should see dispatch **view** but not action. Currently moot (button dead), but when wired must check `can("ops.dispatch","edit")`. | Wire permission gate when implementing `onClick`. |
| Loop reach to dispatch | Path `/platform/control-room/m/control-room` → Dispatch tab → DispatchFleetControl. 4 clicks from login (login → welcome → platform module → dispatch tab). | Within 4-click budget. | — |

## Loop Completion Verdict

**Cannot complete end-to-end right now.** Two blocking failures in order:

1. **Routing dead-end (Screen 2 — blocker A).** A real operator with seeded DB role `control_room_officer` (one of the 8 canonical `app_role` enum values) who lands via the "Open Console" button on `Landing` → `/management` is bounced to `/auth` because `ManagementPortalHome.tsx:14-45` `map` omits 5 of the 8 canonical DB roles (`administrator`, `bdo`, `hr_custodian`, `operations_supervisor`, `control_room_officer`) and only consults `sessionStorage` (no `useAuth().userRole` fallback). Login works (Auth.tsx routes `control_room_officer` directly to `/platform/control-room`), but any flow that passes through `/management` regresses the bug "No Role Assigned"/bounce that was claimed fixed tonight. **Fix:** extend `map` with the 5 missing roles + use `useAuth().userRole` as fallback source.

2. **Dispatch action inert (Screen 5 — blocker B).** Even after login + sites/clients visible + incident created, the terminal loop step — dispatching that incident — fails at `DispatchFleetControl.tsx:168`: the **"Dispatch" button has no `onClick`**. Track and Contact buttons are also dead. The operator can see vehicles but cannot assign one. **Fix:** wire `onClick` to an assignment mutation (with a `useDispatch`/`useVehicles` hook), add `isPending` on the button and a `RequirePermission`/`can("ops.dispatch","edit")` gate.

Secondary correctness issues that do not block the loop but should batch with the above:

- `IncidentManagement` create form: Site/Client optionality likely mismatches DB NOT NULL constraints (verify against schema). Submit button lacks `isPending` → double-submit duplicates.
- `ClientManagement` "New Client" button has no `RequirePermission` despite governance notice restricting to Admin/BDO/COO.
- `IncidentManagement` "Report Incident" trigger has no `RequirePermission`/`can("ops.incidents","create")` gate — every console role sees it.
- `ControlRoom.tsx:159` `min-h-screen` breaks scroll chain specifically on this screen (nested scrollbar, mobile jank).
- `DispatchFleetControl` `enRoute`/`onScene` stat tiles hardcoded 0 (misleading); no loading/error toast on vehicle fetch; status badge collapses real DB `en_route`/`on_scene` enum to binary.
- `ControlRoom.tsx` calls `supabase` directly in component body (CLAUDE.md violation) and swallows shift-init errors.

## Deferred — Not Core (one-line mentions only)
- `ClientManagement` redundant `navigate("/auth")` effect alongside `ProtectedRoute`.
- Mobile 11-tab `TabsList` in ControlRoom truncates on 430px viewport.
- `Forgot password` trigger lacks `disabled={loading}`.
- Staff visibility buried in HR Suite, not surfaced from ClientManagement — fine for loop, revisit later.
