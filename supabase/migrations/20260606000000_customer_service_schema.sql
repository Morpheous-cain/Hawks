-- Customer Service schema: support_tickets, client_complaints, cs_notes, cs_categories
-- Roles: customer_service_manager (full CRUD) | customer_service_officer (own assigned only)

-- ─────────────────────────────────────────────────────────
-- cs_categories — configurable ticket categories
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cs_categories (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT NOT NULL UNIQUE,
  description          TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  escalation_sla_hours INTEGER NOT NULL DEFAULT 24,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed defaults
INSERT INTO cs_categories (name, escalation_sla_hours) VALUES
  ('General',         48),
  ('Billing',         24),
  ('Technical',       12),
  ('Complaint',        4),
  ('Service Request', 72)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- support_tickets
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number  TEXT UNIQUE,
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  subject        TEXT NOT NULL,
  description    TEXT,
  category       TEXT NOT NULL DEFAULT 'general',
  priority       TEXT NOT NULL DEFAULT 'normal'
                   CHECK (priority IN ('low','normal','high','urgent')),
  status         TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_progress','pending_client','resolved','closed')),
  assigned_to    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at    TIMESTAMPTZ,
  resolved_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  deleted_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Auto-generate ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1000;
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' || LPAD(nextval('support_ticket_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_ticket_number ON support_tickets;
CREATE TRIGGER trg_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

-- ─────────────────────────────────────────────────────────
-- client_complaints
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_complaints (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_number  TEXT UNIQUE,
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  ticket_id         UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  subject           TEXT NOT NULL,
  description       TEXT NOT NULL,
  severity          TEXT NOT NULL DEFAULT 'medium'
                      CHECK (severity IN ('low','medium','high','critical')),
  status            TEXT NOT NULL DEFAULT 'received'
                      CHECK (status IN ('received','investigating','escalated','resolved','closed')),
  escalated         BOOLEAN NOT NULL DEFAULT FALSE,
  escalated_at      TIMESTAMPTZ,
  escalated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  escalation_notes  TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE SEQUENCE IF NOT EXISTS complaint_seq START 100;
CREATE OR REPLACE FUNCTION set_complaint_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.complaint_number IS NULL THEN
    NEW.complaint_number := 'CMP-' || LPAD(nextval('complaint_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_complaint_number ON client_complaints;
CREATE TRIGGER trg_complaint_number
  BEFORE INSERT ON client_complaints
  FOR EACH ROW EXECUTE FUNCTION set_complaint_number();

-- ─────────────────────────────────────────────────────────
-- cs_notes — notes on tickets or complaints
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cs_notes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id     UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  complaint_id  UUID REFERENCES client_complaints(id) ON DELETE CASCADE,
  note_text     TEXT NOT NULL,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cs_notes_target CHECK (
    (ticket_id IS NOT NULL AND complaint_id IS NULL) OR
    (ticket_id IS NULL AND complaint_id IS NOT NULL)
  )
);

-- ─────────────────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────────────────
ALTER TABLE cs_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_notes          ENABLE ROW LEVEL SECURITY;

-- Helper: returns the role string for the current user
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role::TEXT FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- cs_categories: managers can CRUD; officers read only
CREATE POLICY cs_categories_read ON cs_categories
  FOR SELECT USING (auth_role() IN ('customer_service_manager','customer_service_officer'));

CREATE POLICY cs_categories_write ON cs_categories
  FOR ALL USING (auth_role() = 'customer_service_manager');

-- support_tickets: managers see all; officers see only assigned rows
CREATE POLICY tickets_manager ON support_tickets
  FOR ALL USING (auth_role() = 'customer_service_manager');

CREATE POLICY tickets_officer_read ON support_tickets
  FOR SELECT USING (
    auth_role() = 'customer_service_officer'
    AND assigned_to = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY tickets_officer_update ON support_tickets
  FOR UPDATE USING (
    auth_role() = 'customer_service_officer'
    AND assigned_to = auth.uid()
    AND deleted_at IS NULL
  );

-- client_complaints: managers full; officers read complaints for their assigned tickets
CREATE POLICY complaints_manager ON client_complaints
  FOR ALL USING (auth_role() = 'customer_service_manager');

CREATE POLICY complaints_officer_read ON client_complaints
  FOR SELECT USING (
    auth_role() = 'customer_service_officer'
    AND ticket_id IN (
      SELECT id FROM support_tickets
      WHERE assigned_to = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- cs_notes: managers full; officers CRUD on own assigned ticket notes
CREATE POLICY notes_manager ON cs_notes
  FOR ALL USING (auth_role() = 'customer_service_manager');

CREATE POLICY notes_officer ON cs_notes
  FOR ALL USING (
    auth_role() = 'customer_service_officer'
    AND ticket_id IN (
      SELECT id FROM support_tickets
      WHERE assigned_to = auth.uid() AND deleted_at IS NULL
    )
  );

-- ─────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ix_tickets_status         ON support_tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_tickets_assigned_to    ON support_tickets(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_tickets_client_id      ON support_tickets(client_id);
CREATE INDEX IF NOT EXISTS ix_complaints_status      ON client_complaints(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_complaints_escalated   ON client_complaints(escalated) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_cs_notes_ticket_id     ON cs_notes(ticket_id);
CREATE INDEX IF NOT EXISTS ix_cs_notes_complaint_id  ON cs_notes(complaint_id);
