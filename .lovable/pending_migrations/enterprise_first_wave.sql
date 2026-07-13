-- ============================================================
-- Black Hawk SOC-OS — Enterprise First Wave
-- Assignments & SLA, Patrol Intelligence, Incident Command
-- ============================================================

-- ---------- 1. DEPLOYMENT POSTS (Assignment Mgmt upgrade) ----------
CREATE TABLE IF NOT EXISTS public.deployment_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  post_name text NOT NULL,
  post_code text,
  shift_type text NOT NULL DEFAULT 'day' CHECK (shift_type IN ('day','night','24h','custom')),
  shift_start time NOT NULL DEFAULT '06:00',
  shift_end   time NOT NULL DEFAULT '18:00',
  required_rank text DEFAULT 'guard',
  required_count int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deployment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.deployment_posts(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  assignment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','reported','on_post','relief_pending','relieved','no_show','absent','completed')),
  reported_at timestamptz,
  on_post_at timestamptz,
  off_post_at timestamptz,
  relief_for_id uuid REFERENCES public.deployment_assignments(id) ON DELETE SET NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, staff_id, assignment_date)
);
CREATE INDEX IF NOT EXISTS idx_dep_assn_date ON public.deployment_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_dep_assn_status ON public.deployment_assignments(status);

-- ---------- 2. SLA EVENTS (cross-module) ----------
CREATE TABLE IF NOT EXISTS public.sla_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL,        -- 'incidents' | 'alarm_activations' | 'deployment_assignments' | 'sos_alerts'
  source_id uuid NOT NULL,
  category text NOT NULL,            -- 'response' | 'arrival' | 'reporting' | 'resolution'
  severity text DEFAULT 'medium',
  target_minutes int NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  deadline_at timestamptz NOT NULL,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  breached boolean NOT NULL DEFAULT false,
  breach_minutes int,
  assigned_team text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sla_open ON public.sla_events(breached, resolved_at);
CREATE INDEX IF NOT EXISTS idx_sla_source ON public.sla_events(source_table, source_id);

CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.deadline_at IS NULL THEN
    NEW.deadline_at := NEW.started_at + (NEW.target_minutes || ' minutes')::interval;
  END IF;
  IF NEW.resolved_at IS NOT NULL AND NEW.resolved_at > NEW.deadline_at AND NEW.breached = false THEN
    NEW.breached := true;
    NEW.breach_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.deadline_at))/60;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sla_deadline ON public.sla_events;
CREATE TRIGGER trg_sla_deadline BEFORE INSERT OR UPDATE ON public.sla_events
  FOR EACH ROW EXECUTE FUNCTION public.set_sla_deadline();

-- ---------- 3. PATROL INTELLIGENCE ----------
CREATE TABLE IF NOT EXISTS public.patrol_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_id uuid REFERENCES public.patrols(id) ON DELETE CASCADE,
  guard_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  scored_at timestamptz NOT NULL DEFAULT now(),
  checkpoints_expected int NOT NULL DEFAULT 0,
  checkpoints_hit int NOT NULL DEFAULT 0,
  on_time_pct numeric(5,2) NOT NULL DEFAULT 0,
  deviation_count int NOT NULL DEFAULT 0,
  integrity_score numeric(5,2) NOT NULL DEFAULT 0, -- 0-100
  grade text NOT NULL DEFAULT 'F' CHECK (grade IN ('A','B','C','D','E','F')),
  notes text
);
CREATE INDEX IF NOT EXISTS idx_pscore_guard ON public.patrol_scores(guard_id);
CREATE INDEX IF NOT EXISTS idx_pscore_patrol ON public.patrol_scores(patrol_id);

CREATE TABLE IF NOT EXISTS public.patrol_deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_id uuid REFERENCES public.patrols(id) ON DELETE CASCADE,
  guard_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  deviation_type text NOT NULL CHECK (deviation_type IN ('missed_checkpoint','off_route','late','idle','geofence_exit','spoof_suspect')),
  detected_at timestamptz NOT NULL DEFAULT now(),
  location_lat numeric,
  location_lng numeric,
  detail jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_pdev_open ON public.patrol_deviations(resolved, severity);

-- ---------- 4. INCIDENT COMMAND ----------
CREATE TABLE IF NOT EXISTS public.incident_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  event_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL, -- 'created'|'assigned'|'note'|'evidence'|'status_change'|'escalated'|'resolved'
  actor_id uuid,
  actor_name text,
  payload jsonb DEFAULT '{}'::jsonb,
  note text
);
CREATE INDEX IF NOT EXISTS idx_itimeline_incident ON public.incident_timeline(incident_id, event_at DESC);

