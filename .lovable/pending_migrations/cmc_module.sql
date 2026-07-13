-- Crisis Management Centre (CMC) module tables
-- Provides: activation lifecycle, decision/audit log, executive notifications, resource roll-call

-- =================== 1. CMC Activations ===================
CREATE TABLE IF NOT EXISTS public.cmc_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_number text UNIQUE,
  tier text NOT NULL DEFAULT 'tier_1' CHECK (tier IN ('tier_1','tier_2','tier_3')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','stood_down')),
  trigger_type text NOT NULL DEFAULT 'manual',     -- manual | incident | sop | drill
  trigger_reference uuid,                          -- optional incident id
  reason text NOT NULL,
  gold_commander uuid REFERENCES auth.users(id),
  silver_commander uuid REFERENCES auth.users(id),
  bronze_commander uuid REFERENCES auth.users(id),
  activated_by uuid REFERENCES auth.users(id),
  activated_at timestamptz NOT NULL DEFAULT now(),
  stood_down_by uuid REFERENCES auth.users(id),
  stood_down_at timestamptz,
  stand_down_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS cmc_activation_seq;

CREATE OR REPLACE FUNCTION public.set_cmc_activation_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.activation_number IS NULL OR NEW.activation_number = '' THEN
    NEW.activation_number := 'CMC-' || TO_CHAR(CURRENT_DATE,'YYYYMMDD')
      || '-' || LPAD(nextval('cmc_activation_seq')::text,3,'0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_cmc_activation_number ON public.cmc_activations;
CREATE TRIGGER trg_set_cmc_activation_number
  BEFORE INSERT ON public.cmc_activations
  FOR EACH ROW EXECUTE FUNCTION public.set_cmc_activation_number();

CREATE INDEX IF NOT EXISTS idx_cmc_activations_status ON public.cmc_activations(status, activated_at DESC);

ALTER TABLE public.cmc_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_cmc_act" ON public.cmc_activations;
CREATE POLICY "auth_read_cmc_act" ON public.cmc_activations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "elev_insert_cmc_act" ON public.cmc_activations;
CREATE POLICY "elev_insert_cmc_act" ON public.cmc_activations FOR INSERT TO authenticated
  WITH CHECK (public.is_elevated_user(auth.uid()));

DROP POLICY IF EXISTS "elev_update_cmc_act" ON public.cmc_activations;
CREATE POLICY "elev_update_cmc_act" ON public.cmc_activations FOR UPDATE TO authenticated
  USING (public.is_elevated_user(auth.uid()));

-- =================== 2. CMC Decision Log ===================
CREATE TABLE IF NOT EXISTS public.cmc_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id uuid REFERENCES public.cmc_activations(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'tactical' CHECK (category IN ('strategic','tactical','operational','external','welfare','statutory')),
  decision text NOT NULL,
  rationale text,
  made_by uuid REFERENCES auth.users(id),
  made_by_role text,                       -- gold | silver | bronze | operator
  made_at timestamptz NOT NULL DEFAULT now(),
  signed_off_by uuid REFERENCES auth.users(id),
  signed_off_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cmc_decisions_activation ON public.cmc_decisions(activation_id, made_at DESC);

ALTER TABLE public.cmc_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_cmc_dec" ON public.cmc_decisions;
CREATE POLICY "auth_read_cmc_dec" ON public.cmc_decisions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_cmc_dec" ON public.cmc_decisions;
CREATE POLICY "auth_insert_cmc_dec" ON public.cmc_decisions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "elev_update_cmc_dec" ON public.cmc_decisions;
CREATE POLICY "elev_update_cmc_dec" ON public.cmc_decisions FOR UPDATE TO authenticated
  USING (public.is_elevated_user(auth.uid()));

-- =================== 3. CMC Notifications ===================
CREATE TABLE IF NOT EXISTS public.cmc_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id uuid REFERENCES public.cmc_activations(id) ON DELETE CASCADE,
  role_name text NOT NULL,                 -- COO, CEO, Client AM, Insurance, Regulator...
  recipient_name text,
  channel text NOT NULL DEFAULT 'call' CHECK (channel IN ('call','sms','email','radio','app')),
  sla_minutes integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','acknowledged','failed')),
  sent_at timestamptz,
  acknowledged_at timestamptz,
  sent_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cmc_notif_activation ON public.cmc_notifications(activation_id, created_at DESC);

ALTER TABLE public.cmc_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_cmc_notif" ON public.cmc_notifications;
CREATE POLICY "auth_read_cmc_notif" ON public.cmc_notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_cmc_notif" ON public.cmc_notifications;
CREATE POLICY "auth_insert_cmc_notif" ON public.cmc_notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_update_cmc_notif" ON public.cmc_notifications;
CREATE POLICY "auth_update_cmc_notif" ON public.cmc_notifications FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- =================== 4. Resource Roll-Call ===================
CREATE TABLE IF NOT EXISTS public.cmc_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id uuid REFERENCES public.cmc_activations(id) ON DELETE CASCADE,
  resource_type text NOT NULL,             -- qrf_vehicle | armed_officer | k9 | medical | fire
  identifier text NOT NULL,                -- e.g. UNIT-ALPHA-1
  status text NOT NULL DEFAULT 'standby' CHECK (status IN ('standby','engaged','enroute','onscene','offline')),
  assigned_to text,                        -- task description
  location text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cmc_resources_activation ON public.cmc_resources(activation_id, status);

ALTER TABLE public.cmc_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_cmc_res" ON public.cmc_resources;
CREATE POLICY "auth_read_cmc_res" ON public.cmc_resources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_write_cmc_res" ON public.cmc_resources;
CREATE POLICY "auth_write_cmc_res" ON public.cmc_resources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_update_cmc_res" ON public.cmc_resources;
CREATE POLICY "auth_update_cmc_res" ON public.cmc_resources FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- =================== 5. Realtime ===================
ALTER PUBLICATION supabase_realtime ADD TABLE public.cmc_activations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cmc_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cmc_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cmc_resources;
