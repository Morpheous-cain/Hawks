-- Training Programs table
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_hours INTEGER DEFAULT 8,
  is_mandatory BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Training Sessions table
CREATE TABLE public.training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  program_id UUID REFERENCES public.training_programs(id),
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  trainer_name TEXT,
  venue TEXT,
  max_capacity INTEGER DEFAULT 20,
  enrolled_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Training Records table
CREATE TABLE public.training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id),
  session_id UUID REFERENCES public.training_sessions(id),
  program_id UUID REFERENCES public.training_programs(id),
  completion_date DATE,
  score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Events table
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  venue TEXT NOT NULL,
  venue_address TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  expected_attendance INTEGER DEFAULT 100,
  security_level TEXT DEFAULT 'medium',
  staff_required INTEGER DEFAULT 5,
  staff_assigned INTEGER DEFAULT 0,
  description TEXT,
  special_requirements TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Event Staff Assignments table
CREATE TABLE public.event_staff_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.security_events(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id),
  role TEXT NOT NULL,
  shift_start TIME,
  shift_end TIME,
  status TEXT DEFAULT 'assigned',
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_staff_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_programs
CREATE POLICY "Allow authenticated read training_programs" ON public.training_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert training_programs" ON public.training_programs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update training_programs" ON public.training_programs FOR UPDATE TO authenticated USING (true);

-- RLS Policies for training_sessions
CREATE POLICY "Allow authenticated read training_sessions" ON public.training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert training_sessions" ON public.training_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update training_sessions" ON public.training_sessions FOR UPDATE TO authenticated USING (true);

-- RLS Policies for training_records
CREATE POLICY "Allow authenticated read training_records" ON public.training_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert training_records" ON public.training_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update training_records" ON public.training_records FOR UPDATE TO authenticated USING (true);

-- RLS Policies for security_events
CREATE POLICY "Allow authenticated read security_events" ON public.security_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert security_events" ON public.security_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update security_events" ON public.security_events FOR UPDATE TO authenticated USING (true);

-- RLS Policies for event_staff_assignments
CREATE POLICY "Allow authenticated read event_staff_assignments" ON public.event_staff_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert event_staff_assignments" ON public.event_staff_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update event_staff_assignments" ON public.event_staff_assignments FOR UPDATE TO authenticated USING (true);

-- Auto session ID trigger
CREATE OR REPLACE FUNCTION public.set_training_session_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_id IS NULL THEN
    NEW.session_id := 'TS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('training_session_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE SEQUENCE IF NOT EXISTS training_session_seq;

CREATE TRIGGER set_training_session_id_trigger
BEFORE INSERT ON public.training_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_training_session_id();