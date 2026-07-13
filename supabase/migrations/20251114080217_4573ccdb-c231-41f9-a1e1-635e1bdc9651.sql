-- Fix RLS policies to restrict access based on user roles
-- This addresses critical data exposure issues while maintaining functionality

-- 1. Fix staff table RLS - restrict to HR and elevated users only
DROP POLICY IF EXISTS "All authenticated users can view staff" ON public.staff;

CREATE POLICY "HR and elevated users can view staff"
ON public.staff
FOR SELECT
USING (
  has_role(auth.uid(), 'hr_custodian') OR 
  has_role(auth.uid(), 'administrator') OR 
  is_elevated_user(auth.uid())
);

-- 2. Fix incidents table RLS - restrict to security personnel only
DROP POLICY IF EXISTS "All authenticated users can view incidents" ON public.incidents;

CREATE POLICY "Security personnel can view incidents"
ON public.incidents
FOR SELECT
USING (
  has_role(auth.uid(), 'control_room_officer') OR 
  has_role(auth.uid(), 'operations_supervisor') OR 
  has_role(auth.uid(), 'administrator') OR
  is_elevated_user(auth.uid())
);

-- 3. Fix alarm_activations table RLS - restrict to control room and responders
DROP POLICY IF EXISTS "All authenticated users can view alarm activations" ON public.alarm_activations;

CREATE POLICY "Control room and responders can view alarms"
ON public.alarm_activations
FOR SELECT
USING (
  has_role(auth.uid(), 'control_room_officer') OR 
  has_role(auth.uid(), 'administrator') OR
  is_elevated_user(auth.uid())
);

-- 4. Add explicit SELECT policy for client_finances
CREATE POLICY "Admins can view finances"
ON public.client_finances
FOR SELECT
USING (
  has_role(auth.uid(), 'administrator') OR 
  has_role(auth.uid(), 'bdo') OR
  is_elevated_user(auth.uid())
);

-- 5. Add explicit SELECT policy for client_contacts
CREATE POLICY "BDO and admins can view contacts"
ON public.client_contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'bdo') OR 
  has_role(auth.uid(), 'administrator') OR 
  is_elevated_user(auth.uid())
);