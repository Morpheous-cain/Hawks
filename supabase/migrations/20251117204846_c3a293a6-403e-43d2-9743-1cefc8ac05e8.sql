-- Create enum types for call center with unique names
CREATE TYPE call_status_type AS ENUM ('ringing', 'on_call', 'on_hold', 'ended', 'missed', 'abandoned');
CREATE TYPE call_priority_type AS ENUM ('low', 'normal', 'high', 'emergency');
CREATE TYPE operator_status_type AS ENUM ('available', 'on_call', 'on_wrap_up', 'break', 'logged_out');
CREATE TYPE ticket_status_type AS ENUM ('new', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed');
CREATE TYPE communication_channel_type AS ENUM ('phone', 'whatsapp', 'sms', 'email', 'web_form', 'radio', 'internal');

-- Calls table (voice call records)
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_number TEXT UNIQUE NOT NULL,
  caller_name TEXT,
  caller_number TEXT NOT NULL,
  source_line TEXT NOT NULL,
  purpose TEXT,
  assigned_operator UUID REFERENCES profiles(id),
  status call_status_type NOT NULL DEFAULT 'ringing',
  priority call_priority_type NOT NULL DEFAULT 'normal',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  notes TEXT,
  linked_ticket_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operator status tracking
CREATE TABLE operator_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  status operator_status_type NOT NULL DEFAULT 'logged_out',
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_call_id UUID REFERENCES calls(id),
  calls_handled_today INTEGER NOT NULL DEFAULT 0,
  break_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Communication tickets (unified ticketing system)
CREATE TABLE communication_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  channel communication_channel_type NOT NULL,
  sender_name TEXT,
  sender_contact TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority call_priority_type NOT NULL DEFAULT 'normal',
  status ticket_status_type NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id),
  site_id UUID REFERENCES sites(id),
  linked_call_id UUID REFERENCES calls(id),
  dispatch_created BOOLEAN DEFAULT FALSE,
  escalated_to UUID REFERENCES profiles(id),
  escalation_reason TEXT,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp messages
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES communication_tickets(id),
  sender_name TEXT,
  sender_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  media_url TEXT,
  is_incoming BOOLEAN NOT NULL DEFAULT TRUE,
  read_at TIMESTAMPTZ,
  replied_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMS messages
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES communication_tickets(id),
  sender_number TEXT NOT NULL,
  recipient_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  is_incoming BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dispatch requests from communications
CREATE TABLE dispatch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,
  ticket_id UUID REFERENCES communication_tickets(id) NOT NULL,
  call_id UUID REFERENCES calls(id),
  dispatch_type TEXT NOT NULL,
  priority call_priority_type NOT NULL DEFAULT 'normal',
  location TEXT NOT NULL,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  description TEXT NOT NULL,
  requested_by UUID REFERENCES profiles(id) NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  assigned_unit TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Control room can manage calls"
ON calls FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()));

CREATE POLICY "Operators can view their status"
ON operator_statuses FOR SELECT
TO authenticated
USING (auth.uid() = operator_id OR is_elevated_user(auth.uid()));

CREATE POLICY "Control room can manage operator status"
ON operator_statuses FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view tickets"
ON communication_tickets FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Control room can manage tickets"
ON communication_tickets FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()));

CREATE POLICY "Control room can view messages"
ON whatsapp_messages FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Control room can manage messages"
ON whatsapp_messages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()));

CREATE POLICY "Control room can view SMS"
ON sms_messages FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Control room can manage SMS"
ON sms_messages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view dispatch requests"
ON dispatch_requests FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Control room can manage dispatch"
ON dispatch_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'control_room_officer') OR is_elevated_user(auth.uid()));

-- Auto-generate call numbers
CREATE SEQUENCE call_number_seq;

CREATE OR REPLACE FUNCTION set_call_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.call_number IS NULL THEN
    NEW.call_number := 'CALL-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('call_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_call_number_trigger
BEFORE INSERT ON calls
FOR EACH ROW
EXECUTE FUNCTION set_call_number();

-- Auto-generate ticket numbers
CREATE SEQUENCE ticket_number_seq;

CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number_trigger
BEFORE INSERT ON communication_tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_number();

-- Auto-generate dispatch request numbers
CREATE SEQUENCE dispatch_request_seq;

CREATE OR REPLACE FUNCTION set_dispatch_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := 'DISP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('dispatch_request_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_dispatch_request_number_trigger
BEFORE INSERT ON dispatch_requests
FOR EACH ROW
EXECUTE FUNCTION set_dispatch_request_number();

-- Calculate call duration on end
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.answered_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.answered_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_call_duration_trigger
BEFORE UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION calculate_call_duration();

-- Update operator status timestamp
CREATE TRIGGER update_operator_statuses_timestamp
BEFORE UPDATE ON operator_statuses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update ticket timestamp
CREATE TRIGGER update_ticket_timestamp
BEFORE UPDATE ON communication_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();