-- Field Portal Phase 2: tactical operations tables
-- Pattern: authenticated can read & insert; elevated users can manage all.

CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.client_sites(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_id_number text,
  visitor_phone text,
  company text,
  host_name text,
  purpose text,
  vehicle_plate text,
  badge_number text,
  photo_url text,
  signature_url text,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  gps_lat numeric, gps_lng numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visitor_logs_view" ON public.visitor_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "visitor_logs_insert" ON public.visitor_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "visitor_logs_update" ON public.visitor_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "visitor_logs_admin" ON public.visitor_logs FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  vehicle_plate text NOT NULL,
  vehicle_type text,
  inspection_type text DEFAULT 'pre_shift',
  odometer integer,
  fuel_level text,
  exterior_ok boolean DEFAULT true,
  interior_ok boolean DEFAULT true,
  tires_ok boolean DEFAULT true,
  lights_ok boolean DEFAULT true,
  brakes_ok boolean DEFAULT true,
  fluids_ok boolean DEFAULT true,
  safety_kit_ok boolean DEFAULT true,
  defects text,
  photo_urls jsonb DEFAULT '[]'::jsonb,
  signature_url text,
  inspected_at timestamptz NOT NULL DEFAULT now(),
  gps_lat numeric, gps_lng numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "veh_insp_view" ON public.vehicle_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "veh_insp_insert" ON public.vehicle_inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "veh_insp_admin" ON public.vehicle_inspections FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.key_custody_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.client_sites(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  asset_type text NOT NULL DEFAULT 'key',
  asset_label text NOT NULL,
  asset_serial text,
  issued_to text NOT NULL,
  issued_to_id text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  condition_out text,
  condition_in text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.key_custody_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "key_view" ON public.key_custody_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "key_insert" ON public.key_custody_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "key_update" ON public.key_custody_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "key_admin" ON public.key_custody_logs FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.parcel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.client_sites(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  tracking_number text,
  courier text,
  sender text,
  recipient text NOT NULL,
  parcel_type text DEFAULT 'package',
  description text,
  received_at timestamptz NOT NULL DEFAULT now(),
  collected_at timestamptz,
  collected_by text,
  collected_signature_url text,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parcel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parcel_view" ON public.parcel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "parcel_insert" ON public.parcel_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parcel_update" ON public.parcel_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "parcel_admin" ON public.parcel_logs FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.welfare_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ok',
  interval_minutes integer NOT NULL DEFAULT 30,
  next_due_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  last_check_at timestamptz NOT NULL DEFAULT now(),
  missed_count integer NOT NULL DEFAULT 0,
  gps_lat numeric, gps_lng numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.welfare_heartbeats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "welfare_view" ON public.welfare_heartbeats FOR SELECT TO authenticated USING (true);
CREATE POLICY "welfare_insert" ON public.welfare_heartbeats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "welfare_update" ON public.welfare_heartbeats FOR UPDATE TO authenticated USING (true);
CREATE POLICY "welfare_admin" ON public.welfare_heartbeats FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.drill_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  drill_code text NOT NULL,
  drill_title text NOT NULL,
  drill_category text,
  score integer,
  passed boolean DEFAULT false,
  duration_seconds integer,
  responses jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.drill_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drills_view" ON public.drill_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "drills_insert" ON public.drill_completions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "drills_admin" ON public.drill_completions FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.site_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.client_sites(id) ON DELETE SET NULL,
  auditor_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  audit_type text DEFAULT 'routine',
  score integer,
  grade text,
  findings jsonb DEFAULT '[]'::jsonb,
  corrective_actions text,
  photo_urls jsonb DEFAULT '[]'::jsonb,
  conducted_at timestamptz NOT NULL DEFAULT now(),
  follow_up_due timestamptz,
  closed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_view" ON public.site_audits FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_insert" ON public.site_audits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_update" ON public.site_audits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "audit_admin" ON public.site_audits FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.key_custody_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parcel_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.welfare_heartbeats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drill_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_audits;

CREATE TRIGGER trg_visitor_logs_upd BEFORE UPDATE ON public.visitor_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_welfare_upd BEFORE UPDATE ON public.welfare_heartbeats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_site_audits_upd BEFORE UPDATE ON public.site_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
