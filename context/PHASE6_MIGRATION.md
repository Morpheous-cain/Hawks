# Phase 6 Migration — Apply via Lovable Cloud UI

This SQL must be applied to enable: Evidence Vault hardening, Training Drill Simulator, and White-label client portal.
The Co-Pilot live-data tools, patrol anomaly detection, and i18n already work without it.

## How to apply

1. Open **Lovable Cloud → Database → SQL Editor** (via the Connectors panel).
2. Paste the SQL block below.
3. Run it.
4. The bucket `evidence-vault` is already created — the rest of the migration is idempotent.

```sql
-- 1. Add SHA-256 hash + storage path to body_cam_clips
ALTER TABLE public.body_cam_clips
  ADD COLUMN IF NOT EXISTS sha256_hash text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint;

CREATE INDEX IF NOT EXISTS idx_body_cam_clips_hash ON public.body_cam_clips(sha256_hash);

-- 2. Storage RLS for evidence-vault
DROP POLICY IF EXISTS "evidence_vault_authorized_read" ON storage.objects;
CREATE POLICY "evidence_vault_authorized_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence-vault' AND
    (public.is_elevated_user(auth.uid()) OR public.has_role(auth.uid(), 'control_room_officer'::app_role))
  );

DROP POLICY IF EXISTS "evidence_vault_authorized_write" ON storage.objects;
CREATE POLICY "evidence_vault_authorized_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidence-vault' AND
    (public.is_elevated_user(auth.uid()) OR public.has_role(auth.uid(), 'control_room_officer'::app_role))
  );

-- 3. Evidence access log
CREATE TABLE IF NOT EXISTS public.evidence_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid REFERENCES public.body_cam_clips(id) ON DELETE CASCADE,
  accessed_by uuid REFERENCES public.profiles(id),
  access_type text NOT NULL DEFAULT 'view',
  ip_address text,
  user_agent text,
  signed_url_expires_at timestamptz,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_access_log_clip ON public.evidence_access_log(clip_id);
CREATE INDEX IF NOT EXISTS idx_evidence_access_log_user ON public.evidence_access_log(accessed_by);
ALTER TABLE public.evidence_access_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evidence_log_elevated_read" ON public.evidence_access_log;
CREATE POLICY "evidence_log_elevated_read" ON public.evidence_access_log
  FOR SELECT TO authenticated
  USING (public.is_elevated_user(auth.uid()) OR public.has_role(auth.uid(), 'control_room_officer'::app_role));
DROP POLICY IF EXISTS "evidence_log_authenticated_insert" ON public.evidence_access_log;
CREATE POLICY "evidence_log_authenticated_insert" ON public.evidence_access_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = accessed_by);

-- 4. Training drills + runs
CREATE TABLE IF NOT EXISTS public.training_drills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_code text NOT NULL UNIQUE,
  scenario_type text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  briefing text NOT NULL,
  expected_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  sla_seconds integer NOT NULL DEFAULT 180,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.drill_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id uuid REFERENCES public.training_drills(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES public.profiles(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  actions_taken jsonb DEFAULT '[]'::jsonb,
  score integer,
  grade text,
  feedback text,
  passed boolean
);
CREATE INDEX IF NOT EXISTS idx_drill_runs_operator ON public.drill_runs(operator_id);
CREATE INDEX IF NOT EXISTS idx_drill_runs_started ON public.drill_runs(started_at DESC);
ALTER TABLE public.training_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drills_authenticated_read" ON public.training_drills;
CREATE POLICY "drills_authenticated_read" ON public.training_drills FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "drills_elevated_manage" ON public.training_drills;
CREATE POLICY "drills_elevated_manage" ON public.training_drills FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()));
DROP POLICY IF EXISTS "drill_runs_own_or_elevated" ON public.drill_runs;
CREATE POLICY "drill_runs_own_or_elevated" ON public.drill_runs FOR SELECT TO authenticated
  USING (operator_id = auth.uid() OR public.is_elevated_user(auth.uid()));
DROP POLICY IF EXISTS "drill_runs_self_insert" ON public.drill_runs;
CREATE POLICY "drill_runs_self_insert" ON public.drill_runs FOR INSERT TO authenticated WITH CHECK (operator_id = auth.uid());
DROP POLICY IF EXISTS "drill_runs_self_update" ON public.drill_runs;
CREATE POLICY "drill_runs_self_update" ON public.drill_runs FOR UPDATE TO authenticated
  USING (operator_id = auth.uid() OR public.is_elevated_user(auth.uid()));

INSERT INTO public.training_drills (drill_code, scenario_type, difficulty, title, briefing, expected_actions, sla_seconds) VALUES
  ('DRL-PB-001', 'perimeter_breach', 'medium', 'Perimeter Breach — Karen Residence',
   'Glass-break sensor triggered at zone 3 perimeter. CCTV shows 2 figures scaling fence. Officer on-site is 90s away. Client family asleep inside.',
   '["Acknowledge alarm","Verify via CCTV","Dispatch nearest MRT","Notify client primary contact","Open DOB entry","Escalate to police if armed"]'::jsonb, 180),
  ('DRL-PA-001', 'panic', 'hard', 'Panic Button — Office Block, Westlands',
   'Reception panic button activated. No response on intercom. Two-way radio silent. Last patrol 22 min ago.',
   '["Acknowledge","Attempt voice contact","Dispatch QRF","Notify supervisor","Police pre-alert","Lock perimeter via access control"]'::jsonb, 120),
  ('DRL-AR-001', 'armed_robbery', 'extreme', 'Armed Robbery in Progress — Cash Centre',
   'Silent alarm + body-cam audio confirms armed individuals on premises. Officer down possible. 3 staff inside.',
   '["Acknowledge silent","Police priority dispatch","No siren approach","Body-cam stream open","Lock all access","Brief MRT en route","Notify CEO/COO"]'::jsonb, 90),
  ('DRL-MED-001', 'medical', 'easy', 'Officer Medical Emergency — Industrial Area',
   'Officer reports chest pain via radio. Alone on post.',
   '["Acknowledge","Confirm location","Dispatch ambulance + replacement officer","Notify supervisor","Open OB entry","Notify next of kin"]'::jsonb, 240)
ON CONFLICT (drill_code) DO NOTHING;

-- 5. White-label per-client branding
CREATE TABLE IF NOT EXISTS public.client_branding (
  client_id uuid PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  display_name text,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  accent_color text DEFAULT '#8B5CF6',
  subdomain text UNIQUE,
  contact_phone text,
  emergency_phone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_branding_subdomain ON public.client_branding(subdomain);
ALTER TABLE public.client_branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branding_authenticated_read" ON public.client_branding;
CREATE POLICY "branding_authenticated_read" ON public.client_branding FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "branding_elevated_manage" ON public.client_branding;
CREATE POLICY "branding_elevated_manage" ON public.client_branding FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()));
DROP TRIGGER IF EXISTS trg_client_branding_updated ON public.client_branding;
CREATE TRIGGER trg_client_branding_updated BEFORE UPDATE ON public.client_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## After applying

- `/training-drills` route shows the drill catalogue and scoring.
- `/bodycam` evidence panels can use `evidence-sign-url` edge function for hardened access.
- Client Portal sidebar/header reads `client_branding` for per-client logo + colours.
