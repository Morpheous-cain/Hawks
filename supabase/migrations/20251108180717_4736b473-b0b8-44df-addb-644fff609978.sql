-- Fix security warning: Set search_path for patrol entry number function
CREATE OR REPLACE FUNCTION set_patrol_entry_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.entry_number IS NULL THEN
    NEW.entry_number := 'PE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('patrol_entry_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;