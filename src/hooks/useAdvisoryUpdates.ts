import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  message: string;
  level: 'normal' | 'caution' | 'critical';
  time: string;
  category?: string;
}

interface AdvisoryData {
  trafficAlerts: Alert[];
  protestAlerts: Alert[];
  terrorAlerts: Alert[];
  weatherAlerts: Alert[];
  crimeAlerts: Alert[];
}

const formatNairobiTime = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const mapSeverityToLevel = (severity: string): 'normal' | 'caution' | 'critical' => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'critical';
    case 'CAUTION': return 'caution';
    default: return 'normal';
  }
};

export const useAdvisoryUpdates = (interval: number = 90000) => {
  const [advisoryData, setAdvisoryData] = useState<AdvisoryData>({
    trafficAlerts: [],
    protestAlerts: [],
    terrorAlerts: [],
    weatherAlerts: [],
    crimeAlerts: [],
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAdvisories = useCallback(async () => {
    setIsUpdating(true);

    try {
      // Resolve the authenticated user's tenant_id so we only return advisories
      // for their tenant. Falls back to the global feed for system admins whose
      // profile has no tenant_id (they see everything — RLS is the final gate).
      const { data: { user } } = await supabase.auth.getUser();
      let tenantId: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .maybeSingle();
        tenantId = (profile as any)?.tenant_id ?? null;
      }

      // Single source of truth: strategic_advisories (last 96h to match dashboard)
      const cutoff = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();
      let query = supabase
        .from('strategic_advisories')
        .select('*')
        .gte('timestamp_detected', cutoff)
        .order('timestamp_detected', { ascending: false })
        .limit(50);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching strategic advisories:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapToAlerts = (items: any[]): Alert[] =>
          items.map((a) => ({
            id: a.id,
            message: `[${formatNairobiTime(a.timestamp_detected)}] ${a.title}`,
            level: mapSeverityToLevel(a.severity),
            time: formatNairobiTime(a.timestamp_detected),
            category: a.category?.toLowerCase(),
          }));

        setAdvisoryData({
          trafficAlerts: mapToAlerts(data.filter((a) => a.category?.toLowerCase() === 'traffic')).slice(0, 5),
          protestAlerts: mapToAlerts(data.filter((a) => a.category?.toLowerCase() === 'protest')).slice(0, 5),
          terrorAlerts: mapToAlerts(data.filter((a) => a.category?.toLowerCase() === 'terror')).slice(0, 5),
          weatherAlerts: mapToAlerts(data.filter((a) => a.category?.toLowerCase() === 'weather')).slice(0, 5),
          crimeAlerts: mapToAlerts(data.filter((a) => a.category?.toLowerCase() === 'crime')).slice(0, 5),
        });
      }

      setLastUpdated(new Date());
      console.log(`Loaded ${data?.length ?? 0} advisories from strategic_advisories`);
    } catch (error) {
      console.error('Advisory fetch error:', error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAdvisories();
  }, [fetchAdvisories]);

  useEffect(() => {
    fetchAdvisories();
    const timer = setInterval(fetchAdvisories, interval);
    return () => clearInterval(timer);
  }, [interval, fetchAdvisories]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('advisory-updates-hook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'strategic_advisories' }, () => {
        console.log('New advisory detected, refreshing...');
        fetchAdvisories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAdvisories]);

  return { advisoryData, isUpdating, lastUpdated, refresh };
};
