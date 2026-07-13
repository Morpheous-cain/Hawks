-- Create checkpoints table for QR code / RFID verification points
CREATE TABLE public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  location_description TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  gps_coordinates TEXT,
  expected_scan_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create patrol checkpoints table to track scans
CREATE TABLE public.patrol_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_id UUID REFERENCES public.patrols(id) ON DELETE CASCADE NOT NULL,
  checkpoint_id UUID REFERENCES public.checkpoints(id) NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scanned_by UUID NOT NULL,
  scan_method TEXT CHECK (scan_method IN ('qr_code', 'rfid', 'manual')) NOT NULL,
  verification_status TEXT CHECK (verification_status IN ('verified', 'late', 'missed', 'early')) DEFAULT 'verified',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RFID card number to staff table
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS rfid_card_number TEXT UNIQUE;

-- Create indexes for better performance
CREATE INDEX idx_checkpoints_site_id ON public.checkpoints(site_id);
CREATE INDEX idx_checkpoints_qr_code ON public.checkpoints(qr_code);
CREATE INDEX idx_patrol_checkpoints_patrol_id ON public.patrol_checkpoints(patrol_id);
CREATE INDEX idx_patrol_checkpoints_checkpoint_id ON public.patrol_checkpoints(checkpoint_id);
CREATE INDEX idx_patrol_checkpoints_scanned_at ON public.patrol_checkpoints(scanned_at);

-- Enable RLS
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checkpoints
CREATE POLICY "All authenticated users can view checkpoints"
ON public.checkpoints FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Elevated users can manage checkpoints"
ON public.checkpoints FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

-- RLS Policies for patrol checkpoints
CREATE POLICY "All authenticated users can view patrol checkpoints"
ON public.patrol_checkpoints FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Guards can scan checkpoints"
ON public.patrol_checkpoints FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = scanned_by);

CREATE POLICY "Elevated users can manage patrol checkpoints"
ON public.patrol_checkpoints FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));