-- Create comms_records table for centralized communication logging
CREATE TABLE IF NOT EXISTS public.comms_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id),
  alarm_id UUID REFERENCES public.alarm_activations(id),
  type TEXT NOT NULL CHECK (type IN ('radio', 'call', 'sms', 'ptt', 'email', 'whatsapp', 'body_cam')),
  from_user UUID REFERENCES auth.users(id),
  to_user UUID REFERENCES auth.users(id),
  to_unit UUID REFERENCES public.vehicles(id),
  message_summary TEXT,
  full_transcript TEXT,
  recording_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shift_logs table for handover and shift management
CREATE TABLE IF NOT EXISTS public.shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id TEXT NOT NULL,
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE,
  operator_id UUID REFERENCES auth.users(id) NOT NULL,
  supervisor_id UUID REFERENCES auth.users(id),
  handover_notes TEXT,
  issues_flagged TEXT,
  incidents_handled INTEGER DEFAULT 0,
  alarms_acknowledged INTEGER DEFAULT 0,
  dispatches_made INTEGER DEFAULT 0,
  sla_breaches INTEGER DEFAULT 0,
  summary_auto_generated BOOLEAN DEFAULT FALSE,
  signed_off_at TIMESTAMP WITH TIME ZONE,
  signed_off_by UUID REFERENCES auth.users(id),
  incoming_operator_viewed BOOLEAN DEFAULT FALSE,
  incoming_operator_signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create welfare_events table for guard and staff safety monitoring
CREATE TABLE IF NOT EXISTS public.welfare_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID REFERENCES public.staff(id) NOT NULL,
  site_id UUID REFERENCES public.sites(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('missed_checkin', 'sos', 'long_inactivity', 'panic', 'man_down', 'no_response', 'welfare_check')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  handled_by_operator UUID REFERENCES auth.users(id),
  action_taken TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'investigating', 'resolved', 'escalated')) DEFAULT 'active',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  escalated_to UUID REFERENCES auth.users(id),
  gps_location TEXT,
  last_known_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sop_configurations table for incident handling rules
CREATE TABLE IF NOT EXISTS public.sop_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL UNIQUE,
  default_severity TEXT NOT NULL CHECK (default_severity IN ('low', 'medium', 'high', 'critical')),
  default_units_required INTEGER DEFAULT 1,
  response_time_target_minutes INTEGER NOT NULL,
  escalation_time_minutes INTEGER,
  steps JSONB NOT NULL DEFAULT '[]',
  mandatory_fields JSONB DEFAULT '[]',
  requires_supervisor_approval BOOLEAN DEFAULT FALSE,
  requires_police_notification BOOLEAN DEFAULT FALSE,
  requires_cctv_review BOOLEAN DEFAULT FALSE,
  auto_create_investigation BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.comms_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comms_records
CREATE POLICY "Control room can manage comms records"
ON public.comms_records FOR ALL
USING (
  has_role(auth.uid(), 'control_room_officer'::app_role) OR 
  is_elevated_user(auth.uid())
);

CREATE POLICY "Users can view their own comms"
ON public.comms_records FOR SELECT
USING (
  auth.uid() = from_user OR 
  auth.uid() = to_user OR
  has_role(auth.uid(), 'control_room_officer'::app_role) OR
  is_elevated_user(auth.uid())
);

-- RLS Policies for shift_logs
CREATE POLICY "Operators can view their shifts"
ON public.shift_logs FOR SELECT
USING (
  auth.uid() = operator_id OR
  auth.uid() = supervisor_id OR
  has_role(auth.uid(), 'control_room_officer'::app_role) OR
  is_elevated_user(auth.uid())
);

CREATE POLICY "Operators can manage their shifts"
ON public.shift_logs FOR ALL
USING (
  auth.uid() = operator_id OR
  has_role(auth.uid(), 'control_room_officer'::app_role) OR
  is_elevated_user(auth.uid())
);

-- RLS Policies for welfare_events
CREATE POLICY "Authenticated users can view welfare events"
ON public.welfare_events FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Control room can manage welfare events"
ON public.welfare_events FOR ALL
USING (
  has_role(auth.uid(), 'control_room_officer'::app_role) OR
  is_elevated_user(auth.uid())
);

-- RLS Policies for sop_configurations
CREATE POLICY "Everyone can view SOPs"
ON public.sop_configurations FOR SELECT
USING (active = TRUE);

CREATE POLICY "Elevated users can manage SOPs"
ON public.sop_configurations FOR ALL
USING (is_elevated_user(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_comms_records_incident ON public.comms_records(incident_id);
CREATE INDEX idx_comms_records_timestamp ON public.comms_records(timestamp DESC);
CREATE INDEX idx_shift_logs_operator ON public.shift_logs(operator_id);
CREATE INDEX idx_shift_logs_shift_start ON public.shift_logs(shift_start DESC);
CREATE INDEX idx_welfare_events_guard ON public.welfare_events(guard_id);
CREATE INDEX idx_welfare_events_status ON public.welfare_events(status);
CREATE INDEX idx_welfare_events_triggered ON public.welfare_events(triggered_at DESC);

-- Insert default SOP configurations
INSERT INTO public.sop_configurations (incident_type, default_severity, response_time_target_minutes, escalation_time_minutes, steps, mandatory_fields) VALUES
('intrusion', 'critical', 10, 15, 
  '[
    {"order": 1, "action": "Acknowledge alarm within 30 seconds"},
    {"order": 2, "action": "Pull CCTV for visual confirmation"},
    {"order": 3, "action": "Notify site supervisor and duty manager"},
    {"order": 4, "action": "Dispatch nearest patrol unit (minimum 1 vehicle)"},
    {"order": 5, "action": "Mark incident as On Scene once arrived"},
    {"order": 6, "action": "Obtain site confirmation and log outcome"}
  ]',
  '["police_ob_number", "outcome", "cctv_reviewed"]'
),
('fire', 'critical', 5, 10,
  '[
    {"order": 1, "action": "Immediate acknowledgment"},
    {"order": 2, "action": "Alert fire department"},
    {"order": 3, "action": "Notify building management"},
    {"order": 4, "action": "Initiate evacuation protocol"},
    {"order": 5, "action": "Dispatch response team"}
  ]',
  '["fire_dept_notified", "evacuation_status", "casualties"]'
),
('assault', 'high', 8, 12,
  '[
    {"order": 1, "action": "Acknowledge and assess severity"},
    {"order": 2, "action": "Dispatch security response"},
    {"order": 3, "action": "Notify police if required"},
    {"order": 4, "action": "Secure scene and preserve evidence"},
    {"order": 5, "action": "Arrange medical assistance if needed"}
  ]',
  '["police_notified", "medical_required", "witness_statements"]'
),
('panic_button', 'critical', 3, 5,
  '[
    {"order": 1, "action": "Immediate radio contact with guard"},
    {"order": 2, "action": "Check CCTV if available"},
    {"order": 3, "action": "Dispatch nearest unit immediately"},
    {"order": 4, "action": "Notify site supervisor"},
    {"order": 5, "action": "Prepare for police notification if no response"}
  ]',
  '["guard_contacted", "backup_dispatched", "situation_confirmed"]'
);

-- Update existing incidents table to support SOP workflow
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS sop_type TEXT REFERENCES public.sop_configurations(incident_type),
ADD COLUMN IF NOT EXISTS sla_target_minutes INTEGER,
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS steps_completed JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS supervisor_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS supervisor_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mandatory_fields_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS linked_patrol_id UUID,
ADD COLUMN IF NOT EXISTS linked_alarm_id UUID REFERENCES public.alarm_activations(id);