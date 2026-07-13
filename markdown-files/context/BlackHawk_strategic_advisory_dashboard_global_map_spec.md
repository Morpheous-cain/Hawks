# Black Hawk SOC-OS — Strategic Advisory Dashboard Global Map Module (Design + Implementation Spec)

> Add a Strategic Advisory Dashboard Global Map module to Black Hawk SOC-OS that displays a real-time interactive globe map and a left/right information panel for Traffic Intelligence, Protest Monitor, Terror Intelligence, Weather & Safety, and Crime & Threat Advisory. Each event must show location scope (Globe / East Africa / Kenya / Nairobi / road name / neighborhood), color-coded severity (NORMAL = green, CAUTION = amber, CRITICAL = red), timestamp, short description and recommended action. The module ingests feeds from traffic sensors, CCTV/ticketing, social media & protest monitors, terrorism intel sources, Kenya Met Department, and local incident reports. Provide alert rules (escalation, push/SMS/email), on-map markers clustered by region, drill-down to city/street level, and an audit/log for every event. Mobile-ready and role-based (Analyst, Supervisor, Commander).

## 1 — Purpose & Overview

* **Purpose**: Provide SOC & field teams with a single, actionable Strategic Advisory Dashboard combining strategic-level intel (terror, protests), operational safety (weather), traffic, and crime advisories — with live map context and rapid escalation tools for Black Hawk SOC-OS clients.
* **Scope**: Global visual (interactive globe) with pre-filtered focus panes for East Africa → Kenya → Nairobi and other major Kenyan cities. Real-time alerts, historical log, automated notifications.

## 2 — High-level UI / UX

### Main screen layout
* **Full-screen interactive globe map (center)**: Blue/tech theme matching the reference image; light lines show connectivity. Hover/zoom transitions from global to regional to city view.
* **Left column panel**: Traffic Intelligence + Protest Monitor (local city-focused).
* **Right column panel**: Terror Intelligence, Weather & Safety, Crime & Threat Advisory.

### Advisory Entry Component
How an incident appears in the panels:
* **Title** (e.g., "Thika Road: Construction Zone at Roasters")
* **Scope tag hierarchy** (e.g., Kenya > Nairobi > Thika Road)
* **Severity badge** (● NORMAL (Green), ● CAUTION (Amber), ● CRITICAL (Red))
* **Short description** (1–2 lines truncated)
* **Timestamp** (local time relative to viewer)
* **Recommended action line** (e.g., "Use alternative route.")
* **Action**: Click expands to a detailed incident card with attachments (snapshots, map view), source links, comms log, and analytics.

### Map Overlays
* Markers with color-coded pins (clustered dynamically at zoom-out).
* Heatmap layer toggle (e.g., visualize crime density or protest activity zones).
* Traffic flow lines for key corridors (green/orange/red lines).
* Protest/incident polygon overlays for large gatherings or cordoned areas.

### Toolbar & Controls
* Time slider (replay past 24–72 hours of incidents).
* Filters (by sector, severity, geographic region, timeframe).
* Export PDF / Share to Client button.
* "Quick Alert" / "Escalate" floating button for SOC analysts.

### Mobile Adaptation
Stacked panels with the globe toggled to a header map view; condensed cards for readability on handheld devices.

## 3 — Data Inputs & Integrations

### Primary data sources
* **Traffic**: City traffic APIs (if available), GPS fleet telemetry aggregates, Waze/Google traffic feed wrappers, roadside sensors (IoT).
* **CCTV & Cameras**: Integration with VMS APIs (Dahua/Hikvision/Milestone) for thumbnail generation + deep-link to live feed.
* **Social / Protest Monitor**: Monitored keywords/hashtags, crowd-sourced reporting tools, verified OSINT feeds.
* **Terror & Strategic Intel**: Internal analyst reports, vetted third-party threat feeds (STIX/TAXII), dark web monitoring summaries.
* **Weather**: Kenya Met Department API / reputable global meteorological feed.
* **Crime reports**: Internal incident reports (security guards/field teams via mobile app), police data integrations (if available), client portal reporting.

