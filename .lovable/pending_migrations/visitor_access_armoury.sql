-- =========================================================
-- Visitor & Access Management + Asset/Armoury Custody
-- Black Hawk SOC-OS — Phase: Control Room consolidation
-- =========================================================

-- ============ Visitor & Access Management ================
CREATE TABLE IF NOT EXISTS public.visitor_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_number text UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  id_number text,
  phone text,
  company text,
  host_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  purpose text NOT NULL,
  vehicle_reg text,
  badge_no text,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz NOT NULL,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','checked_in','checked_out','expired','revoked')),
  watchlist_match boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_passes_status_idx ON public.visitor_passes(status);
CREATE INDEX IF NOT EXISTS visitor_passes_site_idx   ON public.visitor_passes(site_id);
CREATE INDEX IF NOT EXISTS visitor_passes_valid_idx  ON public.visitor_passes(valid_from, valid_to);

CREATE TABLE IF NOT EXISTS public.visitor_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  id_number text,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  active boolean NOT NULL DEFAULT true,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_watchlist_id_idx ON public.visitor_watchlist(id_number);

-- Pass numbering trigger
CREATE SEQUENCE IF NOT EXISTS visitor_pass_seq;
CREATE OR REPLACE FUNCTION public.set_visitor_pass_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pass_number IS NULL THEN
    NEW.pass_number := 'VST-' || TO_CHAR(CURRENT_DATE,'YYYYMMDD') || '-' ||
                       LPAD(nextval('visitor_pass_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_visitor_pass_number ON public.visitor_passes;
CREATE TRIGGER trg_visitor_pass_number BEFORE INSERT ON public.visitor_passes
  FOR EACH ROW EXECUTE FUNCTION public.set_visitor_pass_number();

DROP TRIGGER IF EXISTS trg_visitor_pass_updated ON public.visitor_passes;
CREATE TRIGGER trg_visitor_pass_updated BEFORE UPDATE ON public.visitor_passes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto watchlist match (best-effort)
CREATE OR REPLACE FUNCTION public.check_visitor_watchlist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.id_number IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.visitor_watchlist
    WHERE active = true AND id_number = NEW.id_number
  ) THEN
    NEW.watchlist_match := true;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_visitor_watchlist_check ON public.visitor_passes;
CREATE TRIGGER trg_visitor_watchlist_check BEFORE INSERT OR UPDATE OF id_number
  ON public.visitor_passes
  FOR EACH ROW EXECUTE FUNCTION public.check_visitor_watchlist();

-- =================== Asset & Armoury Custody ===================
CREATE TABLE IF NOT EXISTS public.armoury_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag text UNIQUE,
  asset_type text NOT NULL
    CHECK (asset_type IN ('firearm','radio','bwc','baton','cuffs','vest','taser','kit','other')),
  model text,
  serial_number text,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','issued','maintenance','lost','damaged','retired')),
  condition text NOT NULL DEFAULT 'good'
    CHECK (condition IN ('new','good','fair','poor','unserviceable')),
  assigned_to uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  acquired_at date,
  next_service_date date,
  certification_expires_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS armoury_assets_status_idx ON public.armoury_assets(status);
CREATE INDEX IF NOT EXISTS armoury_assets_type_idx   ON public.armoury_assets(asset_type);
CREATE INDEX IF NOT EXISTS armoury_assets_assigned_idx ON public.armoury_assets(assigned_to);

CREATE SEQUENCE IF NOT EXISTS armoury_asset_seq;
CREATE OR REPLACE FUNCTION public.set_armoury_asset_tag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.asset_tag IS NULL THEN
    NEW.asset_tag := 'AST-' || UPPER(LEFT(NEW.asset_type,3)) || '-' ||
                     LPAD(nextval('armoury_asset_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_armoury_asset_tag ON public.armoury_assets;
CREATE TRIGGER trg_armoury_asset_tag BEFORE INSERT ON public.armoury_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_armoury_asset_tag();

DROP TRIGGER IF EXISTS trg_armoury_assets_updated ON public.armoury_assets;
CREATE TRIGGER trg_armoury_assets_updated BEFORE UPDATE ON public.armoury_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.armoury_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.armoury_assets(id) ON DELETE CASCADE,
  action text NOT NULL
    CHECK (action IN ('issue','return','transfer','service','loss','damage','inspection')),
  officer_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  witnessed_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  signature_url text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS armoury_movements_asset_idx ON public.armoury_movements(asset_id);
CREATE INDEX IF NOT EXISTS armoury_movements_when_idx ON public.armoury_movements(occurred_at DESC);

-- Movement -> auto status update
CREATE OR REPLACE FUNCTION public.apply_armoury_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.armoury_assets SET
    status = CASE NEW.action
      WHEN 'issue'      THEN 'issued'
      WHEN 'return'     THEN 'available'
      WHEN 'transfer'   THEN 'issued'
      WHEN 'service'    THEN 'maintenance'
      WHEN 'loss'       THEN 'lost'
      WHEN 'damage'     THEN 'damaged'
      ELSE status
    END,
    assigned_to = CASE
      WHEN NEW.action = 'issue' THEN NEW.officer_id
      WHEN NEW.action = 'return' THEN NULL
      WHEN NEW.action = 'transfer' THEN NEW.officer_id
      ELSE assigned_to
    END,
    updated_at = now()
  WHERE id = NEW.asset_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_apply_armoury_movement ON public.armoury_movements;
CREATE TRIGGER trg_apply_armoury_movement AFTER INSERT ON public.armoury_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_armoury_movement();

-- ============ RLS ============
ALTER TABLE public.visitor_passes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_watchlist  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armoury_assets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armoury_movements  ENABLE ROW LEVEL SECURITY;

-- Authenticated users (operators on shift) can read; only elevated can mutate.
CREATE POLICY "visitor_passes_read_auth"     ON public.visitor_passes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "visitor_passes_insert_auth"   ON public.visitor_passes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "visitor_passes_update_elev"   ON public.visitor_passes
  FOR UPDATE TO authenticated USING (public.is_elevated_user(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "visitor_passes_delete_elev"   ON public.visitor_passes
  FOR DELETE TO authenticated USING (public.is_elevated_user(auth.uid()));

CREATE POLICY "visitor_watchlist_read_auth"  ON public.visitor_watchlist
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "visitor_watchlist_write_elev" ON public.visitor_watchlist
  FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

CREATE POLICY "armoury_assets_read_auth"     ON public.armoury_assets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "armoury_assets_write_elev"    ON public.armoury_assets
  FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

CREATE POLICY "armoury_movements_read_auth"  ON public.armoury_movements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "armoury_movements_insert_auth" ON public.armoury_movements
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "armoury_movements_update_elev" ON public.armoury_movements
  FOR UPDATE TO authenticated USING (public.is_elevated_user(auth.uid()));
CREATE POLICY "armoury_movements_delete_elev" ON public.armoury_movements
  FOR DELETE TO authenticated USING (public.is_elevated_user(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_passes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.armoury_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.armoury_movements;
