---
name: field-portal-roadmap
description: Guard field portal roadmap — next steps prioritized
metadata:
  type: project
  originSessionId: current
---

# Field Portal Roadmap — Guard Rank (7 modules)

**Current state:** 6/7 modules fully wired, Bodycam simulated

---

## Immediate (this sprint)

### 1. Bodycam — Real Upload
- **Goal:** Replace simulated upload with Supabase Storage + signed URLs
- **Steps:**
  1. Create Storage bucket `bodycam-evidence` (private)
  2. Add RLS policies: guard can upload to own folder, control room can read
  3. Deploy `evidence-sign-url` edge function (generates signed upload URL)
  4. Update `OfficerBodyCamApp.tsx` → upload to Storage, save metadata to `evidence_items` table
- **Effort:** Medium
- **Depends on:** Supabase Storage + edge function deploy

### 2. Welfare Escalation — Auto-Alert on Missed Check-in
- **Goal:** If `welfare_heartbeats.missed_count > 0` or `next_due_at` passed → notify control room
- **Approach:** Edge function cron (every 5 min) scanning overdue heartbeats → insert `hq_directives` or `hq_broadcasts` for control room
- **Effort:** Low
- **Tables ready:** `welfare_heartbeats`, `hq_directives`, `hq_broadcasts`

### 3. HQ PTT Audio — Voice Playback
- **Goal:** Upload PTT audio blobs to Storage, render `<audio>` player in chat
- **Steps:**
  1. Storage bucket `hq-comms` (private)
  2. `startPTT` → record blob → upload → insert `hq_messages` with `audio_url` + `duration_seconds`
  3. Chat UI: if `message_type === 'ptt'` show audio player
- **Effort:** Medium
- **Depends on:** Storage bucket

---

## Phase C — Specialised Departments (new rank modules)

| Rank | Modules | Tables Needed |
|------|---------|---------------|
| **K9** | `k9ops`, `health` | `k9_units`, `k9_health_logs`, `k9_deployments` |
| **CMC** | `cmc_*` | `cmc_incidents`, `cmc_resources`, `cmc_shift_logs` |
| **Visitor/Armoury** | `visitor_log`, `key_custody`, `vehicle_inspect`, `parcel_log` | Already in `field_portal_phase2.sql` ✅ |
| **CIT** | `missions`, `navigation`, `comms` | `cit_missions`, `cit_routes`, `cit_crew` |
| **Escort** | `missions`, `navigation`, `comms` | `escort_missions`, `escort_routes` |

**Note:** `visitor_log`, `vehicle_inspect`, `key_custody`, `parcel_log` tables exist — just need UI components for those modules.

---

## Phase D — HR & Finance (staff-facing)

| Feature | Status | Tables |
|---------|--------|--------|
| My Schedule | UI stub | `shifts`, `shift_assignments` |
| My Performance | UI stub | `performance_reviews`, `kpis` |
| Payslips | Missing | `payroll_runs`, `payslips` |
| Expenses | Missing | `expense_claims` |
| Leave Requests | Missing | `leave_requests` |

---

## Phase E — Intelligence (edge functions + RTSI map)

**14 edge functions** in `supabase/functions/` — all need deploy + `OPENAI_API_KEY` secret:

| Function | Purpose |
|----------|---------|
| `copilot-assistant` | General Q&A |
| `generate-briefing` | Pre-shift AI summary |
| `strategic-advisory` | Executive insights |
| `threat-analysis` | Incident pattern detection |
| `patrol-anomaly-detection` | Route deviation alerts |
| `incident-ai-summary` | Auto-generate incident narratives |
| `evidence-sign-url` | Signed upload URLs (needed for Bodycam) |
| `auto-dispatch-rules` | ML-based dispatch suggestions |
| ... | 6 more |

**RTSI Map** — spec in `BlackHawk_strategic_advisory_dashboard_global_map_spec.md`

---

## Phase F — Governance

| Feature | Tables |
|---------|--------|
| Audit Log | `audit_log` (pending migration) |
| Compliance | `compliance_checks`, `regulations` |
| Approvals | `approval_workflows`, `approval_steps` |
| Directives/SOP | `directives`, `sop_documents` |

---

## Phase G — CS & Courier

| Feature | Tables |
|---------|--------|
| Customer Service | `cs_tickets`, `cs_responses` |
| Courier Ops | `courier_jobs`, `courier_tracking` |

---

## Phase H — Hardening

- Multi-tenancy (RLS by `tenant_id`)
- PWA (service worker, offline sync)
- Rate limiting (edge function middleware)
- Env separation (staging/prod)

---

## Decision Matrix

| If you want... | Start with |
|----------------|------------|
| **Finish guard 7/7** | Bodycam (1) |
| **Quick operational win** | Welfare escalation (2) |
| **New rank modules** | K9 or Visitor/Armoury (tables ready) |
| **AI intelligence** | Deploy edge functions + `OPENAI_API_KEY` |
| **Staff self-service** | My Schedule / My Performance (UI exists) |

---

## Recommended Order

1. **Bodycam** — completes guard portal
2. **Welfare escalation** — 30 min, high visibility
3. **HQ PTT audio** — rounds out comms
4. **Deploy edge functions** — unlocks Phase E intelligence
5. **K9 module** — next rank, tables need creating
6. **Visitor/Armoury UI** — tables exist, just components

---

*Updated: 2026-07-18*