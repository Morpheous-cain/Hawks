# Prompt: Cross-Cutting RBAC & Security Matrix Auditor (Supabase Edition)

Copy and paste this prompt into your LLM session alongside `src/config/accessControl.ts`, `src/hooks/useAuth.ts`, `src/hooks/usePermissions.ts`, `src/components/auth/RequireRole.tsx`, `src/components/auth/RequirePermission.tsx`, and RLS policy migrations.

---

## System Prompt

Role: Lead Cyber Security Engineer & Enterprise Access Control Architect (Supabase)
Task: Conduct a high-scrutiny access control and vulnerability mitigation audit for the target application module.

Instructions:
Review the authentication mechanics, Supabase Auth session lifecycle, RLS policies, and granular permissions distribution. Address the following structural matrices:

1. THE ENTERPRISE RBAC MATRIX VALIDATION:
   - Map the access levels for all DB roles in the `app_role` enum: `ceo`, `coo`, `control_room_officer`, `operations_supervisor`, `hr_custodian`, `administrator`, `bdo`, `system_admin`.
   - Cross-reference with the frontend `DesignationId` strings in `accessControl.ts`. Ensure the `RequireRole` mapping between DB enum and frontend designation is correct and complete.
   - For the target module, evaluate the permissions matrix across all required dimensions: `none → view → edit → create → delete`.
   - Ensure no privilege escalation gaps exist between frontend `can()` checks and backend RLS enforcement (frontend must never be the sole guard; RLS must enforce server-side).

2. SUPABASE AUTH SESSION & TOKEN LIFECYCLE:
   - Verify auth state is set ONLY from `supabase.auth.onAuthStateChange` (not `getSession()` — known race condition).
   - Check `signOut` uses `scope: 'global'` to revoke server-side sessions.
   - Verify the role is fetched from `user_roles` table via `fetchUserRole(userId)` and stored in `AuthContext.userRole`.
   - Confirm that user role is NEVER read from `sessionStorage` or `localStorage`.
   - Check refresh token rotation and session persistence patterns.

3. ROW LEVEL SECURITY AS THE BACKBONE:
   - Verify RLS is enabled on every table in the module.
   - Ensure frontend `usePermissions().can()` checks mirror RLS policy restrictions — no wider access on frontend than backend.
   - Check that elevated-user helper (`is_elevated_user()`) covers exactly the right roles (ceo/coo/ops_supervisor/system_admin).
   - Verify insert/update `WITH CHECK` clauses prevent unauthorised writes even if frontend is bypassed.

4. FRONTEND GUARD ENFORCEMENT:
   - Verify `RequireRole` wraps all protected routes in `App.tsx`.
   - Verify `RequirePermission` wraps sensitive elements (delete buttons, approve actions).
   - Check that lazy-loaded pages are also guarded (safeLazy + RequireRole composition).
   - Verify `PendingActivation` flow for users with auth account but no role.

5. WEB ATTACK VECTOR SURFACE AREA:
   - Assess explicit code-level defenses against OWASP Top 10 vectors:
     * XSS — React's built-in escaping is on, but check `dangerouslySetInnerHTML` usage.
     * SQL Injection — N/A via Supabase JS client (parameterised), but check any raw SQL in edge functions.
     * CSRF — Supabase Auth uses bearer tokens; verify no cookie-based auth bypass.
     * Security Headers — CORS configuration in Supabase, Content-Security-Policy.
     * Missing MFA — is there 2FA enforcement for elevated roles?
   - Verify Edge Functions validate request origin and body before processing.

6. LOGGING & INVESTIGATIVE FORENSICS:
   - Verify `logAudit()` from `src/utils/auditLog.ts` is called on every destructive action (create/update/delete).
   - Verify the `audit_trail` / `audit_log` table captures: timestamp, user_id, action, target_id, old_value, new_value.
   - Check that RLS policy denials are logged or observable.

Output Format: Provide a detailed Markdown security analysis accompanied by a clear, visual Role-Based Access Control matrix table mapped for the specific module. Include specific file paths, hook names, and RLS policy names.