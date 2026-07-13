import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Tracks current user presence in user_presence table.
 * Heartbeats every 30s while tab is visible.
 * Gracefully no-ops if table doesn't exist yet.
 */
export const usePresence = () => {
  const { user } = useAuth();
  const [presenceCount, setPresenceCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let timer: any;
    let mounted = true;

    const heartbeat = async () => {
      try {
        await supabase.from('user_presence' as any).upsert({
          user_id: user.id,
          status: document.hidden ? 'away' : 'online',
          current_page: window.location.pathname,
          last_seen: new Date().toISOString(),
        });
      } catch (e) {
        // table may not exist yet — silent
      }

      // count online users in last 90s
      try {
        const cutoff = new Date(Date.now() - 90 * 1000).toISOString();
        const { count } = await supabase.from('user_presence' as any)
          .select('user_id', { count: 'exact', head: true })
          .gte('last_seen', cutoff);
        if (mounted) setPresenceCount(count || 0);
      } catch {}
    };

    heartbeat();
    timer = setInterval(heartbeat, 30000);

    const onVisibility = () => heartbeat();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.id]);

  return { presenceCount };
};
