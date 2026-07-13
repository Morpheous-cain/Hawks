-- Add missing fields to alarm_activations for unified workflow
ALTER TABLE alarm_activations
ADD COLUMN IF NOT EXISTS alarm_source text,
ADD COLUMN IF NOT EXISTS sla_target_minutes integer,
ADD COLUMN IF NOT EXISTS sla_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS outcome text,
ADD COLUMN IF NOT EXISTS outcome_notes text,
ADD COLUMN IF NOT EXISTS gps_lat numeric,
ADD COLUMN IF NOT EXISTS gps_lng numeric;

-- Update status check constraint to include new statuses
ALTER TABLE alarm_activations DROP CONSTRAINT IF EXISTS alarm_activations_status_check;
ALTER TABLE alarm_activations ADD CONSTRAINT alarm_activations_status_check 
CHECK (status IN ('active', 'acknowledged', 'dispatched', 'arrived', 'resolved', 'false_alarm'));

-- Add crew assignment to vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS call_sign text,
ADD COLUMN IF NOT EXISTS assigned_crew_ids jsonb DEFAULT '[]'::jsonb;

-- Create dispatch_logs table
CREATE TABLE IF NOT EXISTS dispatch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id text NOT NULL UNIQUE,
  alarm_event_id uuid REFERENCES alarm_activations(id),
  unit_id uuid REFERENCES vehicles(id),
  dispatched_by uuid REFERENCES profiles(id),
  dispatched_at timestamp with time zone,
  accepted_at timestamp with time zone,
  en_route_at timestamp with time zone,
  on_scene_at timestamp with time zone,
  closed_at timestamp with time zone,
  closure_code text,
  closure_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create crew_members table
CREATE TABLE IF NOT EXISTS crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id text NOT NULL UNIQUE,
  staff_id uuid REFERENCES staff(id),
  name text NOT NULL,
  role text NOT NULL,
  mobile_number text,
  unit_id uuid REFERENCES vehicles(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE dispatch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view dispatch logs"
ON dispatch_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Control room can manage dispatch logs"
ON dispatch_logs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'control_room_officer'::app_role) OR is_elevated_user(auth.uid()));

CREATE POLICY "All authenticated users can view crew members"
ON crew_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Elevated users can manage crew members"
ON crew_members FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE dispatch_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE crew_members;