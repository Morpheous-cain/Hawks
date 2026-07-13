# Core-Slice Frontend & UX Audit — Black Hawk SOC-OS

**Run this THIRD, after the database audit and backend audit fixes are applied.**
**Scope: ONLY the screens in the core loop below.**

---

## The Finish Line This Audit Serves

> **Login → see real seeded sites & staff → open an incident → dispatch it.**

By the time this audit runs, the DB should have real seed data and the hooks should be reading/writing it correctly. This audit checks whether a real operator can actually *use* the screens to complete that loop without confusion, dead ends, or silent failures.

---

## System Prompt

Role: Elite UX Auditor & Senior Frontend Engineer (React 18 + TypeScript + Vite 5 + TailwindCSS + shadcn/ui)
Task: Walk through exactly these five screens in the order a real user would hit them, and audit every interactive element on the path — nothing else.

**The five screens, in loop order:**
1. `src/pages/Auth.tsx` — login
2. `src/pages/PlatformPage.tsx` + landing dashboard for whichever role logs in — first screen after login
3. `src/pages/ClientManagement.tsx` or wherever sites/staff first become visible — confirm this is actually reachable from the post-login dashboard, not buried
4. `src/pages/IncidentManagement.tsx` — creating and viewing an incident
5. `src/pages/ControlRoom.tsx` → `src/components/control-room/DispatchFleetControl.tsx` (or wherever dispatch actually lives per the backend audit's findings) — dispatching that incident

## Known Facts Going In (verify, don't rediscover)

- Login routing was recently fixed so all known DB roles (`ceo`, `coo`, `control_room_officer`, `operations_supervisor`, `hr_custodian`, `administrator`, `bdo`, `system_admin`) plus legacy aliases resolve to a valid `/platform/*` route. Confirm the specific role your test account has actually lands somewhere sensible and not a generic fallback that hides real functionality.
- `vercel.json` SPA rewrite was added to fix 404s on hard-refresh of client routes (e.g. `/auth`). Confirm hard-refreshing each of the 5 screens above does not 404.
- Scroll was fixed at the `WorkspaceShell.tsx` / `index.css` / `index.html` level (`html, body, #root` height chain). Confirm all 5 screens scroll correctly on both desktop and a mobile viewport (iPhone 14 width, 430px) — this was previously broken across the whole app, re-verify it specifically on these 5 screens since they weren't individually checked before.

## Instructions

For **each of the 5 screens**, and only the elements directly on the critical path (ignore settings icons, help menus, unrelated tabs):

1. **Every button/action on the path**
   - What does it execute — trace onClick → handler → mutation/query.
   - Is there a loading state while the mutation runs (spinner, disabled button, skeleton)?
   - Is there a success toast and an error toast (`sonner`)?
   - Does the button respect `RequirePermission`/`usePermissions().can()` correctly for the test role being used — i.e. does a `control_room_officer` see the dispatch button, and does a role that shouldn't dispatch NOT see it (or see it disabled with a clear reason)?

2. **Data tables on the path (sites list, staff list, incidents list)**
   - Once real seed data exists, does the table render it correctly, or is there a hardcoded column/field mismatch from when the UI was built against mock data?
   - Is there a correct **empty state** if a table genuinely has zero rows (e.g. zero incidents on day one) — not a blank white space or a spinner that never resolves?
   - Confirm status badges (incident status, dispatch status) use real enum values from the DB, not stale mock string values that no longer match.

3. **Forms on the path (create incident, dispatch assignment)**
   - Confirm Zod/React Hook Form validation matches what the DB actually requires (e.g. if `site_id` is `NOT NULL`, the form must require selecting a site, not allow submission with an empty dropdown).
   - Confirm dropdowns for site/staff selection are populated from the real hooks identified in the backend audit — not a stale hardcoded array left over from before seed data existed.
   - Confirm disabled/`isPending` state on the submit button during the mutation, and that double-submit is prevented.

4. **Dead ends & broken navigation on the path only**
   - Does "Open Console" from wherever it appears reliably land on a screen that leads toward this loop, not a stub page?
   - Are there any `useNavigate()` targets on these 5 screens pointing to routes that don't exist in `App.tsx`?
   - Confirm the whole loop is reachable within 4 clicks or fewer from login — if it takes more, flag exactly where the friction is and suggest the shortest fix (not a redesign).

5. **RequireRole / route guard sanity on these 5 routes specifically**
   - Confirm none of the 5 routes throw the "No Role Assigned" or "Access Denied" screens for any of the known valid DB roles — this was the exact bug fixed earlier tonight; this audit is the regression check for it, specifically on these 5 screens.

## Output Format

```markdown
## Screen 1: Auth.tsx — Login
| Element | Current Code State | Deficiency | Fix |

## Screen 2: Post-Login Dashboard
| Element | Current Code State | Deficiency | Fix |

## Screen 3: Sites/Staff Visibility
| Element | Current Code State | Deficiency | Fix |

## Screen 4: Create/View Incident
| Element | Current Code State | Deficiency | Fix |

## Screen 5: Dispatch
| Element | Current Code State | Deficiency | Fix |

## Loop Completion Verdict
State plainly: can a real user complete login → sites/staff visible → open incident → dispatch, end to end, right now? If not, list the exact blocking steps in order.

## Deferred — Not Core (one-line mentions only)
```

Do not audit any screen outside the 5 listed, even if you notice something while navigating (e.g. don't audit HR, Finance, CIT, K9, CCTV screens even if a sidebar link is visible during the walkthrough).
