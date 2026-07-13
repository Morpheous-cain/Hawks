-- Add new columns to patrol_checkpoints for comprehensive patrol entry
ALTER TABLE patrol_checkpoints
ADD COLUMN IF NOT EXISTS gps_coordinates TEXT,
ADD COLUMN IF NOT EXISTS observation TEXT,
ADD COLUMN IF NOT EXISTS incident_flag BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS media_attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS guard_on_duty_name TEXT,
ADD COLUMN IF NOT EXISTS guard_rfid_id TEXT,
ADD COLUMN IF NOT EXISTS next_scheduled_patrol TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS supervisor_signature TEXT,
ADD COLUMN IF NOT EXISTS control_room_operator UUID,
ADD COLUMN IF NOT EXISTS patrol_type TEXT,
ADD COLUMN IF NOT EXISTS entry_number TEXT UNIQUE;

-- Create sequence for entry numbers
CREATE SEQUENCE IF NOT EXISTS patrol_entry_seq START 1000;

-- Trigger function to auto-generate entry number
CREATE OR REPLACE FUNCTION set_patrol_entry_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entry_number IS NULL THEN
    NEW.entry_number := 'PE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('patrol_entry_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_entry_number ON patrol_checkpoints;
CREATE TRIGGER set_entry_number
BEFORE INSERT ON patrol_checkpoints
FOR EACH ROW
EXECUTE FUNCTION set_patrol_entry_number();

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_patrol_checkpoints_entry_number ON patrol_checkpoints(entry_number);
CREATE INDEX IF NOT EXISTS idx_patrol_checkpoints_verification_status ON patrol_checkpoints(verification_status);
CREATE INDEX IF NOT EXISTS idx_patrol_checkpoints_incident_flag ON patrol_checkpoints(incident_flag);

-- Add comment for audit trail
COMMENT ON TABLE patrol_checkpoints IS 'Stores comprehensive patrol checkpoint entries with RFID, QR, GPS verification and supervisor observations. Compliant with Kenya Data Protection Act 2021.';