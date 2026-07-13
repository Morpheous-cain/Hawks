-- ============================================================================
-- K9 Management System — operational tables
-- Adds: deployments, health records, training records, incidents
-- Pattern mirrors CMC module (single hook + realtime + RLS).
-- ============================================================================

-- =================== 1. K9 Deployments ===================
CREATE TABLE IF NOT EXISTS public.k9_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_number text UNIQUE,
  k9_unit_id uuid NOT NULL REFERENCES public.k9_units(id) ON DELETE CASCADE,
  handler_id uuid REFERENCES public.staff(id),
  site_name text NOT NULL,
  purpose text NOT NULL,                              -- e.g. Explosives sweep, Crowd control
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('scheduled','active','completed','aborted')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  outcome text,                                       -- summary on completion
  finds_count integer NOT NULL DEFAULT 0,             -- positive alerts / finds
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS k9_deployment_seq;

CREATE OR REPLACE FUNCTION public.set_k9_deployment_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.deployment_number IS NULL OR NEW.deployment_number = '' THEN
    NEW.deployment_number := 'K9D-' || TO_CHAR(CURRENT_DATE,'YYYYMMDD')
      || '-' || LPAD(nextval('k9_deployment_seq')::text,4,'0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_k9_deployment_number ON public.k9_deployments;
CREATE TRIGGER trg_set_k9_deployment_number
  BEFORE INSERT ON public.k9_deployments
  FOR EACH ROW EXECUTE FUNCTION public.set_k9_deployment_number();

-- Auto-compute duration on completion
CREATE OR REPLACE FUNCTION public.compute_k9_deployment_duration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
    -- Bump deployment counter on parent unit
    UPDATE public.k9_units
       SET total_deployments = COALESCE(total_deployments,0) + 1,
           status = 'available'
     WHERE id = NEW.k9_unit_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_compute_k9_deployment_duration ON public.k9_deployments;
CREATE TRIGGER trg_compute_k9_deployment_duration
  BEFORE UPDATE ON public.k9_deployments
  FOR EACH ROW EXECUTE FUNCTION public.compute_k9_deployment_duration();

CREATE INDEX IF NOT EXISTS idx_k9_deploy_unit ON public.k9_deployments(k9_unit_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_k9_deploy_status ON public.k9_deployments(status, started_at DESC);

ALTER TABLE public.k9_deployments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_k9_dep" ON public.k9_deployments;
CREATE POLICY "auth_read_k9_dep" ON public.k9_deployments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_k9_dep" ON public.k9_deployments;
CREATE POLICY "auth_insert_k9_dep" ON public.k9_deployments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_update_k9_dep" ON public.k9_deployments;
CREATE POLICY "auth_update_k9_dep" ON public.k9_deployments FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "elev_delete_k9_dep" ON public.k9_deployments;
CREATE POLICY "elev_delete_k9_dep" ON public.k9_deployments FOR DELETE TO authenticated
  USING (public.is_elevated_user(auth.uid()));

-- =================== 2. K9 Health Records ===================
CREATE TABLE IF NOT EXISTS public.k9_health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  k9_unit_id uuid NOT NULL REFERENCES public.k9_units(id) ON DELETE CASCADE,
  record_type text NOT NULL DEFAULT 'checkup'
    CHECK (record_type IN ('checkup','vaccination','treatment','injury','dental','grooming')),
  vet_name text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  diagnosis text,
  treatment text,
  medications text,
  next_due_at date,
  cost numeric(12,2),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_k9_health_unit ON public.k9_health_records(k9_unit_id, performed_at DESC);

ALTER TABLE public.k9_health_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_k9_hl" ON public.k9_health_records;
CREATE POLICY "auth_read_k9_hl" ON public.k9_health_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_k9_hl" ON public.k9_health_records;
CREATE POLICY "auth_insert_k9_hl" ON public.k9_health_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "auth_update_k9_hl" ON public.k9_health_records;
CREATE POLICY "auth_update_k9_hl" ON public.k9_health_records FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Update parent unit's last_vet_check on insert of checkup
CREATE OR REPLACE FUNCTION public.update_k9_last_vet_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.record_type IN ('checkup','vaccination','treatment') THEN
    UPDATE public.k9_units
       SET last_vet_check = NEW.performed_at::date,
           next_vet_check = COALESCE(NEW.next_due_at, last_vet_check)
     WHERE id = NEW.k9_unit_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_update_k9_last_vet ON public.k9_health_records;
CREATE TRIGGER trg_update_k9_last_vet
  AFTER INSERT ON public.k9_health_records
  FOR EACH ROW EXECUTE FUNCTION public.update_k9_last_vet_check();

-- =================== 3. K9 Training Records ===================
CREATE TABLE IF NOT EXISTS public.k9_training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  k9_unit_id uuid NOT NULL REFERENCES public.k9_units(id) ON DELETE CASCADE,
  session_type text NOT NULL,                          -- obedience | detection | bitework | scenario
  instructor text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer,
  score integer CHECK (score BETWEEN 0 AND 100),       -- 0-100 performance
  pass boolean NOT NULL DEFAULT true,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_k9_train_unit ON public.k9_training_records(k9_unit_id, performed_at DESC);

ALTER TABLE public.k9_training_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_k9_tr" ON public.k9_training_records;
CREATE POLICY "auth_read_k9_tr" ON public.k9_training_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_k9_tr" ON public.k9_training_records;
CREATE POLICY "auth_insert_k9_tr" ON public.k9_training_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- =================== 4. K9 Incidents (linked to deployment) ===================
CREATE TABLE IF NOT EXISTS public.k9_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  k9_unit_id uuid NOT NULL REFERENCES public.k9_units(id) ON DELETE CASCADE,
  deployment_id uuid REFERENCES public.k9_deployments(id) ON DELETE SET NULL,
  incident_type text NOT NULL,                         -- find | bite | injury | refusal | alert
  severity text NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low','medium','high','critical')),
  description text NOT NULL,
  location text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  reported_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_k9_inc_unit ON public.k9_incidents(k9_unit_id, occurred_at DESC);

ALTER TABLE public.k9_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_k9_inc" ON public.k9_incidents;
CREATE POLICY "auth_read_k9_inc" ON public.k9_incidents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_k9_inc" ON public.k9_incidents;
CREATE POLICY "auth_insert_k9_inc" ON public.k9_incidents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- =================== 5. Realtime ===================
ALTER PUBLICATION supabase_realtime ADD TABLE public.k9_deployments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.k9_health_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.k9_training_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.k9_incidents;
