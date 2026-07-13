-- Create enums for type safety
CREATE TYPE public.app_role AS ENUM (
  'ceo',
  'coo', 
  'control_room_officer',
  'operations_supervisor',
  'hr_custodian',
  'administrator',
  'bdo',
  'system_admin'
);

CREATE TYPE public.staff_status AS ENUM (
  'active',
  'off_duty',
  'on_leave',
  'suspended',
  'terminated',
  'transferred',
  'resigned',
  'deserted'
);

CREATE TYPE public.leave_type AS ENUM (
  'annual',
  'sick',
  'maternity',
  'paternity',
  'compassionate'
);

CREATE TYPE public.risk_tier AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE public.risk_trend AS ENUM (
  'improving',
  'stable',
  'worsening'
);

CREATE TYPE public.contract_status AS ENUM (
  'active',
  'pending_renewal',
  'expired',
  'terminated'
);

CREATE TYPE public.payment_status AS ENUM (
  'paid',
  'pending',
  'overdue'
);

-- ============================================
-- AUTHENTICATION & RBAC
-- ============================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Helper function for elevated users (COO, CEO, Operations)
CREATE OR REPLACE FUNCTION public.is_elevated_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('ceo', 'coo', 'operations_supervisor', 'system_admin')
  );
$$;

-- ============================================
-- STAFF MANAGEMENT MODULE
-- ============================================

-- Staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  national_id TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  phone_secondary TEXT,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  nssf_number TEXT,
  nhif_number TEXT,
  kra_pin TEXT,
  position TEXT NOT NULL,
  rank TEXT,
  duty_category TEXT,
  current_site TEXT,
  current_client TEXT,
  contract_type TEXT,
  date_employed DATE NOT NULL,
  probation_end_date DATE,
  status staff_status DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Elevated users can manage staff"
  ON public.staff FOR ALL
  USING (public.is_elevated_user(auth.uid()));

CREATE POLICY "All authenticated users can view staff"
  ON public.staff FOR SELECT
  TO authenticated
  USING (true);

-- Status history table
CREATE TABLE public.status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  previous_status staff_status,
  new_status staff_status NOT NULL,
  reason TEXT,
  effective_date DATE NOT NULL,
  form_number TEXT,
  reported_by TEXT NOT NULL,
  authorized_by TEXT,
  remarks TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Elevated users can manage status history"
  ON public.status_history FOR ALL
  USING (public.is_elevated_user(auth.uid()));

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  site TEXT NOT NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  shift_type TEXT,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Control room can manage attendance"
  ON public.attendance FOR ALL
  USING (
    public.has_role(auth.uid(), 'control_room_officer') OR
    public.is_elevated_user(auth.uid())
  );

-- Leave tracking table
CREATE TABLE public.leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Elevated users can manage leave"
  ON public.leave_records FOR ALL
  USING (public.is_elevated_user(auth.uid()));

-- ============================================
-- CLIENT MANAGEMENT MODULE
-- ============================================

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT UNIQUE NOT NULL,
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  registration_number TEXT,
  pin TEXT,
  sector TEXT,
  background TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BDO and Admin can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'bdo') OR
    public.has_role(auth.uid(), 'administrator') OR
    public.is_elevated_user(auth.uid())
  );

CREATE POLICY "Elevated users can manage clients"
  ON public.clients FOR ALL
  USING (public.is_elevated_user(auth.uid()));

CREATE POLICY "BDO and Admin can view clients"
  ON public.clients FOR SELECT
  USING (
    public.has_role(auth.uid(), 'bdo') OR
    public.has_role(auth.uid(), 'administrator') OR
    public.is_elevated_user(auth.uid())
  );

-- Client contacts
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  contact_type TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can manage contacts"
  ON public.client_contacts FOR ALL
  USING (
    public.has_role(auth.uid(), 'bdo') OR
    public.has_role(auth.uid(), 'administrator') OR
    public.is_elevated_user(auth.uid())
  );

-- Sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  site_name TEXT NOT NULL,
  site_type TEXT,
  address TEXT NOT NULL,
  gps_coordinates TEXT,
  site_commander TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can manage sites"
  ON public.sites FOR ALL
  USING (
    public.has_role(auth.uid(), 'administrator') OR
    public.is_elevated_user(auth.uid())
  );

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  contract_number TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value DECIMAL(12, 2),
  billing_frequency TEXT,
  service_scope TEXT[],
  status contract_status DEFAULT 'active',
  document_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can manage contracts"
  ON public.contracts FOR ALL
  USING (
    public.has_role(auth.uid(), 'bdo') OR
    public.has_role(auth.uid(), 'administrator') OR
    public.is_elevated_user(auth.uid())
  );

-- Risk assessments table
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_tier risk_tier NOT NULL,
  risk_trend risk_trend DEFAULT 'stable',
  findings TEXT,
  recommendations TEXT,
  assessed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "COO manages risk assessments"
  ON public.risk_assessments FOR ALL
  USING (public.is_elevated_user(auth.uid()));

-- Financial tracking
CREATE TABLE public.client_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  payment_date DATE,
  ageing_days INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrator manages finances"
  ON public.client_finances FOR ALL
  USING (
    public.has_role(auth.uid(), 'administrator') OR
    public.is_elevated_user(auth.uid())
  );

-- ============================================
-- AUDIT TRAIL (Cross-Module)
-- ============================================

CREATE TABLE public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id UUID,
  user_id UUID REFERENCES public.profiles(id),
  user_role TEXT,
  changes JSONB,
  ip_address TEXT,
  workstation TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Elevated users can view audit trail"
  ON public.audit_trail FOR SELECT
  USING (public.is_elevated_user(auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();