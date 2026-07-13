-- Create alarm_sensors table for tracking all security sensors
CREATE TABLE IF NOT EXISTS public.alarm_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id TEXT NOT NULL UNIQUE,
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('fire', 'panic', 'intrusion', 'motion', 'glass_break', 'door_contact')),
  site_id UUID REFERENCES public.sites(id),
  client_id UUID REFERENCES public.clients(id),
  location_description TEXT NOT NULL,
  zone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  last_test_date TIMESTAMPTZ,
  next_maintenance_date DATE,
  installation_date DATE,
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'faulty', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create alarm_activations table for logging all alarm triggers
CREATE TABLE IF NOT EXISTS public.alarm_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_number TEXT NOT NULL UNIQUE,
  sensor_id UUID REFERENCES public.alarm_sensors(id),
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  alarm_type TEXT NOT NULL,
  location TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dispatched', 'investigating', 'resolved', 'false_alarm')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  dispatched_at TIMESTAMPTZ,
  assigned_vehicle_id UUID REFERENCES public.vehicles(id),
  assigned_to UUID REFERENCES auth.users(id),
  arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  false_alarm BOOLEAN DEFAULT false,
  response_time_minutes INTEGER,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sequence for alarm numbers
CREATE SEQUENCE IF NOT EXISTS alarm_number_seq START 1;

-- Function to auto-generate alarm numbers
CREATE OR REPLACE FUNCTION public.set_alarm_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.alarm_number IS NULL THEN
    NEW.alarm_number := 'ALM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('alarm_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate alarm numbers
CREATE TRIGGER set_alarm_number_trigger
BEFORE INSERT ON public.alarm_activations
FOR EACH ROW
EXECUTE FUNCTION public.set_alarm_number();

-- Function to calculate response time when alarm is resolved
CREATE OR REPLACE FUNCTION public.calculate_alarm_response_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.arrived_at IS NOT NULL AND OLD.arrived_at IS NULL THEN
    NEW.response_time_minutes := EXTRACT(EPOCH FROM (NEW.arrived_at - NEW.triggered_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to calculate response time
CREATE TRIGGER calculate_alarm_response_time_trigger
BEFORE UPDATE ON public.alarm_activations
FOR EACH ROW
EXECUTE FUNCTION public.calculate_alarm_response_time();

-- Enable RLS
ALTER TABLE public.alarm_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarm_activations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alarm_sensors
CREATE POLICY "All authenticated users can view sensors"
ON public.alarm_sensors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Elevated users can manage sensors"
ON public.alarm_sensors FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

-- RLS Policies for alarm_activations
CREATE POLICY "All authenticated users can view alarm activations"
ON public.alarm_activations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Control room can manage alarm activations"
ON public.alarm_activations FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'control_room_officer'::app_role) OR 
  is_elevated_user(auth.uid())
);

-- Enable realtime for alarm activations
ALTER PUBLICATION supabase_realtime ADD TABLE public.alarm_activations;

-- Insert sample sensor data
INSERT INTO public.alarm_sensors (sensor_id, sensor_type, location_description, zone_number, status, client_id, site_id) VALUES
('SENS-FIRE-001', 'fire', 'JKIA Terminal 2 - Main Lobby', 'Z1-A', 'operational', NULL, NULL),
('SENS-FIRE-002', 'fire', 'JKIA Terminal 2 - Baggage Area', 'Z1-B', 'operational', NULL, NULL),
('SENS-PANIC-001', 'panic', 'JKIA Terminal 2 - Security Desk', 'Z1-C', 'operational', NULL, NULL),
('SENS-PANIC-002', 'panic', 'JKIA Terminal 2 - Information Desk', 'Z1-D', 'operational', NULL, NULL),
('SENS-INTR-001', 'intrusion', 'JKIA Terminal 2 - North Perimeter', 'Z1-E', 'operational', NULL, NULL),
('SENS-FIRE-003', 'fire', 'Villa Rosa Kempinski - Lobby', 'Z2-A', 'operational', NULL, NULL),
('SENS-FIRE-004', 'fire', 'Villa Rosa Kempinski - Kitchen', 'Z2-B', 'operational', NULL, NULL),
('SENS-PANIC-003', 'panic', 'Villa Rosa Kempinski - Reception', 'Z2-C', 'operational', NULL, NULL),
('SENS-INTR-002', 'intrusion', 'Villa Rosa - North Perimeter', 'Z2-D', 'operational', NULL, NULL),
('SENS-FIRE-005', 'fire', 'Two Rivers Mall - Parking Lot B', 'Z3-A', 'operational', NULL, NULL),
('SENS-FIRE-006', 'fire', 'Two Rivers Mall - Food Court', 'Z3-B', 'maintenance', NULL, NULL),
('SENS-PANIC-004', 'panic', 'Two Rivers Mall - Security Office', 'Z3-C', 'operational', NULL, NULL)
ON CONFLICT (sensor_id) DO NOTHING;