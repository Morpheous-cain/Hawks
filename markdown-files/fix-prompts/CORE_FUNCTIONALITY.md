# Black Hawk SOC-OS — Core Functionality Definition

**Version:** 1.0  
**Date:** July 2026  
**Prepared by:** Immersicloud Consulting

---

## What "Core" Means

Core is the minimum functional loop that makes the platform usable as an operational security system — nothing more, nothing less. Every feature not listed here is a larger or extra module built on top of this foundation.

> **The loop:** Login → see real sites & staff → open an incident → dispatch a response.

If this loop works end-to-end with real data, the platform is live. Everything else extends it.

---

## Core Modules (6 total)

---

### 1. Authentication & Role Routing

**What it must do:**
- User logs in with email + password via Supabase Auth
- System reads the user's role from `public.user_roles` table
- User is routed to the correct platform page for their role (`/platform/coo`, `/platform/hr-manager`, etc.)
- All 8 canonical DB roles route successfully: `ceo`, `coo`, `control_room_officer`, `operations_supervisor`, `hr_custodian`, `administrator`, `bdo`, `system_admin`
- Invalid/unrecognised roles show a clear "No Role Assigned" screen, not a generic crash
- Sign out clears session globally and returns to `/auth`
- Hard-refreshing any route (`/auth`, `/management`, `/platform/coo`) does not 404

**What it does NOT need to do yet:**
- SSO / OAuth / biometric login
- Password reset flow (can be Supabase default email)
- Email verification enforcement
- Two-factor authentication

---

### 2. Sites & Clients

**What it must do:**
- Display a list of real client sites seeded in the database (minimum 3–5 Nairobi sites)
- Each site shows: name, client name, location, status (active/inactive)
- Sites are selectable as a reference from Incidents, Alarms, and Dispatch
- Basic client record linked to each site (client name, contact)
- A "no sites" empty state shows clearly if the table is empty — not a blank screen

**What it does NOT need to do yet:**
- Client portal / branded client login
- Contracts and billing per client
- SLA scoreboard
- Client performance analytics
- Client document library

---

### 3. Staff Management

**What it must do:**
- Display a list of real staff records seeded in the database (minimum 10–15 records)
- Each record shows: name, role/designation, site assigned, status (active/on-duty/off-duty)
- Staff are selectable as assignees in Incidents and Dispatch
- New staff can be created (name, designation, site, contact number, status)
- A user account can be linked to a staff record (assigns a login + role in `user_roles`)
- Deactivating a staff member removes them from active assignment dropdowns

**What it does NOT need to do yet:**
- Recruitment pipeline
- Onboarding checklists
- Performance reviews
- Leave management
- Payroll
- Org chart
- Staff photo upload (add later)
- Training certifications

---

### 4. Incidents

**What it must do:**
- Create a new incident: select site, incident type, severity, description, assign staff
- Incident gets a unique incident number on creation
- Incident list shows all open incidents with: number, site, type, severity, status, time elapsed
- Status lifecycle: `open → investigating → resolved → closed`
- Each status change is timestamped and visible in the incident record
- Assigning/reassigning a staff member to an incident is possible after creation
- Closing an incident requires a resolution note
- Empty state when no incidents exist shows clearly

**What it does NOT need to do yet:**
- AI incident summary (edge function — add later)
- Evidence vault / file attachments (add later)
- SOP injection / SLA countdown ring (add later)
- Incident Command ICS structure (add later)
- Mobile incident creation from field officer app (add later)
- PDF incident report export (add later)

---

### 5. Alarms

**What it must do:**
- Display incoming alarm activations: site, sensor type, time triggered, status
- Alarm status lifecycle: `triggered → acknowledged → dispatched → resolved → false_alarm`
- Operator can acknowledge an alarm with one click
- Alarm can be linked to an incident (creates or links an existing incident record)
- SOS alerts appear separately, highlighted, and require acknowledgement before they can be cleared
- Empty state when no alarms exist shows clearly

**What it does NOT need to do yet:**
- Auto-dispatch rule engine (pending migration — add later)
- False alarm pattern tracking (add later)
- Audio/push alerts (add later)
- CCTV camera linkage per alarm zone (add later)

---

### 6. Dispatch / Control Room

**What it must do:**
- From an open incident or acknowledged alarm, a dispatcher can create a dispatch request
- Dispatch request contains: incident/alarm reference, responding staff/vehicle, site, priority, instructions
- Dispatch request status lifecycle: `pending → dispatched → en_route → on_scene → complete`
- Live dispatch list shows all active dispatch requests with current status
- Dispatcher can update the status of a dispatch in progress
- Realtime: when a dispatch status changes, all connected operators see it update without refreshing
- Digital Occurrence Book (DOB): every incident creation, alarm acknowledgement, and dispatch event auto-writes a timestamped DOB entry

**What it does NOT need to do yet:**
- GPS tracking / map view of units (add later)
- MDT (Mobile Dispatch Terminal) for field officers (add later)
- Auto-dispatch routing engine (add later)
- HQ-to-branch directives (add later)
- Patrol integration into dispatch (add later)
- Multi-channel communications (WhatsApp, SMS, radio) linked to dispatch (add later)

---

## Core Database Requirements

The following tables must have real, applied migrations and real seed data before core is functional:

