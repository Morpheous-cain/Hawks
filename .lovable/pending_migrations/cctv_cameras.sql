-- ============================================================
-- CCTV CAMERAS & EVENTS (pending application)
-- Replaces all hardcoded camera arrays in the frontend with
-- real database-backed camera records and event logging.
-- Apply via: Lovable Cloud → Migrations, or Supabase SQL editor.
-- ============================================================

-- Camera registry
CREATE TABLE IF NOT EXISTS public.cctv_cameras (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  name         text NOT NULL,
  location     text,
  stream_url   text,
  status       text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'fault')),
  camera_type  text DEFAULT 'fixed' CHECK (camera_type IN ('fixed', 'ptz', 'fisheye', 'thermal')),
  is_active    boolean NOT NULL DEFAULT true,
  installed_at timestamptz DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cctv_cameras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read cctv_cameras"
  ON public.cctv_cameras FOR SELECT TO authenticated USING (true);

CREATE POLICY "Elevated manage cctv_cameras"
  ON public.cctv_cameras FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

CREATE TRIGGER trg_cctv_cameras_updated
  BEFORE UPDATE ON public.cctv_cameras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CCTV operator events (alert triggers, mark-as-event, etc.)
CREATE TABLE IF NOT EXISTS public.cctv_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id    uuid REFERENCES public.cctv_cameras(id) ON DELETE SET NULL,
  site_id      uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  event_type   text NOT NULL CHECK (event_type IN ('alert', 'motion', 'suspicious_activity', 'incident', 'note', 'false_alarm')),
  description  text,
  severity     text DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  operator_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operator_name text,
  snapshot_url text,
  linked_incident_id uuid REFERENCES public.incidents(id) ON DELETE SET NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cctv_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read cctv_events"
  ON public.cctv_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert cctv_events"
  ON public.cctv_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = operator_id OR operator_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_cctv_events_camera_id ON public.cctv_events (camera_id);
CREATE INDEX IF NOT EXISTS idx_cctv_events_occurred_at ON public.cctv_events (occurred_at DESC);
