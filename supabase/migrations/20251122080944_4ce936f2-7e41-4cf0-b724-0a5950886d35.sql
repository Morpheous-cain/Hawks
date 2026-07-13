-- Body Cam Integration Module (BCI-2025)
-- Tables for device management, footage, evidence clips, and chain of custody

-- Body Cam Devices Table
CREATE TABLE IF NOT EXISTS public.body_cam_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  serial_number TEXT NOT NULL UNIQUE,
  device_status TEXT NOT NULL DEFAULT 'available',
  assigned_to UUID REFERENCES public.staff(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  battery_level INTEGER,
  firmware_version TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  gps_enabled BOOLEAN DEFAULT true,
  night_vision_capable BOOLEAN DEFAULT true,
  recording_quality TEXT DEFAULT '1080p',
  storage_capacity_gb INTEGER DEFAULT 128,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Body Cam Footage Table (raw recordings)
CREATE TABLE IF NOT EXISTS public.body_cam_footage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  footage_id TEXT NOT NULL UNIQUE,
  device_id UUID REFERENCES public.body_cam_devices(id) NOT NULL,
  officer_id UUID REFERENCES public.staff(id) NOT NULL,
  site_id UUID REFERENCES public.sites(id),
  client_id UUID REFERENCES public.clients(id),
  recording_start TIMESTAMP WITH TIME ZONE NOT NULL,
  recording_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  file_url TEXT NOT NULL,
  file_size_mb NUMERIC,
  file_hash TEXT NOT NULL,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  recording_type TEXT DEFAULT 'continuous',
  is_live BOOLEAN DEFAULT false,
  stream_url TEXT,
  quality TEXT DEFAULT '1080p',
  has_audio BOOLEAN DEFAULT true,
  watermark_applied BOOLEAN DEFAULT true,
  upload_status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Body Cam Evidence Clips Table
CREATE TABLE IF NOT EXISTS public.body_cam_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id TEXT NOT NULL UNIQUE,
  footage_id UUID REFERENCES public.body_cam_footage(id) NOT NULL,
  incident_id UUID REFERENCES public.incidents(id),
  alarm_id UUID REFERENCES public.alarm_activations(id),
  dob_entry_id UUID REFERENCES public.dob_entries(id),
  clip_name TEXT NOT NULL,
  clip_description TEXT,
  clip_start TIMESTAMP WITH TIME ZONE NOT NULL,
  clip_end TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL,
  clip_url TEXT NOT NULL,
  thumbnail_url TEXT,
  trigger_type TEXT NOT NULL,
  trigger_source TEXT,
  officer_id UUID REFERENCES public.staff(id) NOT NULL,
  site_id UUID REFERENCES public.sites(id),
  client_id UUID REFERENCES public.clients(id),
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT,
  status TEXT DEFAULT 'draft',
  locked_as_evidence BOOLEAN DEFAULT false,
  locked_by UUID REFERENCES public.profiles(id),
  locked_at TIMESTAMP WITH TIME ZONE,
  retention_years INTEGER DEFAULT 5,
  expiry_date DATE,
  exported BOOLEAN DEFAULT false,
  export_count INTEGER DEFAULT 0,
  shared_with_client BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clip Chain of Custody Log Table
CREATE TABLE IF NOT EXISTS public.clip_chain_of_custody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES public.body_cam_clips(id) NOT NULL,
  action TEXT NOT NULL,
  action_details TEXT,
  performed_by UUID REFERENCES public.profiles(id) NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  export_format TEXT,
  export_reason TEXT,
  recipient TEXT,
  access_expiry DATE
);

-- Device Assignment Log Table
CREATE TABLE IF NOT EXISTS public.device_assignment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.body_cam_devices(id) NOT NULL,
  officer_id UUID REFERENCES public.staff(id) NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  returned_at TIMESTAMP WITH TIME ZONE,
  shift_id UUID,
  battery_at_issue INTEGER,
  battery_at_return INTEGER,
  condition_at_issue TEXT,
  condition_at_return TEXT,
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.body_cam_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_cam_footage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_cam_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clip_chain_of_custody ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_assignment_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for body_cam_devices
CREATE POLICY "Control room and elevated users can manage devices"
  ON public.body_cam_devices FOR ALL
  USING (has_role(auth.uid(), 'control_room_officer'::app_role) OR is_elevated_user(auth.uid()));

