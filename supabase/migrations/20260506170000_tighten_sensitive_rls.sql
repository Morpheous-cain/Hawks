-- Tighten RLS on sensitive tables flagged by security scanner.

-- staff
DROP POLICY IF EXISTS "HR and elevated users can view staff" ON public.staff;
CREATE POLICY "HR custodian and elevated can view staff"
  ON public.staff FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'hr_custodian') OR public.is_elevated_user(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Elevated users can view all profiles" ON public.profiles;
CREATE POLICY "HR custodian and elevated can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'hr_custodian') OR public.is_elevated_user(auth.uid()));

-- courier_riders (table created outside migrations; guard against missing table)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'courier_riders'
  ) THEN
    DROP POLICY IF EXISTS "Elevated users can manage courier riders" ON public.courier_riders;
    EXECUTE $pol$
      CREATE POLICY "Elevated users can manage courier riders"
        ON public.courier_riders FOR ALL TO authenticated
        USING (public.is_elevated_user(auth.uid()))
        WITH CHECK (public.is_elevated_user(auth.uid()))
    $pol$;
  END IF;
END $$;

-- contracts
DROP POLICY IF EXISTS "Authorized users can manage contracts" ON public.contracts;
CREATE POLICY "Elevated users can manage contracts"
  ON public.contracts FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

-- clients
DROP POLICY IF EXISTS "BDO and Admin can view clients" ON public.clients;
DROP POLICY IF EXISTS "BDO and Admin can create clients" ON public.clients;
DROP POLICY IF EXISTS "Elevated users can manage clients" ON public.clients;
CREATE POLICY "Elevated users can view clients"
  ON public.clients FOR SELECT TO authenticated
  USING (public.is_elevated_user(auth.uid()) OR public.has_role(auth.uid(), 'control_room_officer'));
CREATE POLICY "Elevated users can manage clients"
  ON public.clients FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

-- sites
DROP POLICY IF EXISTS "Authorized users can manage sites" ON public.sites;
CREATE POLICY "Elevated users can manage sites"
  ON public.sites FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()) OR public.has_role(auth.uid(), 'control_room_officer'))
  WITH CHECK (public.is_elevated_user(auth.uid()));

-- client_contacts
DROP POLICY IF EXISTS "Authorized users can manage contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "BDO and admins can view contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Authorized users can view contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Elevated users can manage contacts" ON public.client_contacts;
CREATE POLICY "Elevated users can view contacts"
  ON public.client_contacts FOR SELECT TO authenticated
  USING (public.is_elevated_user(auth.uid()));
CREATE POLICY "Elevated users can manage contacts"
  ON public.client_contacts FOR ALL TO authenticated
  USING (public.is_elevated_user(auth.uid()))
  WITH CHECK (public.is_elevated_user(auth.uid()));

-- whatsapp_messages
DROP POLICY IF EXISTS "Control room can manage messages" ON public.whatsapp_messages;
CREATE POLICY "Control room can manage messages"
  ON public.whatsapp_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'control_room_officer') OR public.is_elevated_user(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'control_room_officer') OR public.is_elevated_user(auth.uid()));

-- sms_messages
DROP POLICY IF EXISTS "Control room can manage SMS" ON public.sms_messages;
CREATE POLICY "Control room can manage SMS"
  ON public.sms_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'control_room_officer') OR public.is_elevated_user(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'control_room_officer') OR public.is_elevated_user(auth.uid()));
