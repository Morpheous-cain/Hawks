# Three-Part Build Plan

## Part 1 — Supervisor Platform fixes

**Loading / blank screen**
- Audit `src/pages/SupervisionPatrol.tsx` and `src/components/patrol/SupervisorPlatform.tsx` for the runtime error chain (the `_result.default` errors trace back to a lazy-loaded child here).
- Wrap heavy child components (PatrolHeatmap, ComplianceDashboard, ShiftReportGenerator, PayrollRunner, BulkShiftScheduler) in defensive Suspense + ErrorBoundary so one broken child doesn't blank the entire dashboard.
- Ensure every lazy import has a `default` export.

**Mobile cutoff**
- Convert the supervisor tabs from a fixed horizontal grid to a horizontally-scrollable tab bar with `overflow-x-auto`, `snap-x`, and visible scroll affordance for ≤480 px viewports.
- Add `min-w-0` + `w-full` guards on the tab content panels; wrap data tables in `ScrollArea` with explicit `max-w-[100vw]`.
- Move the right-side KPI rail to stack below content on mobile (`flex-col lg:flex-row`).

**Missing sections (built per spec memory)**
- 12-tab dashboard: Overview · Live Map · Checkpoints · Clock & Attendance · Patrols · Compliance Scorecards · Heatmap · Exceptions · Shift Reports · Payroll · Officers · Settings.
- Fill any tab currently rendering placeholder text with a working table + filters + create dialog wired to its Supabase table.

## Part 2 — HR Management Suite (full build)

New top-level page `src/pages/HRManagement.tsx` with sidebar layout and 10 sub-modules:

| # | Module | Tables |
|---|---|---|
| 1 | Employee Directory & Profiles | `staff`, `staff_bio_data`, `staff_documents` |
| 2 | Recruitment Pipeline | `hr_applicants`, `hr_interviews`, `hr_job_postings` (new) |
| 3 | Onboarding Checklists | `hr_onboarding_tasks` (new) |
| 4 | Leave Management | `leave_requests`, `leave_balances` |
| 5 | Attendance & Timesheets | `attendance_records`, `timesheets` |
| 6 | Payroll & Payslips | `payroll_runs`, `payslips`, Kenyan PAYE/NSSF/NHIF calc |
| 7 | Performance & Appraisals | `hr_appraisals`, `hr_kpis` (new) |
| 8 | Training & Certifications | reuse `staff_certifications`, `training_sessions` |
| 9 | Disciplinary & Grievances | `hr_disciplinary_cases`, `hr_grievances` (new) |
| 10 | HR Analytics Dashboard | aggregates from above (headcount, turnover, leave utilisation, payroll cost, training compliance, cert expiry, disciplinary trends) |

**Database migration**
- Create the missing tables listed above with `tenant_id`, audit columns, status enums.
- RLS: `is_elevated_user` or `has_role('hr_manager')` for write; staff can read their own rows via `user_id = auth.uid()`.
- Triggers: auto-numbering (APP-#####, JOB-#####, ONB-#####, CASE-#####), `updated_at` maintenance.

**UI conventions**
- Each module = list view + filters + create/edit dialog + detail drawer.
- Real Supabase CRUD, realtime subscriptions, Zod v3 form schemas.
- Reuse existing `DataTable`, `StatusBadge`, `EmptyState` primitives.

## Part 3 — Seed all empty modules

Strategy: query `information_schema` for every `public.*` table, count rows, and seed any that's empty + tied to a visible module. Inserts via a single SQL batch (one `supabase--insert` call per logical module to keep it reviewable).

**Coverage** (modules confirmed in `src/pages` that need data audit):
Alarms · ArmouryCustody · AuditLog · BillingInvoicing · BodyCam · CCTV · CashInTransit · ClientManagement · Communications · Compliance · DOB · DirectiveLog · Documents · EmergencyPlans · EquipmentIssuance · Escort · EventSecurity · FieldOfficersManagement · FleetManagement · GPSPatrolTracking · GuardTourReports · IncidentManagement · Investigations · K9 · LeaveManagement · LossControl · MDT · PatrolCheckpoints · SOPLibrary · ShiftHandover · StaffManagement · StaffScheduling · StrategicAdvisory · SupervisionPatrol · TechnicalSecurity · TrainingDrills · TrainingManagement · VisitorAccess · plus all new HR tables.

Seed volume per table: 8–25 rows of realistic Kenyan-context data (Nairobi locations, KES amounts, BH-### IDs, Unit Alpha/Bravo/Delta naming) referencing existing client/staff/site UUIDs where present.

## Execution order
1. Audit DB: list tables + row counts to know exact gaps.
2. Migration: create HR tables + RLS + triggers.
3. Seed: one batched insert per module group.
4. Fix SupervisorPlatform (lazy boundaries, mobile tabs, missing tab content).
5. Build HRManagement page + 10 sub-module components + route.
6. Add HR entry to sidebar navigation.
7. QA: open Supervisor dashboard at 414 px and HR pages on desktop, verify no console errors.

## Technical notes
- All new tables use `gen_random_uuid()` PKs, `created_at`/`updated_at` defaults, RLS enabled from creation.
- Seed inserts will be idempotent (use `ON CONFLICT DO NOTHING` where unique constraints exist; otherwise check counts first).
- No edits to `client.ts`, `types.ts`, `.env`, or project-level `config.toml`.
- Expect 3–5 migration calls + 8–12 insert calls + ~15 file edits.
