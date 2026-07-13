-- Create strategic advisories table
CREATE TABLE IF NOT EXISTS public.strategic_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL DEFAULT 'apsl-soc',
  category TEXT NOT NULL CHECK (category IN ('Traffic', 'Protest', 'Terror', 'Weather', 'Crime')),
  sub_category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'NORMAL' CHECK (severity IN ('NORMAL', 'CAUTION', 'CRITICAL')),
  confidence_score DECIMAL(3,2) DEFAULT 0.95 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Investigating', 'Resolved', 'Archived')),
  timestamp_detected TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timestamp_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Location data
  location_lat DECIMAL(10,8),
  location_lon DECIMAL(11,8),
  location_scope_hierarchy TEXT[] DEFAULT ARRAY['Global', 'Africa', 'Kenya'],
  proximate_poi TEXT,
  
  -- Sources and metadata
  sources JSONB DEFAULT '[]'::jsonb,
  recommended_action TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Escalation tracking
  is_escalated BOOLEAN DEFAULT FALSE,
  current_owner_role TEXT DEFAULT 'Analyst',
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  escalated_by UUID REFERENCES auth.users(id),
  escalated_to UUID REFERENCES auth.users(id),
  escalated_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- SLA tracking
  sla_target_minutes INTEGER DEFAULT 5,
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT FALSE,
  
  -- Client notification
  client_notified BOOLEAN DEFAULT FALSE,
  client_notification_sent_at TIMESTAMPTZ,
  affected_client_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create advisory audit trail table
CREATE TABLE IF NOT EXISTS public.strategic_advisory_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_id UUID NOT NULL REFERENCES public.strategic_advisories(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('Created', 'Viewed', 'Acknowledged', 'Escalated', 'Resolved', 'Archived', 'Exported', 'Updated')),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  action_details JSONB DEFAULT '{}'::jsonb,
  previous_state JSONB,
  new_state JSONB
);

-- Create indexes for performance
CREATE INDEX idx_strategic_advisories_category ON public.strategic_advisories(category);
CREATE INDEX idx_strategic_advisories_severity ON public.strategic_advisories(severity);
CREATE INDEX idx_strategic_advisories_status ON public.strategic_advisories(status);
CREATE INDEX idx_strategic_advisories_timestamp ON public.strategic_advisories(timestamp_detected DESC);
CREATE INDEX idx_strategic_advisories_location ON public.strategic_advisories(location_lat, location_lon);
CREATE INDEX idx_strategic_advisories_sla_deadline ON public.strategic_advisories(sla_deadline) WHERE status = 'Active';
CREATE INDEX idx_strategic_advisory_audit_advisory ON public.strategic_advisory_audit(advisory_id);
CREATE INDEX idx_strategic_advisory_audit_performed_at ON public.strategic_advisory_audit(performed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.strategic_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_advisory_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strategic_advisories
CREATE POLICY "Authenticated users can view advisories"
  ON public.strategic_advisories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create advisories"
  ON public.strategic_advisories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Elevated users can update advisories"
  ON public.strategic_advisories FOR UPDATE
  TO authenticated
  USING (is_elevated_user(auth.uid()));

CREATE POLICY "Elevated users can delete advisories"
  ON public.strategic_advisories FOR DELETE
  TO authenticated
  USING (is_elevated_user(auth.uid()));

-- RLS Policies for strategic_advisory_audit
CREATE POLICY "Authenticated users can view audit trail"
  ON public.strategic_advisory_audit FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create audit entries"
  ON public.strategic_advisory_audit FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = performed_by);

-- Function to set SLA deadline on insert
CREATE OR REPLACE FUNCTION public.set_advisory_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := NEW.timestamp_detected + (NEW.sla_target_minutes || ' minutes')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update timestamp_updated
CREATE OR REPLACE FUNCTION public.update_advisory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.timestamp_updated := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check and mark SLA breaches
CREATE OR REPLACE FUNCTION public.check_advisory_sla_breach()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Active' AND NEW.sla_deadline IS NOT NULL THEN
    IF NOW() > NEW.sla_deadline AND NEW.sla_breached = FALSE THEN
      NEW.sla_breached := TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to auto-generate incident_id
CREATE OR REPLACE FUNCTION public.set_advisory_incident_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.incident_id IS NULL OR NEW.incident_id = '' THEN
    SELECT COUNT(*) + 1 INTO next_num FROM public.strategic_advisories WHERE DATE(timestamp_detected) = CURRENT_DATE;
    NEW.incident_id := 'ASD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER set_advisory_incident_id_trigger
  BEFORE INSERT ON public.strategic_advisories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_advisory_incident_id();

CREATE TRIGGER set_advisory_sla_deadline_trigger
  BEFORE INSERT ON public.strategic_advisories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_advisory_sla_deadline();

CREATE TRIGGER update_advisory_timestamp_trigger
  BEFORE UPDATE ON public.strategic_advisories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_advisory_timestamp();

CREATE TRIGGER check_advisory_sla_breach_trigger
  BEFORE UPDATE ON public.strategic_advisories
  FOR EACH ROW
  EXECUTE FUNCTION public.check_advisory_sla_breach();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.strategic_advisories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.strategic_advisory_audit;

COMMENT ON TABLE public.strategic_advisories IS 'Strategic Advisory Dashboard - Real-time intelligence incidents for Traffic, Protest, Terror, Weather, and Crime monitoring';
COMMENT ON TABLE public.strategic_advisory_audit IS 'Audit trail for all strategic advisory actions and views';