| Table | Purpose | Seed Data Needed? |
|-------|---------|------------------|
| `profiles` | Auth user records | Yes — 1 admin user |
| `user_roles` | Role assignments | Yes — 1 per test user |
| `sites` | Client locations | Yes — 3–5 Nairobi sites |
| `clients` | Client companies | Yes — linked to sites |
| `staff` | Staff records | Yes — 10–15 records |
| `incidents` | Incident records | No — created via UI |
| `alarm_activations` | Alarm events | No — created via UI or sensor |
| `alarm_sensors` | Sensor registry | Yes — a few per site |
| `dispatch_requests` | Dispatch jobs | No — created via UI |
| `dispatch_logs` | Dispatch audit trail | No — auto-written |
| `dob_entries` | Digital occurrence book | No — auto-written |
| `operator_statuses` | Who is on shift | Yes — 2–3 operators |

---

## Core Edge Functions

Only one edge function is required for the core loop:

| Function | Required for core? | Why |
|----------|-------------------|-----|
| `incident-ai-summary` | No — deferred | Nice to have, not blocking |
| `patrol-anomaly-detection` | No — deferred | Patrol is not core |
| `strategic-advisory` | No — deferred | Intelligence layer |
| `generate-briefing` | No — deferred | Shift briefing |
| `threat-analysis` | No — deferred | Intelligence layer |
| `risk-forecast` | No — deferred | Analytics |
| `shift-briefing` | No — deferred | Shift management |
| `copilot-assistant` | No — deferred | AI layer |
| `evidence-sign-url` | No — deferred | Evidence vault not core |
| `attendance-anomaly-detection` | No — deferred | HR not core |
| `public-api` | No — deferred | External API |
| `create-user-account` | Partial — manual for now | Admin creates users via Supabase dashboard until User Management UI is built |
| `training-drill-inject` | No — deferred | Training module |

**All edge functions are deferred until the core loop is complete and tested.**

---

## Core Pending Migrations (must apply before core works)

| Migration File | Status | Blocks Core? |
|----------------|--------|-------------|
| `dob_soft_delete.sql` | Not applied | Yes — needed for DOB soft-delete to work |
| `auto_dispatch_rules.sql` | Not applied | No — auto-dispatch is not core; manual dispatch is |
| `hq_connect.sql` | Not applied | No — HQ directives not core |
| `incident_number_sequence.sql` | Not applied | Yes — incidents need auto-incrementing readable numbers |
| `incident_command_v2.sql` | Applied (duplicate in pending) | Duplicate only — delete the pending copy |
| All others (CIT, K9, CMC, CCTV, armoury, HR/payroll, courier, CS) | Not applied | No — all deferred |

---

## Core Roles (must work end-to-end)

These are the accounts that must be testable before core is signed off:

| Role | Platform Route | Core Screens They Need |
|------|--------------|----------------------|
| `coo` | `/platform/coo` | Incidents, Alarms, Control Room, Dispatch, Staff |
| `control_room_officer` | `/platform/control-room` | Alarms, Incidents, Dispatch, DOB |
| `operations_supervisor` | `/platform/ops-manager` | Incidents, Dispatch, Staff |
| `administrator` | `/platform/coo` (fallback) | All core screens |
| `system_admin` | `/platform/system-admin` | User management, Settings |

---

## Core is NOT Complete Until

- [ ] At least 3 real sites and 10 real staff records are visible immediately after login
- [ ] A `control_room_officer` account can log in and reach the Control Room screen without hitting Access Denied
- [ ] An incident can be created with a real site and real assigned staff member selected from dropdowns
- [ ] That incident appears in the incident list immediately after creation (no manual refresh)
- [ ] An operator can create a dispatch request referencing that incident
- [ ] The dispatch status updates are visible to a second browser tab in real time
- [ ] A DOB entry is auto-written for each of: incident created, alarm acknowledged, dispatch created
- [ ] No screen in the core loop shows a blank white space where a table or empty state should be
- [ ] Hard-refreshing any of the 5 core screens does not 404
- [ ] Scroll works on all 5 core screens on both desktop and mobile (430px viewport)

---

## What Comes After Core (in order)

1. **Patrol Suite** — GPS tracking, QR/NFC checkpoint verification, supervision patrol
2. **Communications Centre** — Live calls, WhatsApp/SMS, dispatch escalation
3. **CCTV** — Camera registry, operator console, link to incidents
4. **Body Cam & Evidence Vault** — Clips, chain of custody, SHA-256 hashing
5. **K9 Module** — Dogs, handlers, deployments
6. **CIT (Cash In Transit)** — Runs, manifests, vault, routes
7. **HR Suite** — Full HR lifecycle: recruitment, onboarding, attendance, performance, disciplinary
8. **Finance & Payroll** — Pay runs, payslips, billing, statutory
9. **Strategic Advisory (RTSI)** — AI-powered threat intelligence, Mapbox globe
10. **War Room / CMC** — Crisis Management Centre
11. **Armoury & Visitor Access** — Weapons custody, visitor pre-clearance
12. **Customer Service** — Tickets, complaints, escalations
13. **Courier Operations** — Deliveries, riders, routes
14. **AI Copilot** — Full copilot-assistant deployment
15. **Executive Dashboards** — CEO/COO/GM/Finance role-specific scorecards
16. **Compliance & Governance** — Audit log, approvals, compliance register
17. **Multi-tenancy** — Tenant isolation, white-label client portal

---

*Prepared by Immersicloud Consulting · immersitec@gmail.com · immersicloud.org*
