-- Create advisory_history table to store all received advisories
CREATE TABLE IF NOT EXISTS public.advisory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('traffic', 'terror', 'protest', 'weather')),
  message TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('normal', 'caution', 'critical')),
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.advisory_history ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view advisory history
CREATE POLICY "Authenticated users can view advisory history"
  ON public.advisory_history
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert advisories
CREATE POLICY "Authenticated users can insert advisory history"
  ON public.advisory_history
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for faster queries
CREATE INDEX idx_advisory_history_received_at ON public.advisory_history(received_at DESC);
CREATE INDEX idx_advisory_history_category ON public.advisory_history(category);
CREATE INDEX idx_advisory_history_level ON public.advisory_history(level);

-- Add comment
COMMENT ON TABLE public.advisory_history IS 'Stores all strategic advisories received from the AI system for historical analysis and reporting';