-- Create incidents table for incident reporting
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  location TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES public.staff(id),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incidents
CREATE POLICY "All authenticated users can view incidents"
ON public.incidents FOR SELECT
USING (true);

CREATE POLICY "Elevated users can manage incidents"
ON public.incidents FOR ALL
USING (is_elevated_user(auth.uid()));

-- Create schedules table for staff scheduling
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id),
  client_id UUID REFERENCES public.clients(id),
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  shift_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedules
CREATE POLICY "All authenticated users can view schedules"
ON public.schedules FOR SELECT
USING (true);

CREATE POLICY "Elevated users can manage schedules"
ON public.schedules FOR ALL
USING (is_elevated_user(auth.uid()));

-- Create reports table for generated reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_title TEXT NOT NULL,
  report_data JSONB,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  parameters JSONB
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = generated_by);

CREATE POLICY "Elevated users can view all reports"
ON public.reports FOR SELECT
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Authenticated users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = generated_by);

-- Add triggers for updated_at
CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for incidents
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;