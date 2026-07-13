-- ============================================================
-- AUTO-DISPATCH RULES (Phase 1 — pending application)
-- Apply via: Lovable Cloud → Migrations, or paste into Cloud SQL editor.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auto_dispatch_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_tier text NOT NULL DEFAULT 'tier-2',
  alarm_type text NOT NULL DEFAULT 'panic',
  hour_start integer NOT NULL DEFAULT 0,
  hour_end integer NOT NULL DEFAULT 24,
  action text NOT NULL DEFAULT 'dispatch_qrf',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_dispatch_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read auto_dispatch_rules"
  ON public.auto_dispatch_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Elevated manage auto_dispatch_rules"
  ON public.auto_dispatch_rules FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

CREATE TRIGGER trg_auto_dispatch_rules_updated
  BEFORE UPDATE ON public.auto_dispatch_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.auto_dispatch_rules (name, client_tier, alarm_type, hour_start, hour_end, action, active)
VALUES
  ('VIP After-Hours Panic', 'tier-1', 'panic', 18, 6, 'all', true),
  ('Standard Intrusion Night', 'tier-2', 'intrusion', 20, 6, 'dispatch_qrf', true),
  ('Fire Alarm — Always On', 'tier-1', 'fire', 0, 24, 'all', true),
  ('Medical Day-Time Notify', 'tier-2', 'medical', 6, 20, 'notify_supervisor', true)
ON CONFLICT DO NOTHING;
