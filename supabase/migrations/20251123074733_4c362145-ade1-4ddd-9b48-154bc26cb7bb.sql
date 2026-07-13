-- Technical Security Department Management System Tables

-- Equipment Registry
CREATE TABLE IF NOT EXISTS public.technical_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT NOT NULL UNIQUE,
  equipment_type TEXT NOT NULL, -- CCTV, Boom Barrier, Electric Fence, Access Control, Alarm, Fire System, Intercom, Parking System
  equipment_category TEXT NOT NULL, -- Camera, DVR/NVR, Barrier, Energizer, Panel, Sensor, etc.
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  location_description TEXT NOT NULL,
  installation_date DATE,
  warranty_expiry DATE,
  status TEXT NOT NULL DEFAULT 'operational', -- operational, faulty, maintenance, decommissioned
  health_score INTEGER DEFAULT 100, -- 0-100
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  lifecycle_stage TEXT DEFAULT 'active', -- active, aging, critical, end-of-life
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  specifications JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders & Service Requests
CREATE TABLE IF NOT EXISTS public.technical_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE,
  work_order_type TEXT NOT NULL, -- Installation, Maintenance, Repair, Inspection, Upgrade, Emergency
  priority TEXT NOT NULL DEFAULT 'medium', -- critical, high, medium, low
  service_category TEXT NOT NULL, -- CCTV, Access Control, Alarm, etc.
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  equipment_id UUID REFERENCES public.technical_equipment(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to UUID REFERENCES public.staff(id), -- Technician
  assigned_by UUID REFERENCES auth.users(id), -- Manager/Supervisor
  assigned_at TIMESTAMPTZ,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, assessed, assigned, in-progress, testing, client-review, completed, cancelled
  workflow_stage TEXT NOT NULL DEFAULT 'initiated', -- initiated, assessed, allocated, executing, testing, verified, closed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id), -- QA Officer
  verified_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id), -- Manager/Head
  approved_at TIMESTAMPTZ,
  client_acceptance TEXT, -- accepted, rejected, pending
  client_signature TEXT,
  client_acceptance_date TIMESTAMPTZ,
  findings TEXT,
  action_taken TEXT,
  parts_used JSONB,
  hours_spent NUMERIC,
  cost NUMERIC,
  sla_target_hours INTEGER,
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT FALSE,
  photos JSONB,
  attachments JSONB,
  compliance_checklist JSONB,
  quality_score INTEGER, -- 0-100
  technician_notes TEXT,
  supervisor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preventive Maintenance Schedules
CREATE TABLE IF NOT EXISTS public.technical_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id TEXT NOT NULL UNIQUE,
  equipment_id UUID REFERENCES public.technical_equipment(id),
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  maintenance_type TEXT NOT NULL, -- routine, preventive, statutory, warranty
  service_category TEXT NOT NULL,
  frequency TEXT NOT NULL, -- weekly, monthly, quarterly, biannual, annual
  frequency_days INTEGER NOT NULL, -- Auto-calculated
  last_service_date DATE,
  next_service_date DATE NOT NULL,
  assigned_technician UUID REFERENCES public.staff(id),
  status TEXT DEFAULT 'active', -- active, paused, completed
  priority TEXT DEFAULT 'medium',
  estimated_hours NUMERIC,
  maintenance_checklist JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service History Log
CREATE TABLE IF NOT EXISTS public.technical_service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.technical_equipment(id),
  work_order_id UUID REFERENCES public.technical_work_orders(id),
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  technician_id UUID REFERENCES public.staff(id),
  findings TEXT,
  action_taken TEXT,
  parts_replaced JSONB,
  before_health_score INTEGER,
  after_health_score INTEGER,
  cost NUMERIC,
  downtime_hours NUMERIC,
  photos JSONB,
  logged_by UUID REFERENCES auth.users(id),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Control Inspections
CREATE TABLE IF NOT EXISTS public.technical_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id TEXT NOT NULL UNIQUE,
  inspection_type TEXT NOT NULL, -- installation-qa, maintenance-qa, safety-audit, compliance-check
  work_order_id UUID REFERENCES public.technical_work_orders(id),
  equipment_id UUID REFERENCES public.technical_equipment(id),
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  inspector_id UUID REFERENCES auth.users(id), -- QA Officer
  inspection_date DATE NOT NULL,
  inspection_checklist JSONB NOT NULL,
  passed BOOLEAN,
  compliance_score INTEGER, -- 0-100
  findings TEXT,
  defects_found JSONB,
  corrective_actions TEXT,
  reinspection_required BOOLEAN DEFAULT FALSE,
  reinspection_date DATE,
  status TEXT DEFAULT 'pending', -- pending, passed, failed, corrective-action-required
  photos JSONB,
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technician Performance Metrics
CREATE TABLE IF NOT EXISTS public.technical_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES public.staff(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_jobs_assigned INTEGER DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  jobs_pending INTEGER DEFAULT 0,
  average_response_time_hours NUMERIC,
  average_completion_time_hours NUMERIC,
  sla_compliance_rate NUMERIC, -- Percentage
  quality_score_average NUMERIC, -- 0-100
  client_satisfaction_average NUMERIC, -- 0-5
  safety_compliance_rate NUMERIC,
  rework_count INTEGER DEFAULT 0,
  repeat_fault_involvement INTEGER DEFAULT 0,
  training_courses_completed INTEGER DEFAULT 0,
  certifications_acquired INTEGER DEFAULT 0,
  disciplinary_actions INTEGER DEFAULT 0,
  commendations INTEGER DEFAULT 0,
  performance_rating TEXT, -- excellent, good, satisfactory, needs-improvement, unsatisfactory
  supervisor_notes TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculated_by UUID REFERENCES auth.users(id)
);

