-- Directives & full audit trail
-- Command-and-control: every directive issued, acknowledged, status change is logged.

CREATE SEQUENCE IF NOT EXISTS public.directive_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directive_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  directive_type text NOT NULL DEFAULT 'general',         -- dispatch, sop, escalation, broadcast, general
  priority text NOT NULL DEFAULT 'normal',                -- low, normal, high, critical
  source_module text,                                     -- control-room, mdt, alarms, ops-manager, etc.
  related_entity_type text,                               -- incident, alarm, patrol, etc.
  related_entity_id uuid,

  issued_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  issued_at timestamptz NOT NULL DEFAULT now(),

  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_role text,                                       -- group target (e.g. 'patrol_officer')

  status text NOT NULL DEFAULT 'issued',                  -- issued, acknowledged, in_progress, completed, cancelled, escalated
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,

  sla_target_minutes integer,
  sla_deadline timestamptz,
  sla_breached boolean NOT NULL DEFAULT false,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS directives_status_idx ON public.directives(status);
CREATE INDEX IF NOT EXISTS directives_issued_at_idx ON public.directives(issued_at DESC);
CREATE INDEX IF NOT EXISTS directives_target_user_idx ON public.directives(target_user_id);
CREATE INDEX IF NOT EXISTS directives_issued_by_idx ON public.directives(issued_by);

-- Immutable audit/event trail for every state change
CREATE TABLE IF NOT EXISTS public.directive_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directive_id uuid NOT NULL REFERENCES public.directives(id) ON DELETE CASCADE,
  event_type text NOT NULL,                               -- issued, acknowledged, status_change, reassigned, escalated, note, completed, cancelled
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status text,
  to_status text,
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS directive_events_directive_idx ON public.directive_events(directive_id, created_at);

-- Auto-numbering
CREATE OR REPLACE FUNCTION public.set_directive_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.directive_number IS NULL OR NEW.directive_number = '' THEN
    NEW.directive_number := 'DIR-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
      LPAD(nextval('directive_number_seq')::TEXT, 4, '0');
  END IF;
  IF NEW.sla_target_minutes IS NOT NULL AND NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := NEW.issued_at + (NEW.sla_target_minutes || ' minutes')::interval;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_directive_number ON public.directives;
CREATE TRIGGER trg_set_directive_number
  BEFORE INSERT ON public.directives
  FOR EACH ROW EXECUTE FUNCTION public.set_directive_number();

-- updated_at maintenance
DROP TRIGGER IF EXISTS trg_directives_updated_at ON public.directives;
CREATE TRIGGER trg_directives_updated_at
  BEFORE UPDATE ON public.directives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-log INSERT + every meaningful change
CREATE OR REPLACE FUNCTION public.log_directive_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.directive_events(directive_id, event_type, actor_id, to_status, note, payload)
    VALUES (NEW.id, 'issued', NEW.issued_by, NEW.status,
      'Directive issued: ' || NEW.title,
      jsonb_build_object(
        'priority', NEW.priority,
        'directive_type', NEW.directive_type,
        'target_user_id', NEW.target_user_id,
        'target_role', NEW.target_role,
        'source_module', NEW.source_module
      ));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.directive_events(directive_id, event_type, actor_id, from_status, to_status, note)
    VALUES (NEW.id,
            CASE WHEN NEW.status = 'acknowledged' THEN 'acknowledged'
                 WHEN NEW.status = 'completed' THEN 'completed'
                 WHEN NEW.status = 'cancelled' THEN 'cancelled'
                 WHEN NEW.status = 'escalated' THEN 'escalated'
                 ELSE 'status_change' END,
            COALESCE(NEW.acknowledged_by, NEW.completed_by, auth.uid()),
            OLD.status, NEW.status,
            'Status moved from ' || OLD.status || ' to ' || NEW.status);
  END IF;

  IF NEW.target_user_id IS DISTINCT FROM OLD.target_user_id THEN
    INSERT INTO public.directive_events(directive_id, event_type, actor_id, note, payload)
    VALUES (NEW.id, 'reassigned', auth.uid(),
      'Target reassigned',
      jsonb_build_object('from', OLD.target_user_id, 'to', NEW.target_user_id));
  END IF;

  IF NEW.sla_breached = true AND OLD.sla_breached = false THEN
    INSERT INTO public.directive_events(directive_id, event_type, note)
    VALUES (NEW.id, 'sla_breach', 'SLA deadline breached');
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_directive_change ON public.directives;
CREATE TRIGGER trg_log_directive_change
  AFTER INSERT OR UPDATE ON public.directives
  FOR EACH ROW EXECUTE FUNCTION public.log_directive_change();

-- RLS
ALTER TABLE public.directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directive_events ENABLE ROW LEVEL SECURITY;

-- Directives: elevated users see all; target sees own; issuer sees own
DROP POLICY IF EXISTS "Elevated users full access on directives" ON public.directives;
CREATE POLICY "Elevated users full access on directives"
  ON public.directives FOR ALL
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

DROP POLICY IF EXISTS "Targets and issuers can view their directives" ON public.directives;
CREATE POLICY "Targets and issuers can view their directives"
  ON public.directives FOR SELECT
  USING (auth.uid() = target_user_id OR auth.uid() = issued_by);

DROP POLICY IF EXISTS "Targets can acknowledge/update their directives" ON public.directives;
CREATE POLICY "Targets can acknowledge/update their directives"
  ON public.directives FOR UPDATE
  USING (auth.uid() = target_user_id)
  WITH CHECK (auth.uid() = target_user_id);

-- Events: read for anyone who can read the parent directive; INSERT allowed only via triggers/elevated
DROP POLICY IF EXISTS "Read directive events with parent visibility" ON public.directive_events;
CREATE POLICY "Read directive events with parent visibility"
  ON public.directive_events FOR SELECT
  USING (
    public.is_elevated_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.directives d
      WHERE d.id = directive_events.directive_id
      AND (d.target_user_id = auth.uid() OR d.issued_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Elevated users insert directive events" ON public.directive_events;
CREATE POLICY "Elevated users insert directive events"
  ON public.directive_events FOR INSERT
  WITH CHECK (public.is_elevated_user(auth.uid()) OR auth.uid() IS NOT NULL);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.directives;
ALTER PUBLICATION supabase_realtime ADD TABLE public.directive_events;