CREATE TABLE IF NOT EXISTS public.incident_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 1, -- 1 supervisor, 2 ops mgr, 3 COO, 4 CEO
  escalated_to_role text NOT NULL,
  escalated_to_user uuid,
  reason text,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_iesc_incident ON public.incident_escalations(incident_id);

-- Severity scoring helper
CREATE OR REPLACE FUNCTION public.score_incident_severity(_type text, _payload jsonb)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _type IN ('armed_robbery','active_shooter','fire','medical_emergency','fatality') THEN 'critical'
    WHEN _type IN ('break_in','assault','theft_in_progress','panic','arson') THEN 'high'
    WHEN _type IN ('trespass','vandalism','dispute','suspicious_activity') THEN 'medium'
    ELSE 'low'
  END
$$;

-- Auto-timeline insert when an incident is created/updated
CREATE OR REPLACE FUNCTION public.log_incident_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.incident_timeline(incident_id, event_type, actor_id, payload, note)
    VALUES (NEW.id, 'created', NEW.reported_by,
      jsonb_build_object('severity', NEW.severity, 'type', NEW.incident_type),
      'Incident reported');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.incident_timeline(incident_id, event_type, payload, note)
      VALUES (NEW.id, 'status_change', jsonb_build_object('from', OLD.status, 'to', NEW.status), 'Status changed');
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.incident_timeline(incident_id, event_type, payload, note)
      VALUES (NEW.id, 'assigned', jsonb_build_object('to', NEW.assigned_to), 'Assignment updated');
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_incident_change ON public.incidents;
CREATE TRIGGER trg_incident_change AFTER INSERT OR UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.log_incident_change();

-- ---------- 5. RLS ----------
ALTER TABLE public.deployment_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_escalations ENABLE ROW LEVEL SECURITY;

-- Read for any authenticated user (operational visibility)
DO $$ BEGIN
  PERFORM 1;
  EXECUTE 'CREATE POLICY "auth_read" ON public.deployment_posts FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY "auth_read" ON public.deployment_assignments FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY "auth_read" ON public.sla_events FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY "auth_read" ON public.patrol_scores FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY "auth_read" ON public.patrol_deviations FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY "auth_read" ON public.incident_timeline FOR SELECT TO authenticated USING (true)';
  EXECUTE 'CREATE POLICY "auth_read" ON public.incident_escalations FOR SELECT TO authenticated USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Writes restricted to elevated users
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "elev_write" ON public.deployment_posts FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()))';
  EXECUTE 'CREATE POLICY "elev_write" ON public.deployment_assignments FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()))';
  EXECUTE 'CREATE POLICY "elev_write" ON public.sla_events FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()))';
  EXECUTE 'CREATE POLICY "elev_write" ON public.patrol_scores FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()))';
  EXECUTE 'CREATE POLICY "elev_write" ON public.patrol_deviations FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()))';
  EXECUTE 'CREATE POLICY "elev_write" ON public.incident_timeline FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()))';
  EXECUTE 'CREATE POLICY "elev_write" ON public.incident_escalations FOR ALL TO authenticated USING (public.is_elevated_user(auth.uid())) WITH CHECK (public.is_elevated_user(auth.uid()))';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 6. updated_at triggers ----------
DROP TRIGGER IF EXISTS trg_dep_posts_uat ON public.deployment_posts;
CREATE TRIGGER trg_dep_posts_uat BEFORE UPDATE ON public.deployment_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_dep_assn_uat ON public.deployment_assignments;
CREATE TRIGGER trg_dep_assn_uat BEFORE UPDATE ON public.deployment_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 7. Realtime ----------
ALTER TABLE public.deployment_posts REPLICA IDENTITY FULL;
ALTER TABLE public.deployment_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.sla_events REPLICA IDENTITY FULL;
ALTER TABLE public.patrol_scores REPLICA IDENTITY FULL;
ALTER TABLE public.patrol_deviations REPLICA IDENTITY FULL;
ALTER TABLE public.incident_timeline REPLICA IDENTITY FULL;
ALTER TABLE public.incident_escalations REPLICA IDENTITY FULL;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_posts';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_assignments';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sla_events';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.patrol_scores';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.patrol_deviations';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_timeline';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_escalations';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
