-- =========================================
-- HQ Connect: Guard ↔ Control Room comms
-- =========================================

-- 1. Live chat thread between guards and HQ
CREATE TABLE IF NOT EXISTS public.hq_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thread_key TEXT NOT NULL,
  body TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','voice','ptt','system','call_log')),
  audio_url TEXT,
  duration_seconds INTEGER,
  site_id UUID,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  is_from_hq BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hq_messages_thread ON public.hq_messages(thread_key, created_at DESC);

ALTER TABLE public.hq_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own thread" ON public.hq_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR thread_key = 'guard:' || auth.uid()::text
    OR is_elevated_user(auth.uid())
    OR has_role(auth.uid(), 'control_room_officer')
  );

CREATE POLICY "Users send messages" ON public.hq_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients mark read" ON public.hq_messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'));

-- 2. Guard status beacons
CREATE TABLE IF NOT EXISTS public.guard_status_beacons (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','patrolling','on_break','investigating','backup_needed','off_duty','responding')),
  status_message TEXT,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  site_id UUID,
  battery_level INTEGER,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.guard_status_beacons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated views beacons" ON public.guard_status_beacons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Guards manage own beacon" ON public.guard_status_beacons
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_elevated_user(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR is_elevated_user(auth.uid()));

-- 3. HQ Broadcasts
CREATE TABLE IF NOT EXISTS public.hq_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  audience TEXT NOT NULL DEFAULT 'all_guards',
  requires_ack BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hq_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read broadcasts" ON public.hq_broadcasts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Elevated issue broadcasts" ON public.hq_broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'));
CREATE POLICY "Elevated edit broadcasts" ON public.hq_broadcasts
  FOR UPDATE TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'));

-- 4. Broadcast acks
CREATE TABLE IF NOT EXISTS public.hq_broadcast_acks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.hq_broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  UNIQUE (broadcast_id, user_id)
);
ALTER TABLE public.hq_broadcast_acks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read acks" ON public.hq_broadcast_acks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users ack themselves" ON public.hq_broadcast_acks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 5. HQ Directives
CREATE TABLE IF NOT EXISTS public.hq_directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directive_number TEXT,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','acknowledged','executing','completed','escalated','cancelled')),
  acknowledged_at TIMESTAMPTZ,
  executing_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  ack_gps_lat NUMERIC,
  ack_gps_lng NUMERIC,
  completion_gps_lat NUMERIC,
  completion_gps_lng NUMERIC,
  completion_notes TEXT,
  escalated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hq_directives_assigned ON public.hq_directives(assigned_to, status);
ALTER TABLE public.hq_directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignee or HQ reads directives" ON public.hq_directives
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR issued_by = auth.uid()
    OR is_elevated_user(auth.uid())
    OR has_role(auth.uid(), 'control_room_officer')
  );
CREATE POLICY "HQ issues directives" ON public.hq_directives
  FOR INSERT TO authenticated
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'));
CREATE POLICY "Assignee or HQ updates directives" ON public.hq_directives
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR is_elevated_user(auth.uid())
    OR has_role(auth.uid(), 'control_room_officer')
  );

-- 6. Backup requests
CREATE TABLE IF NOT EXISTS public.hq_backup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  threat_level TEXT NOT NULL DEFAULT 'medium' CHECK (threat_level IN ('low','medium','high','critical')),
  units_requested INTEGER DEFAULT 1,
  site_id UUID,
  location TEXT,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','dispatched','arrived','resolved','cancelled')),
  dispatched_unit TEXT,
  dispatched_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hq_backup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requester or HQ reads backup" ON public.hq_backup_requests
  FOR SELECT TO authenticated
  USING (
    requested_by = auth.uid()
    OR is_elevated_user(auth.uid())
    OR has_role(auth.uid(), 'control_room_officer')
  );
CREATE POLICY "Guards request backup" ON public.hq_backup_requests
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "HQ updates backup" ON public.hq_backup_requests
  FOR UPDATE TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer') OR requested_by = auth.uid());

-- Auto-numbering
CREATE SEQUENCE IF NOT EXISTS hq_backup_seq START 1;
CREATE OR REPLACE FUNCTION public.set_hq_backup_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := 'BKP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('hq_backup_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_hq_backup_number ON public.hq_backup_requests;
CREATE TRIGGER trg_hq_backup_number BEFORE INSERT ON public.hq_backup_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_hq_backup_number();

CREATE SEQUENCE IF NOT EXISTS hq_directive_seq START 1;
CREATE OR REPLACE FUNCTION public.set_hq_directive_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.directive_number IS NULL THEN
    NEW.directive_number := 'DIR-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('hq_directive_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_hq_directive_number ON public.hq_directives;
CREATE TRIGGER trg_hq_directive_number BEFORE INSERT ON public.hq_directives
  FOR EACH ROW EXECUTE FUNCTION public.set_hq_directive_number();

-- Realtime
ALTER TABLE public.hq_messages REPLICA IDENTITY FULL;
ALTER TABLE public.guard_status_beacons REPLICA IDENTITY FULL;
ALTER TABLE public.hq_broadcasts REPLICA IDENTITY FULL;
ALTER TABLE public.hq_broadcast_acks REPLICA IDENTITY FULL;
ALTER TABLE public.hq_directives REPLICA IDENTITY FULL;
ALTER TABLE public.hq_backup_requests REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guard_status_beacons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_broadcast_acks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_directives;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_backup_requests;
