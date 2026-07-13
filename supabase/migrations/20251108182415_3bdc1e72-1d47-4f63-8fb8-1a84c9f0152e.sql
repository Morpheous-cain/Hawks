-- Add new columns to patrols table for comprehensive patrol management
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS patrol_id TEXT UNIQUE;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS patrol_date DATE;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS shift_start TIME;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS shift_end TIME;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS patrol_type TEXT DEFAULT 'routine';
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS supervisor_rfid_id TEXT;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS vehicle_assigned TEXT;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS k9_assigned TEXT;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS frequency TEXT;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS next_patrol_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE patrols ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create sequence for patrol ID generation
CREATE SEQUENCE IF NOT EXISTS patrol_id_seq START WITH 1;

-- Create function to auto-generate patrol ID
CREATE OR REPLACE FUNCTION set_patrol_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.patrol_id IS NULL THEN
    NEW.patrol_id := 'PT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('patrol_id_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating patrol ID
DROP TRIGGER IF EXISTS set_patrol_id_trigger ON patrols;
CREATE TRIGGER set_patrol_id_trigger
BEFORE INSERT ON patrols
FOR EACH ROW
EXECUTE FUNCTION set_patrol_id();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_patrols_patrol_id ON patrols(patrol_id);
CREATE INDEX IF NOT EXISTS idx_patrols_status ON patrols(status);
CREATE INDEX IF NOT EXISTS idx_patrols_patrol_date ON patrols(patrol_date);

-- Add comment to table
COMMENT ON TABLE patrols IS 'Stores patrol routes with checkpoints, schedules, and supervisor assignments';