### Integration patterns
* **Ingest**: via Connector Microservices (REST APIs, Webhooks receiving JSON payload, SFTP pick-up for legacy CSV, MQTT for real-time telemetry).
* **Normalization**: Convert incoming raw data into the standard Black Hawk Incident Schema (see Section 4).
* **Enrichment**: Reverse geocode lat/long → administrative area; tag nearest Points of Interest (POIs) like hospitals, transport hubs.
* **Verification Scoring**: Apply confidence scores to social/OSINT inputs to reduce noise.

## 4 — Data Model (Core Fields)

Example JSON incident payload standardized for the dashboard:

```json
{
  "incident_id": "ASD-20251201-0001",
  "tenant_id": "blackhawk-socos",
  "category": "Traffic",
  "sub_category": "Congestion",
  "title": "Thika Road — Construction Zone at Roasters",
  "description": "Slow moving traffic due to ongoing construction at the Roasters flyover section.",
  "severity": "NORMAL",
  "confidence_score": 0.95,
  "status": "Active",
  "timestamp_detected": "2025-12-01T21:58:00+03:00",
  "timestamp_updated": "2025-12-01T22:05:00+03:00",
  "location": {
    "lat": -1.2150,
    "lon": 36.8469,
    "scope_hierarchy": ["Global", "Africa", "Kenya", "Nairobi", "Kasarani"],
    "proximate_poi": "Roasters Inn"
  },
  "sources": [
    {"type":"TrafficAPI", "id":"waze-feeder-789", "reliability":"High"},
    {"type":"CCTV", "id":"cam-nrb-thika-12", "link":"rtsp://blackhawk-media-server/..."}
  ],
  "recommended_action": "Expect delays of 10-15 mins; divert to Outer-Ring road if possible.",
  "attachments": [
    {"type": "image", "url": "https://blackhawk-storage/incidents/img-123.jpg", "caption": "Traffic snapshot"}
  ],
  "escalation": {
    "is_escalated": false,
    "current_owner_role": "Analyst"
  },
  "audit_trail": [
    {"action": "Created", "user": "System_Ingest", "time": "..."}
  ]
}
```

## 5 — Severity Rules & Automatic Classification

### Default severity mapping engine (configurable rules):
* **Traffic**: Congestion < 15min delay → NORMAL; > 30min delay OR partial road block → CAUTION; Total road closure/major fatal accident → CRITICAL.
* **Protest**: Unverified social chatter → NORMAL (watch); Verified gathering > 50 people OR reports of violence/disruption → CRITICAL; Planned demonstration with police notice → CAUTION.
* **Terror**: Verified threat to public infrastructure / hotels / transport hubs → CRITICAL (immediate escalation). Credible chatter → CAUTION.
* **Weather**: Official Met Warning (Orange/Red) → CAUTION/CRITICAL based on impact area and asset proximity.
* **Crime**: Active armed robbery / shootout / suspects fleeing → CRITICAL; Repeated residential/street theft reports in an area → CAUTION (heatmap generation).

### Rules Engine Logic:
* Use confidence_score thresholds.
* Geo-fencing multipliers: Incidents within predefined critical zones (e.g., CBD, Embassies, Airports) automatically bump severity one level higher.
* Auto-upgrade: If >3 distinct sources report the same incident within 10 minutes, upgrade severity automatically.

## 6 — Notifications & Escalation Workflow

### Channels:
* In-module visual alert (flashing card/banner).
* Audible tone in SOC (selectable sounds based on severity).
* Push notifications (Black Hawk mobile officer/client app).
* SMS / Email gateways.
* Secure IM integration (WhatsApp Business API / Telegram bot) for field teams.

### Escalation Matrix:
* **Detection**: System flags CRITICAL incident based on rules.
* **L1 Analyst**: Receives alert. Must acknowledge within SLA timer (e.g., 5 mins). Triage, verify with secondary sources (cameras), annotate.
* **Auto-Escalation**: If L1 does not acknowledge, auto-escalate to L2 Supervisor via SMS + Push.
* **L2 Supervisor**: Reviews verified intel. Can trigger "Mass Client Notification" or escalate to L3 Commander.
* **L3 Commander**: Declares elevated response posture, manages crisis comms, initiates field response protocol.

