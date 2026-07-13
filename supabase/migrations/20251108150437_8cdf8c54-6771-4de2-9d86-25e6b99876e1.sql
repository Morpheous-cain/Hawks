-- Create patrols table
CREATE TABLE IF NOT EXISTS public.patrols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES public.staff(id),
  site_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  route_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dob_entries table
CREATE TABLE IF NOT EXISTS public.dob_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL,
  description TEXT NOT NULL,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  site_name TEXT NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patrols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dob_entries ENABLE ROW LEVEL SECURITY;

-- Patrols policies
CREATE POLICY "All authenticated users can view patrols" ON public.patrols 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Elevated users can manage patrols" ON public.patrols 
FOR ALL USING (is_elevated_user(auth.uid()));

-- DOB entries policies  
CREATE POLICY "All authenticated users can view DOB entries" ON public.dob_entries 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create DOB entries" ON public.dob_entries 
FOR INSERT WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "Elevated users can manage DOB entries" ON public.dob_entries 
FOR ALL USING (is_elevated_user(auth.uid()));

-- Enable realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.patrols;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dob_entries;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;