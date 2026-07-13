-- ============================================================
-- DOB ENTRIES SOFT DELETE (pending application)
-- Converts dob_entries from hard-DELETE to soft-delete so the
-- duty occurrence book is an immutable legal audit log.
-- Apply via: Lovable Cloud → Migrations, or Supabase SQL editor.
-- ============================================================

-- Add soft-delete columns if they don't already exist.
ALTER TABLE public.dob_entries
  ADD COLUMN IF NOT EXISTS deleted_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT NULL;

-- Index to speed up the mandatory WHERE deleted_at IS NULL filter.
CREATE INDEX IF NOT EXISTS idx_dob_entries_not_deleted
  ON public.dob_entries (deleted_at)
  WHERE deleted_at IS NULL;

-- RLS policy: prevent hard DELETEs for all non-admin roles.
-- Soft-delete is performed via UPDATE (set deleted_at), which is
-- allowed by the existing edit/delete policies.
CREATE POLICY IF NOT EXISTS "Block hard DELETE on dob_entries"
  ON public.dob_entries
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'administrator', 'system_admin')
    )
  );
