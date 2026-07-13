-- Tighten RLS: drop overly-permissive SELECT policies and replace with scoped ones

DROP POLICY IF EXISTS "Authenticated users can view client site profiles" ON public.technical_client_sites;

DROP POLICY IF EXISTS "Authenticated users can view risk scores" ON public.loss_control_risk_scores;
CREATE POLICY "Authorized users can view risk scores"
  ON public.loss_control_risk_scores FOR SELECT
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view behavior patterns" ON public.loss_control_behavior_patterns;
CREATE POLICY "Authorized users can view behavior patterns"
  ON public.loss_control_behavior_patterns FOR SELECT
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view loss control records" ON public.loss_control_records;
CREATE POLICY "Authorized users can view loss control records"
  ON public.loss_control_records FOR SELECT
  USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view audit trail" ON public.strategic_advisory_audit;
CREATE POLICY "Elevated users can view audit trail"
  ON public.strategic_advisory_audit FOR SELECT
  USING (is_elevated_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view mdt messages" ON public.mdt_messages;
CREATE POLICY "Authorized users can view mdt messages"
  ON public.mdt_messages FOR SELECT
  USING (
    auth.uid() = sent_by
    OR has_role(auth.uid(), 'control_room_officer'::app_role)
    OR is_elevated_user(auth.uid())
  );

-- evidence-vault storage policies
DROP POLICY IF EXISTS "Authorized users can view evidence vault" ON storage.objects;
CREATE POLICY "Authorized users can view evidence vault"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence-vault'
    AND (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role))
  );

DROP POLICY IF EXISTS "Authorized users can upload evidence vault" ON storage.objects;
CREATE POLICY "Authorized users can upload evidence vault"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence-vault'
    AND (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role))
  );

DROP POLICY IF EXISTS "Authorized users can update evidence vault" ON storage.objects;
CREATE POLICY "Authorized users can update evidence vault"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'evidence-vault'
    AND (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'control_room_officer'::app_role))
  );

DROP POLICY IF EXISTS "Authorized users can delete evidence vault" ON storage.objects;
CREATE POLICY "Authorized users can delete evidence vault"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'evidence-vault'
    AND is_elevated_user(auth.uid())
  );
