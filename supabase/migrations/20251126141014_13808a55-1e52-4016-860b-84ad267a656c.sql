-- Loss Control Intelligence System Tables
-- Module Code: APSL-LCSM-2025

-- Main loss control records table
CREATE TABLE IF NOT EXISTS public.loss_control_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_number TEXT NOT NULL UNIQUE,
  record_type TEXT NOT NULL CHECK (record_type IN ('loss_event', 'pos_compliance', 'receiving_verification', 'dispatch_verification', 'violation_case')),
  
  -- Site and client information
  site_id UUID REFERENCES public.sites(id),
  client_id UUID REFERENCES public.clients(id),
  
  -- Incident details
  incident_date TIMESTAMPTZ NOT NULL,
  incident_description TEXT NOT NULL,
  location TEXT,
  
  -- Officer/Staff involved
  officer_id UUID REFERENCES public.staff(id),
  cashier_name TEXT,
  pos_terminal_id TEXT,
  
  -- Financial impact
  financial_value NUMERIC(12,2),
  stock_affected TEXT,
  
  -- Risk and classification
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER DEFAULT 0,
  category TEXT,
  
  -- Status and workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'escalated', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Evidence
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  cctv_required BOOLEAN DEFAULT false,
  cctv_footage_refs TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- User tracking
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Additional metadata
  root_cause TEXT,
  corrective_actions_taken TEXT,
  notes TEXT
);

-- Escalation tracking table
CREATE TABLE IF NOT EXISTS public.loss_control_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.loss_control_records(id) ON DELETE CASCADE,
  
  escalation_level INTEGER NOT NULL DEFAULT 1,
  escalated_to UUID REFERENCES auth.users(id),
  escalation_reason TEXT NOT NULL,
  
  -- SLA tracking
  escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sla_deadline TIMESTAMPTZ NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'overdue', 'resolved')),
  
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Risk intelligence tracking
CREATE TABLE IF NOT EXISTS public.loss_control_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity tracking
  entity_type TEXT NOT NULL CHECK (entity_type IN ('site', 'officer', 'cashier', 'pos_terminal')),
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  
  site_id UUID REFERENCES public.sites(id),
  
  -- Risk metrics
  risk_score INTEGER NOT NULL DEFAULT 0,
  incident_count INTEGER DEFAULT 0,
  high_severity_count INTEGER DEFAULT 0,
  financial_loss_total NUMERIC(12,2) DEFAULT 0,
  
  -- Behavioral flags
  repeat_offender BOOLEAN DEFAULT false,
  pattern_detected BOOLEAN DEFAULT false,
  pattern_description TEXT,
  
  -- Time windows
  last_incident_date TIMESTAMPTZ,
  risk_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  risk_period_end TIMESTAMPTZ,
  
  -- Predictive indicators
  predictive_risk_level TEXT CHECK (predictive_risk_level IN ('low', 'medium', 'high', 'critical')),
  audit_recommended BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, site_id)
);

-- Corrective actions tracking
CREATE TABLE IF NOT EXISTS public.loss_control_corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.loss_control_records(id) ON DELETE CASCADE,
  
  action_title TEXT NOT NULL,
  action_description TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('training', 'disciplinary', 'process_change', 'system_upgrade', 'audit', 'investigation')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  due_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'in_progress', 'verified', 'closed')),
  
  -- Verification
  verification_required BOOLEAN DEFAULT true,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Behavior pattern analysis
CREATE TABLE IF NOT EXISTS public.loss_control_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('time_based', 'location_based', 'value_based', 'frequency_based', 'multi_factor')),
  
  -- Pattern detection criteria
  detection_criteria JSONB NOT NULL,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- Related records
  related_record_ids UUID[],
  entity_type TEXT,
  entity_ids TEXT[],
  
  -- Site correlation
  site_ids UUID[],
  
  -- Temporal information
  pattern_start_date TIMESTAMPTZ,
  pattern_end_date TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved', 'false_positive')),
  
  investigation_required BOOLEAN DEFAULT false,
  investigation_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loss_control_records_site_id ON public.loss_control_records(site_id);
CREATE INDEX IF NOT EXISTS idx_loss_control_records_client_id ON public.loss_control_records(client_id);
CREATE INDEX IF NOT EXISTS idx_loss_control_records_status ON public.loss_control_records(status);
CREATE INDEX IF NOT EXISTS idx_loss_control_records_severity ON public.loss_control_records(severity);
CREATE INDEX IF NOT EXISTS idx_loss_control_records_created_at ON public.loss_control_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loss_control_escalations_record_id ON public.loss_control_escalations(record_id);
CREATE INDEX IF NOT EXISTS idx_loss_control_escalations_status ON public.loss_control_escalations(status);
CREATE INDEX IF NOT EXISTS idx_loss_control_escalations_sla_deadline ON public.loss_control_escalations(sla_deadline);

CREATE INDEX IF NOT EXISTS idx_loss_control_risk_scores_entity ON public.loss_control_risk_scores(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_loss_control_risk_scores_site_id ON public.loss_control_risk_scores(site_id);

CREATE INDEX IF NOT EXISTS idx_loss_control_corrective_actions_record_id ON public.loss_control_corrective_actions(record_id);
CREATE INDEX IF NOT EXISTS idx_loss_control_corrective_actions_status ON public.loss_control_corrective_actions(status);

-- Auto-generate record numbers
CREATE SEQUENCE IF NOT EXISTS loss_control_record_seq;

CREATE OR REPLACE FUNCTION public.set_loss_control_record_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.record_number IS NULL THEN
    NEW.record_number := 'LC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('loss_control_record_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_loss_control_record_number_trigger
  BEFORE INSERT ON public.loss_control_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_loss_control_record_number();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_loss_control_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_loss_control_records_timestamp
  BEFORE UPDATE ON public.loss_control_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loss_control_timestamp();

CREATE TRIGGER update_loss_control_escalations_timestamp
  BEFORE UPDATE ON public.loss_control_escalations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loss_control_timestamp();

CREATE TRIGGER update_loss_control_risk_scores_timestamp
  BEFORE UPDATE ON public.loss_control_risk_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loss_control_timestamp();

CREATE TRIGGER update_loss_control_corrective_actions_timestamp
  BEFORE UPDATE ON public.loss_control_corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loss_control_timestamp();

-- Enable RLS
ALTER TABLE public.loss_control_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loss_control_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loss_control_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loss_control_corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loss_control_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view loss control records"
  ON public.loss_control_records FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage loss control records"
  ON public.loss_control_records FOR ALL
  TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role));

CREATE POLICY "Authenticated users can view escalations"
  ON public.loss_control_escalations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage escalations"
  ON public.loss_control_escalations FOR ALL
  TO authenticated
  USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view risk scores"
  ON public.loss_control_risk_scores FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage risk scores"
  ON public.loss_control_risk_scores FOR ALL
  TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role));

CREATE POLICY "Authenticated users can view corrective actions"
  ON public.loss_control_corrective_actions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage corrective actions"
  ON public.loss_control_corrective_actions FOR ALL
  TO authenticated
  USING (is_elevated_user(auth.uid()) OR auth.uid() = assigned_to);

CREATE POLICY "Authenticated users can view behavior patterns"
  ON public.loss_control_behavior_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage behavior patterns"
  ON public.loss_control_behavior_patterns FOR ALL
  TO authenticated
  USING (is_elevated_user(auth.uid()));