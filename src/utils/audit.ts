import { supabase } from "@/integrations/supabase/client";

/**
 * Writes an audit log entry. Silently no-ops if table doesn't exist.
 * Call from any sensitive create/update/delete action.
 */
export async function writeAudit(opts: {
  action: string;
  entityType: string;
  entityId?: string;
  before?: any;
  after?: any;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_log' as any).insert({
      user_id: user.id,
      user_email: user.email,
      action: opts.action,
      entity_type: opts.entityType,
      entity_id: opts.entityId,
      before_data: opts.before,
      after_data: opts.after,
      user_agent: navigator.userAgent,
    });
  } catch {
    // silent — table may not exist yet
  }
}
