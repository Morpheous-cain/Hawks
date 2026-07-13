-- ============================================================
-- HR / Finance / Payroll / Governance / System tables
-- Apply via: Lovable Cloud → Migrations
-- ============================================================

-- ---------- Helper: updated_at trigger reuse ----------
-- public.update_updated_at_column already exists.

-- ---------- HR ----------
CREATE TABLE IF NOT EXISTS public.hr_equipment_issuance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  item text NOT NULL,
  serial_number text,
  category text DEFAULT 'general',
  issued_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  condition text DEFAULT 'good',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_equipment_issuance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated manage equipment issuance" ON public.hr_equipment_issuance
  FOR ALL TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'hr_custodian'::app_role) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'hr_custodian'::app_role) OR has_role(auth.uid(),'administrator'::app_role));

-- ---------- Finance: Invoices ----------
CREATE TABLE IF NOT EXISTS public.fin_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE,
  client_id uuid REFERENCES public.clients(id),
  period_start date,
  period_end date,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  currency text NOT NULL DEFAULT 'KES',
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft|sent|paid|overdue|cancelled
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated manage invoices" ON public.fin_invoices
  FOR ALL TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role) OR has_role(auth.uid(),'bdo'::app_role))
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role) OR has_role(auth.uid(),'bdo'::app_role));
CREATE TRIGGER trg_fin_invoices_updated BEFORE UPDATE ON public.fin_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS fin_invoice_seq START 1;
CREATE OR REPLACE FUNCTION public.set_fin_invoice_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE,'YYYY') || '-' || LPAD(nextval('fin_invoice_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_fin_invoice_number BEFORE INSERT ON public.fin_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_fin_invoice_number();

CREATE TABLE IF NOT EXISTS public.fin_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.fin_invoices(id) ON DELETE CASCADE,
  service_code text,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated manage invoice lines" ON public.fin_invoice_lines
  FOR ALL TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role) OR has_role(auth.uid(),'bdo'::app_role))
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role) OR has_role(auth.uid(),'bdo'::app_role));

-- ---------- Finance: Expenses ----------
CREATE TABLE IF NOT EXISTS public.fin_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_id uuid,
  category text NOT NULL DEFAULT 'general',
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  description text,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected|paid
  approver_id uuid,
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read own + elevated all" ON public.fin_expenses
  FOR SELECT TO authenticated
  USING (claimant_id = auth.uid() OR is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY "Authenticated insert own expense" ON public.fin_expenses
  FOR INSERT TO authenticated WITH CHECK (claimant_id = auth.uid() OR is_elevated_user(auth.uid()));
CREATE POLICY "Elevated update expense" ON public.fin_expenses
  FOR UPDATE TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY "Elevated delete expense" ON public.fin_expenses
  FOR DELETE TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));
CREATE TRIGGER trg_fin_expenses_updated BEFORE UPDATE ON public.fin_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Payroll ----------
CREATE TABLE IF NOT EXISTS public.pay_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month date NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft|processing|locked|paid
  total_gross numeric NOT NULL DEFAULT 0,
  total_paye numeric NOT NULL DEFAULT 0,
  total_nhif numeric NOT NULL DEFAULT 0,
  total_nssf numeric NOT NULL DEFAULT 0,
  total_nita numeric NOT NULL DEFAULT 0,
  total_net numeric NOT NULL DEFAULT 0,
  processed_by uuid,
  locked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pay_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated manage pay runs" ON public.pay_runs
  FOR ALL TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));
CREATE TRIGGER trg_pay_runs_updated BEFORE UPDATE ON public.pay_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.pay_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.pay_runs(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  basic numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  gross numeric NOT NULL DEFAULT 0,
  paye numeric NOT NULL DEFAULT 0,
  nhif numeric NOT NULL DEFAULT 0,
  nssf numeric NOT NULL DEFAULT 0,
  nita numeric NOT NULL DEFAULT 0,
  other_deductions numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pay_payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated manage payslips" ON public.pay_payslips
  FOR ALL TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));

-- ---------- Governance ----------
CREATE TABLE IF NOT EXISTS public.gov_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework text NOT NULL DEFAULT 'internal',
  code text NOT NULL,
  title text NOT NULL,
  description text,
  owner_id uuid,
  status text NOT NULL DEFAULT 'open', -- open|in_progress|met|exception
  evidence_url text,
  last_reviewed date,
  next_review date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gov_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elevated manage controls" ON public.gov_controls
  FOR ALL TO authenticated
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role))
  WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));
CREATE TRIGGER trg_gov_controls_updated BEFORE UPDATE ON public.gov_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.gov_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  body text,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  superseded_by uuid REFERENCES public.gov_policies(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gov_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read policies" ON public.gov_policies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Elevated write policies" ON public.gov_policies
  FOR INSERT TO authenticated WITH CHECK (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY "Elevated update policies" ON public.gov_policies
  FOR UPDATE TO authenticated USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));
CREATE POLICY "Elevated delete policies" ON public.gov_policies
  FOR DELETE TO authenticated USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(),'administrator'::app_role));

CREATE TABLE IF NOT EXISTS public.gov_policy_acks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.gov_policies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(policy_id, user_id)
);
ALTER TABLE public.gov_policy_acks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User read own acks" ON public.gov_policy_acks
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_elevated_user(auth.uid()));
CREATE POLICY "User insert own ack" ON public.gov_policy_acks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.gov_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL, -- expense|leave|contract|invoice|other
  target_id uuid,
  title text NOT NULL,
  amount numeric,
  requested_by uuid,
  approver_id uuid,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  decided_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gov_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read approvals own or elevated" ON public.gov_approvals
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR approver_id = auth.uid() OR is_elevated_user(auth.uid()));
CREATE POLICY "Insert approval as requester" ON public.gov_approvals
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid() OR is_elevated_user(auth.uid()));
CREATE POLICY "Update approval if approver/elevated" ON public.gov_approvals
  FOR UPDATE TO authenticated
  USING (approver_id = auth.uid() OR is_elevated_user(auth.uid()));

-- ---------- System ----------
CREATE TABLE IF NOT EXISTS public.sys_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sys_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read settings" ON public.sys_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System admin write settings" ON public.sys_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'system_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'system_admin'::app_role));

CREATE TABLE IF NOT EXISTS public.sys_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  region text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sys_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read tenants" ON public.sys_tenants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System admin manage tenants" ON public.sys_tenants
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'system_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'system_admin'::app_role));

-- ---------- Realtime publications ----------
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_equipment_issuance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fin_invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fin_invoice_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fin_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pay_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pay_payslips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_controls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_policies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_policy_acks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sys_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sys_tenants;
