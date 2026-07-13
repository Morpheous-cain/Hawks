-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL UNIQUE,
  registration_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL, -- Patrol Car, Motorcycle, K9 Unit
  region TEXT,
  status TEXT NOT NULL DEFAULT 'off_duty', -- available, on_patrol, en_route, on_scene, break, off_duty, emergency
  current_officer_id UUID,
  current_assignment TEXT,
  last_gps_lat NUMERIC,
  last_gps_lng NUMERIC,
  last_gps_update TIMESTAMP WITH TIME ZONE,
  fuel_level INTEGER,
  mileage INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mobile patrols table
CREATE TABLE public.mobile_patrols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patrol_id TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL,
  officer_id UUID NOT NULL,
  client_name TEXT,
  site_name TEXT NOT NULL,
  patrol_type TEXT NOT NULL, -- random, scheduled, alarm_response, escort
  priority TEXT NOT NULL DEFAULT 'normal', -- normal, high, urgent
  route_name TEXT,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed, delayed, cancelled
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  gps_trail JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mobile incidents table
CREATE TABLE public.mobile_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL,
  patrol_id UUID,
  officer_id UUID NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  action_taken TEXT,
  location TEXT NOT NULL,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open', -- open, investigating, closed
  priority TEXT DEFAULT 'medium',
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create SOS alerts table
CREATE TABLE public.sos_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_number TEXT NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL,
  officer_id UUID NOT NULL,
  patrol_id UUID,
  gps_lat NUMERIC NOT NULL,
  gps_lng NUMERIC NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active', -- active, responding, resolved, false_alarm
  responded_by UUID,
  response_time TIMESTAMP WITH TIME ZONE,
  resolution_time TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create MDT messages table
CREATE TABLE public.mdt_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  sent_by UUID NOT NULL,
  message_type TEXT NOT NULL, -- instruction, patrol_order, route_change, alarm_response, general
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sequences for auto-generated IDs
CREATE SEQUENCE IF NOT EXISTS mobile_patrol_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS mobile_incident_seq START 1;
CREATE SEQUENCE IF NOT EXISTS sos_alert_seq START 1;

-- Create function to set mobile patrol ID
CREATE OR REPLACE FUNCTION public.set_mobile_patrol_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patrol_id IS NULL THEN
    NEW.patrol_id := 'MPT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('mobile_patrol_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to set mobile incident number
CREATE OR REPLACE FUNCTION public.set_mobile_incident_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.incident_number IS NULL THEN
    NEW.incident_number := 'MI-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('mobile_incident_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to set SOS alert number
CREATE OR REPLACE FUNCTION public.set_sos_alert_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.alert_number IS NULL THEN
    NEW.alert_number := 'SOS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('sos_alert_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER set_mobile_patrol_id_trigger
BEFORE INSERT ON public.mobile_patrols
FOR EACH ROW
EXECUTE FUNCTION public.set_mobile_patrol_id();

CREATE TRIGGER set_mobile_incident_number_trigger
BEFORE INSERT ON public.mobile_incidents
FOR EACH ROW
EXECUTE FUNCTION public.set_mobile_incident_number();

CREATE TRIGGER set_sos_alert_number_trigger
BEFORE INSERT ON public.sos_alerts
FOR EACH ROW
EXECUTE FUNCTION public.set_sos_alert_number();

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_patrols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mdt_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "All authenticated users can view vehicles"
ON public.vehicles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Elevated users can manage vehicles"
ON public.vehicles FOR ALL
USING (is_elevated_user(auth.uid()));

-- RLS Policies for mobile_patrols
CREATE POLICY "All authenticated users can view mobile patrols"
ON public.mobile_patrols FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Officers can update their patrols"
ON public.mobile_patrols FOR UPDATE
USING (auth.uid() = officer_id);

CREATE POLICY "Elevated users can manage mobile patrols"
ON public.mobile_patrols FOR ALL
USING (is_elevated_user(auth.uid()));

-- RLS Policies for mobile_incidents
CREATE POLICY "All authenticated users can view mobile incidents"
ON public.mobile_incidents FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Officers can create incidents"
ON public.mobile_incidents FOR INSERT
WITH CHECK (auth.uid() = officer_id);

CREATE POLICY "Elevated users can manage mobile incidents"
ON public.mobile_incidents FOR ALL
USING (is_elevated_user(auth.uid()));

-- RLS Policies for sos_alerts
CREATE POLICY "All authenticated users can view SOS alerts"
ON public.sos_alerts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Officers can create SOS alerts"
ON public.sos_alerts FOR INSERT
WITH CHECK (auth.uid() = officer_id);

CREATE POLICY "Elevated users can manage SOS alerts"
ON public.sos_alerts FOR ALL
USING (is_elevated_user(auth.uid()));

-- RLS Policies for mdt_messages
CREATE POLICY "Users can view their vehicle messages"
ON public.mdt_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Control room can send messages"
ON public.mdt_messages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'control_room_officer'::app_role) OR is_elevated_user(auth.uid()));

CREATE POLICY "Elevated users can manage messages"
ON public.mdt_messages FOR ALL
USING (is_elevated_user(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_patrols;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mdt_messages;