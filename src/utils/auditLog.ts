import { supabase } from "@/integrations/supabase/client";

export const logAudit = async (params: {
  module: string;
  action: string;
  recordId?: string;
  changes?: any;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    await supabase.from('audit_trail').insert({
      user_id: user.id,
      user_role: roleData?.role || 'unknown',
      module: params.module,
      action: params.action,
      record_id: params.recordId,
      changes: params.changes,
      ip_address: null, // Could be captured if needed
      workstation: navigator.userAgent.substring(0, 100),
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