## 7 — User Roles & Permissions (RBAC)

* **Analyst**: View dashboard, acknowledge alerts, annotate incidents, add attachments, propose severity changes.
* **Supervisor**: Approve severity changes, trigger client notifications, edit incident details, manage shift logs.
* **Commander**: Full system control. Declare crisis mode, override rules, access detailed intelligence sources, view audit logs.
* **Client (Portal User)**: Read-only view of their subscribed geography/assets. Receive filtered alerts. Download daily summary PDF.
* **Security**: Include SSO (SAML/OAuth) and comprehensive audit logging of every view and action.

## 8 — Implementation Checklist (MVP recommended path)

* ✅ Schema Definition: Finalize the Incident JSON data model.
* ✅ Ingestion Adapters (Phase 1): Build connectors for 3 initial reliable sources (e.g., 1 Traffic API, Kenya Met Info, Internal Manual Entry form).
* ✅ Dashboard Shell: Create the UI framework with center map (using Mapbox GL JS or similar) and empty left/right panel structures.
* ✅ Map Visualization: Implement marker rendering with clustering and basic color-coding based on the schema's severity field.
* ✅ Basic Rules Engine: Implement simple if/then logic for severity classification upon ingestion.
* ✅ Notification Pipeline: Connect email and basic push notification service for CRITICAL alerts.
* ✅ Seed Data Testing: Load the sample operational entries (below) to validate UI rendering and filtering.
* ✅ RBAC Basic: Implement Analyst vs. Supervisor view differences.

## 9 — Sample Operational Entries (Seed Data)

Use these to immediately populate the dashboard for demos or UAT.

* **[Traffic]** Thika Road: Construction Zone at Roasters — NORMAL — 21:58 — "Slow moving traffic due to construction."
* **[Traffic]** Outering Road: Normal flow — NORMAL — 21:58 — "Traffic flowing freely."
* **[Traffic]** Waiyaki Way: Minor accident cleared at ABC Place junction — NORMAL — 21:45 — "Expect residual delays."
* **[Protest Monitor]** Uhuru Park: Large gathering forming — CRITICAL — 21:55 — "Unplanned gathering >200 pax. Police deploying. Avoid area."
* **[Protest Monitor]** Parliament Buildings: Planned demonstration tomorrow 10:00 — CAUTION — 21:30 — "Maintain situational awareness."
* **[Terror Intel]** East Africa Region: Threat assessment update — NORMAL — 21:00 — "Baseline threat level remains unchanged."
* **[Weather]** Nairobi County: Heavy rainfall warning — CAUTION — 21:58 — "Expected 15:00–18:00 tomorrow. Risk of localized flooding."
* **[Crime]** Westlands, ABC Bank: Armed robbery active — CRITICAL — 21:57 — "Shots fired. Suspects attempting getaway. Police responding."
* **[Crime]** Lavington Estate: Series of residential break-ins detected — CAUTION — 20:15 — "Patrols increased in Muthangari area."

## 10 — Technical Stack Recommendations

* **Frontend**: React with TypeScript, Tailwind CSS for styling
* **Map Library**: Mapbox GL JS for interactive globe and clustering
* **State Management**: React Query for data fetching and caching
* **Real-time**: Supabase Realtime for live updates
* **Backend**: Supabase Edge Functions for ingestion adapters
* **Database**: PostgreSQL (via Supabase) with PostGIS for geospatial queries
* **Notifications**: Supabase Edge Functions + third-party services (Twilio, SendGrid)

## 11 — Future Enhancements

* AI-powered threat prediction and pattern recognition
* Integration with drone surveillance feeds
* Automated report generation and executive summaries
* Mobile field app for analysts to report incidents on-the-go
* Advanced analytics dashboard with historical trends
* Integration with public transport systems for real-time disruption alerts
