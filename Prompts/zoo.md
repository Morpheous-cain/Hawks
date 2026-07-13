# Stack Audit — Prompt Files vs Actual

The existing audit prompts (`/Prompts`) assume a **Next.js + Go/Fiber + PostgreSQL** stack. The actual project is **React + Vite + Supabase** (Deno TypeScript Edge Functions).

## Stack Comparison

| Component | Prompts Assume | Actual Stack |
|-----------|---------------|--------------|
| **Frontend framework** | Next.js (pages/router) | React 18 + Vite 5 (SPA, client-side routing) |
| **Frontend routing** | Next.js file-based | React Router v6 (`src/App.tsx`) |
| **UI library** | shadcn/ui + TailwindCSS | shadcn/ui + TailwindCSS ✅ (no change) |
| **State/queries** | React Query | TanStack React Query v5 ✅ (same thing) |
| **Backend runtime** | Go + Fiber | Supabase Edge Functions (Deno/TypeScript) |
| **Backend language** | Go | TypeScript (Deno) |
| **API calls** | `fetch()` to Go handlers | `supabase.functions.invoke('name')` |
| **Database access** | Go models/repos/SQL | `supabase.from('table').select()` + direct SQL in migrations |
| **Database client** | Go `database/sql` | Supabase JS client (typed via `types.ts`) |
| **Auth** | Go JWT middleware | Supabase Auth (`supabase.auth.onAuthStateChange`) |
| **RBAC enforcement** | Go middleware on routes | DB `app_role` enum + RLS policies + `accessControl.ts` frontend matrix |
| **DB ORM/query builder** | Raw Go SQL | supabase-js query builder |
| **Migrations** | Go migration files | SQL files in `supabase/migrations/` |
| **Realtime** | WebSocket or polling | Supabase Realtime (`supabase.channel()`) |
| **File uploads** | Go file handler | Supabase Storage buckets |

## Impact on Audit Prompts

| Prompt File | What Changes |
|-------------|-------------|
| `master.md` | Methodology (Vertical Slice) is still valid — no stack-specific content |
| `phase_1_inventory_prompt.md` | Replace Next.js routing patterns with React Router v6 + Vite path conventions. Replace Go handler/service/repo structure with Edge Functions structure |
| `phase_2.txt` | No Go backend in this file — already frontend-focused, but mentions Next.js |
| `phase 3 to 4.txt` (Phase 2 Backend) | **Major rewrite** — replace Go/Fiber audit with Deno/Edge Function audit (no handlers, no Fiber middleware, no Go structs — instead: function invocation, CORS, environment secrets, OpenAI calls) |
| `phase 3 to 4.txt` (Phase 2 Database) | Still valid (PostgreSQL) — but add Supabase-specific RLS policy auditing |
| `phase 3 to 4.txt` (Phase 3 RBAC) | Replace Go JWT middleware audit with Supabase Auth session + RLS policy + `app_role` enum audit |
| `phase 3 to 4.txt` (Phase 4 Synthesis) | Output format still valid — just synthesize against the correct stack |

## Key Supabase-specific Things Prompts Miss

1. **RLS policies** — are they secure, do they leak data, are they missing?
2. **Edge Functions** — Deno runtime, `serve()` pattern, environment secrets, CORS headers
3. **Supabase Auth** — `onAuthStateChange`, session management, refresh tokens
4. **Typed client** — `Database` type from `types.ts` — are queries using it?
5. **Realtime subscriptions** — `channel()` pattern, cleanup on unmount
6. **Storage buckets** — evidence vault, staff photos — RLS on storage?
7. **`user_roles` table** — how roles are assigned and checked (via `public.has_role()`)

## Recommendation

Update all prompt files to reference the actual stack before running any audits. The Vertical Slice methodology in `master.md` is stack-agnostic and still valid.