-- Risk Assessments & Control
CREATE TABLE IF NOT EXISTS public.technical_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL UNIQUE,
  risk_type TEXT NOT NULL, -- aging-infrastructure, overload, power-dependency, maintenance-gap, human-error
  risk_category TEXT NOT NULL, -- CCTV, Access Control, Alarm, etc.
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  equipment_id UUID REFERENCES public.technical_equipment(id),
  risk_title TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  probability TEXT NOT NULL, -- very-low, low, medium, high, very-high
  impact TEXT NOT NULL, -- negligible, minor, moderate, major, catastrophic
  risk_score INTEGER, -- Auto-calculated
  current_controls TEXT,
  control_effectiveness TEXT, -- poor, fair, good, excellent
  residual_risk TEXT, -- low, medium, high, critical
  mitigation_actions TEXT,
  action_owner UUID REFERENCES auth.users(id),
  action_deadline DATE,
  status TEXT DEFAULT 'open', -- open, mitigating, closed, accepted
  identified_by UUID REFERENCES auth.users(id),
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Site Technical Profiles
CREATE TABLE IF NOT EXISTS public.technical_client_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  system_complexity_index INTEGER, -- 0-100
  risk_exposure_rating TEXT, -- low, medium, high, critical
  maintenance_responsiveness_score INTEGER, -- 0-100
  dependence_severity TEXT, -- low, medium, high, critical
  total_equipment_count INTEGER DEFAULT 0,
  critical_equipment_count INTEGER DEFAULT 0,
  aging_equipment_count INTEGER DEFAULT 0,
  maintenance_compliance_rate NUMERIC,
  fault_frequency_30d INTEGER DEFAULT 0,
  fault_frequency_90d INTEGER DEFAULT 0,
  average_response_time_hours NUMERIC,
  last_incident_date DATE,
  last_maintenance_date DATE,
  next_scheduled_maintenance DATE,
  technical_contact_name TEXT,
  technical_contact_phone TEXT,
  technical_contact_email TEXT,
  special_requirements TEXT,
  access_instructions TEXT,
  emergency_procedures TEXT,
  site_drawings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, site_id)
);

-- Auto-generate work order numbers
CREATE SEQUENCE IF NOT EXISTS work_order_number_seq;
CREATE OR REPLACE FUNCTION public.set_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.work_order_number IS NULL THEN
    NEW.work_order_number := 'WO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('work_order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_work_order_number_trigger
BEFORE INSERT ON public.technical_work_orders
FOR EACH ROW EXECUTE FUNCTION public.set_work_order_number();

-- Auto-generate equipment IDs
CREATE OR REPLACE FUNCTION public.generate_equipment_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  equipment_id TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.technical_equipment;
  equipment_id := 'EQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN equipment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_equipment_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.equipment_id IS NULL OR NEW.equipment_id = '' THEN
    NEW.equipment_id := generate_equipment_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_equipment_id_trigger
BEFORE INSERT ON public.technical_equipment
FOR EACH ROW EXECUTE FUNCTION public.set_equipment_id();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_technical_equipment_client ON public.technical_equipment(client_id);
CREATE INDEX IF NOT EXISTS idx_technical_equipment_site ON public.technical_equipment(site_id);
CREATE INDEX IF NOT EXISTS idx_technical_equipment_status ON public.technical_equipment(status);
CREATE INDEX IF NOT EXISTS idx_technical_work_orders_client ON public.technical_work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_technical_work_orders_status ON public.technical_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_technical_work_orders_assigned ON public.technical_work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_technical_maintenance_next_due ON public.technical_maintenance_schedules(next_service_date);

-- Enable RLS
ALTER TABLE public.technical_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_client_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view equipment"
ON public.technical_equipment FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Technical staff can manage equipment"
ON public.technical_equipment FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view work orders"
ON public.technical_work_orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Technical staff can manage work orders"
ON public.technical_work_orders FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view maintenance schedules"
ON public.technical_maintenance_schedules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Technical staff can manage maintenance schedules"
ON public.technical_maintenance_schedules FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view service history"
ON public.technical_service_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Technical staff can manage service history"
ON public.technical_service_history FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view inspections"
ON public.technical_inspections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Technical staff can manage inspections"
ON public.technical_inspections FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Elevated users can view performance metrics"
ON public.technical_performance_metrics FOR SELECT
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Elevated users can manage performance metrics"
ON public.technical_performance_metrics FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view risk assessments"
ON public.technical_risk_assessments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Technical staff can manage risk assessments"
ON public.technical_risk_assessments FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can view client site profiles"
ON public.technical_client_sites FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Technical staff can manage client site profiles"
ON public.technical_client_sites FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));