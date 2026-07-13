-- Incident Command Centre v2: SOP auto-injection, evidence chain, AI brief storage

-- ============ 1. Evidence chain table ============
CREATE TABLE IF NOT EXISTS public.incident_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  evidence_type text NOT NULL DEFAULT 'file', -- file | photo | video | audio | note | link
  title text NOT NULL,
  description text,
  storage_bucket text DEFAULT 'evidence-vault',
  storage_path text,
  mime_type text,
  file_size bigint,
  sha256 text,
  external_url text,
  collected_by uuid REFERENCES auth.users(id),
  collected_at timestamptz NOT NULL DEFAULT now(),
  chain_of_custody jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_evidence_incident ON public.incident_evidence(incident_id, collected_at DESC);

ALTER TABLE public.incident_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_evidence" ON public.incident_evidence;
CREATE POLICY "auth_read_evidence" ON public.incident_evidence
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_evidence" ON public.incident_evidence;
CREATE POLICY "auth_insert_evidence" ON public.incident_evidence
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "elev_update_evidence" ON public.incident_evidence;
CREATE POLICY "elev_update_evidence" ON public.incident_evidence
  FOR UPDATE TO authenticated USING (public.is_elevated_user(auth.uid()));

DROP POLICY IF EXISTS "elev_delete_evidence" ON public.incident_evidence;
CREATE POLICY "elev_delete_evidence" ON public.incident_evidence
  FOR DELETE TO authenticated USING (public.is_elevated_user(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_evidence;

-- ============ 2. AI brief storage on incident ============
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz;

-- ============ 3. SOP auto-injection trigger ============
CREATE OR REPLACE FUNCTION public.apply_sop_to_incident()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sop public.sop_configurations%ROWTYPE;
  v_steps jsonb;
BEGIN
  -- Look up active SOP by incident_type
  SELECT * INTO v_sop FROM public.sop_configurations
   WHERE incident_type = NEW.incident_type AND active = true
   LIMIT 1;

  IF FOUND THEN
    IF NEW.sop_type IS NULL THEN
      NEW.sop_type := v_sop.incident_type;
    END IF;

    IF NEW.sla_target_minutes IS NULL THEN
      NEW.sla_target_minutes := v_sop.response_time_target_minutes;
    END IF;

    IF NEW.sla_deadline IS NULL AND NEW.sla_target_minutes IS NOT NULL THEN
      NEW.sla_deadline := COALESCE(NEW.occurred_at, now())
        + make_interval(mins => NEW.sla_target_minutes);
    END IF;

    -- Materialise the steps with completion state if not already populated
    IF NEW.steps_completed IS NULL OR NEW.steps_completed = '[]'::jsonb THEN
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'order', (s->>'order')::int,
          'action', s->>'action',
          'completed', false,
          'completed_at', NULL,
          'completed_by', NULL
        ) ORDER BY (s->>'order')::int
      ), '[]'::jsonb) INTO v_steps
      FROM jsonb_array_elements(v_sop.steps) s;
      NEW.steps_completed := v_steps;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_sop_to_incident ON public.incidents;
CREATE TRIGGER trg_apply_sop_to_incident
  BEFORE INSERT ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.apply_sop_to_incident();

-- ============ 4. SLA breach detection on update ============
CREATE OR REPLACE FUNCTION public.check_incident_sla_breach()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sla_deadline IS NOT NULL
     AND NEW.status NOT IN ('resolved','closed')
     AND now() > NEW.sla_deadline
     AND COALESCE(NEW.sla_breached, false) = false THEN
    NEW.sla_breached := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_incident_sla_breach ON public.incidents;
CREATE TRIGGER trg_check_incident_sla_breach
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.check_incident_sla_breach();
