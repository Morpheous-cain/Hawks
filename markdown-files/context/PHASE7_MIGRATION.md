# Phase 7 Migration — Tier 3 Foundations

Run this in the **Lovable Cloud SQL Editor** to enable:
- Multi-tenant SaaS scaffolding (`tenants`, `tenant_members`)
- Audit log (`audit_log`)
- Online presence (`user_presence`)
- Auto-dispatch rules (`auto_dispatch_rules`)
- Welfare check-ins (`welfare_check_ins`)
- False-alarm tracking (`false_alarm_log`)

```sql
-- ============================================
-- TIER 3 FOUNDATIONS
-- ============================================

-- 1. TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  brand_color text,
  logo_url text,
  subdomain text UNIQUE,
  plan text DEFAULT 'enterprise',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.tenants (slug, name, brand_color)
VALUES ('blackhawk', 'Black Hawk SOC-OS', '#d4af37')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tenants"
  ON public.tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users see their own memberships"
  ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_user_idx ON public.audit_log(user_id, created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated users view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_elevated_user(auth.uid()));
CREATE POLICY "Authenticated users can write audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. PRESENCE
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY,
  status text DEFAULT 'online',
  current_page text,
  last_seen timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users see presence"
  ON public.user_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own presence"
  ON public.user_presence FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. AUTO-DISPATCH RULES
CREATE TABLE IF NOT EXISTS public.auto_dispatch_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_tier text,
  alarm_type text,
  hour_start int DEFAULT 0,
  hour_end int DEFAULT 24,
  action text NOT NULL,
  qrf_unit text,
  notify_role text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.auto_dispatch_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read dispatch rules"
  ON public.auto_dispatch_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Elevated users manage dispatch rules"
  ON public.auto_dispatch_rules FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()));

-- 5. WELFARE CHECK-INS
CREATE TABLE IF NOT EXISTS public.welfare_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id uuid NOT NULL,
  prompted_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  status text DEFAULT 'pending',
  location_lat numeric,
  location_lng numeric,
  notes text
);
CREATE INDEX IF NOT EXISTS welfare_check_officer_idx ON public.welfare_check_ins(officer_id, prompted_at DESC);
ALTER TABLE public.welfare_check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read welfare"
  ON public.welfare_check_ins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Officers respond to own check-ins"
  ON public.welfare_check_ins FOR UPDATE TO authenticated
  USING (officer_id = auth.uid());
CREATE POLICY "System inserts welfare prompts"
  ON public.welfare_check_ins FOR INSERT TO authenticated WITH CHECK (true);

-- 6. FALSE-ALARM TRACKING
CREATE TABLE IF NOT EXISTS public.false_alarm_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  site_name text,
  alarm_id uuid,
  classified_at timestamptz DEFAULT now(),
  classified_by uuid,
  reason text,
  charge_applied boolean DEFAULT false,
  charge_amount numeric
);
ALTER TABLE public.false_alarm_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read false alarms"
  ON public.false_alarm_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operators log false alarms"
  ON public.false_alarm_log FOR INSERT TO authenticated
  WITH CHECK (classified_by = auth.uid());
```

After running this migration, the new modules will activate automatically. No code changes required.