CREATE POLICY "Officers can view their assigned device"
  ON public.body_cam_devices FOR SELECT
  USING (auth.uid() = assigned_to OR is_elevated_user(auth.uid()));

-- RLS Policies for body_cam_footage
CREATE POLICY "Control room can manage footage"
  ON public.body_cam_footage FOR ALL
  USING (has_role(auth.uid(), 'control_room_officer'::app_role) OR is_elevated_user(auth.uid()));

CREATE POLICY "Officers can view their own footage"
  ON public.body_cam_footage FOR SELECT
  USING (auth.uid() = officer_id OR is_elevated_user(auth.uid()));

-- RLS Policies for body_cam_clips
CREATE POLICY "Authenticated users can view unlocked clips"
  ON public.body_cam_clips FOR SELECT
  USING (NOT locked_as_evidence OR is_elevated_user(auth.uid()));

CREATE POLICY "Control room and investigators can manage clips"
  ON public.body_cam_clips FOR ALL
  USING (has_role(auth.uid(), 'control_room_officer'::app_role) OR is_elevated_user(auth.uid()));

-- RLS Policies for clip_chain_of_custody
CREATE POLICY "Elevated users can view chain of custody"
  ON public.clip_chain_of_custody FOR SELECT
  USING (is_elevated_user(auth.uid()));

CREATE POLICY "System can insert custody logs"
  ON public.clip_chain_of_custody FOR INSERT
  WITH CHECK (auth.uid() = performed_by);

-- RLS Policies for device_assignment_log
CREATE POLICY "Control room can manage device assignments"
  ON public.device_assignment_log FOR ALL
  USING (has_role(auth.uid(), 'control_room_officer'::app_role) OR is_elevated_user(auth.uid()));

CREATE POLICY "Officers can view their device history"
  ON public.device_assignment_log FOR SELECT
  USING (auth.uid() = officer_id OR is_elevated_user(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_body_cam_footage_officer ON public.body_cam_footage(officer_id);
CREATE INDEX idx_body_cam_footage_recording_start ON public.body_cam_footage(recording_start DESC);
CREATE INDEX idx_body_cam_footage_is_live ON public.body_cam_footage(is_live) WHERE is_live = true;
CREATE INDEX idx_body_cam_clips_incident ON public.body_cam_clips(incident_id);
CREATE INDEX idx_body_cam_clips_alarm ON public.body_cam_clips(alarm_id);
CREATE INDEX idx_body_cam_clips_status ON public.body_cam_clips(status);
CREATE INDEX idx_body_cam_clips_locked ON public.body_cam_clips(locked_as_evidence);
CREATE INDEX idx_clip_custody_clip_id ON public.clip_chain_of_custody(clip_id);
CREATE INDEX idx_clip_custody_performed_at ON public.clip_chain_of_custody(performed_at DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_body_cam_devices_updated_at
  BEFORE UPDATE ON public.body_cam_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_body_cam_clips_updated_at
  BEFORE UPDATE ON public.body_cam_clips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-generate evidence IDs
CREATE OR REPLACE FUNCTION public.generate_evidence_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  evidence_id TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.body_cam_clips;
  evidence_id := 'EV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN evidence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to set evidence ID automatically
CREATE OR REPLACE FUNCTION public.set_evidence_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.evidence_id IS NULL OR NEW.evidence_id = '' THEN
    NEW.evidence_id := generate_evidence_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_body_cam_clip_evidence_id
  BEFORE INSERT ON public.body_cam_clips
  FOR EACH ROW
  EXECUTE FUNCTION public.set_evidence_id();

-- Function to auto-generate footage IDs
CREATE OR REPLACE FUNCTION public.set_footage_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.footage_id IS NULL OR NEW.footage_id = '' THEN
    NEW.footage_id := 'FT-' || TO_CHAR(NEW.recording_start, 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_body_cam_footage_id
  BEFORE INSERT ON public.body_cam_footage
  FOR EACH ROW
  EXECUTE FUNCTION public.set_footage_id();