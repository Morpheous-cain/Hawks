-- ============================================================
-- INCIDENT NUMBER SEQUENCE (pending application)
-- Replaces client-side Math.random() with an atomic database
-- sequence, and adds a UNIQUE constraint on incident_number.
-- Apply BEFORE incident_command_v2.sql if incidents table already exists.
-- ============================================================

-- Per-year-month sequence tracking table
CREATE TABLE IF NOT EXISTS public.incident_number_seq (
  year_month  char(7) PRIMARY KEY,  -- e.g. '2026-06'
  last_seq    integer NOT NULL DEFAULT 0
);

ALTER TABLE public.incident_number_seq ENABLE ROW LEVEL SECURITY;
-- Only service-role / backend functions should write this; no direct client access.
CREATE POLICY "No direct client access to incident_number_seq"
  ON public.incident_number_seq FOR ALL TO authenticated USING (false);

-- Atomic RPC function that increments and returns the next number.
CREATE OR REPLACE FUNCTION public.next_incident_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ym    char(7);
  v_seq   integer;
  v_num   text;
BEGIN
  v_ym := to_char(now() AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM');

  INSERT INTO public.incident_number_seq (year_month, last_seq)
  VALUES (v_ym, 1)
  ON CONFLICT (year_month) DO UPDATE
    SET last_seq = public.incident_number_seq.last_seq + 1
  RETURNING last_seq INTO v_seq;

  v_num := 'INC-' || v_ym || '-' || lpad(v_seq::text, 4, '0');
  RETURN v_num;
END;
$$;

-- Add UNIQUE constraint to prevent duplicates.
ALTER TABLE public.incidents
  ADD CONSTRAINT IF NOT EXISTS uq_incidents_incident_number UNIQUE (incident_number);
