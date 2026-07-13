import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeStats {
  activePersonnel: number;
  deploymentSites: number;
  activePatrols: number;
  openIncidents: number;
  activeClients: number;
  monthlyRevenue: number;
  responseTime: number;
  slaCompliance: number;
  checkpointVerification: number;
  missedCheckpoints: number;
  alarmEvents: number;
  cctvAlerts: number;
  courierDeliveries: number;
  courierActiveRiders: number;
  courierAvgDeliveryTime: number;
  courierCODCollected: number;
}

const defaultStats: RealtimeStats = {
  activePersonnel: 0,
  deploymentSites: 0,
  activePatrols: 0,
  openIncidents: 0,
  activeClients: 0,
  monthlyRevenue: 45780000,
  responseTime: 8.5,
  slaCompliance: 94.2,
  checkpointVerification: 98.1,
  missedCheckpoints: 0,
  alarmEvents: 0,
  cctvAlerts: 0,
  courierDeliveries: 0,
  courierActiveRiders: 0,
  courierAvgDeliveryTime: 0,
  courierCODCollected: 0,
};

export const useRealtimeSimulation = (interval: number = 10000) => {
  const [stats, setStats] = useState<RealtimeStats>(defaultStats);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const fetchStats = useCallback(async () => {
    setIsUpdating(true);
    
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Parallel fetch all stats for efficiency
      const [staffRes, sitesRes, incidentsRes, clientsRes, alarmsRes, attendanceRes, patrolsRes, courierRes, ridersRes,
             alarmResponseRes, slaRes, checkpointRes, missedCpRes, cctvRes, revenueRes, courierTimeRes] = await Promise.all([
        supabase.from('staff').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('sites').select('id', { count: 'exact', head: true }),
        supabase.from('incidents').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('alarm_activations').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).is('check_out', null),
        supabase.from('patrols').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('courier_deliveries').select('id, status'),
        supabase.from('courier_riders').select('id', { count: 'exact', head: true }).eq('status', 'available'),
        // KPIs replacing hardcoded values
        supabase.from('alarm_activations').select('triggered_at, acknowledged_at').not('acknowledged_at', 'is', null).gte('triggered_at', thirtyDaysAgo),
        supabase.from('alarm_activations').select('sla_breached').gte('triggered_at', thirtyDaysAgo),
        supabase.from('patrol_checkpoints' as any).select('scanned_at'),
        supabase.from('patrol_checkpoints' as any).select('id', { count: 'exact', head: true }).is('scanned_at', null),
        supabase.from('cctv_events' as any).select('id', { count: 'exact', head: true }).gte('occurred_at', todayStart),
        supabase.from('client_finances').select('amount').gte('invoice_date', monthStart),
        supabase.from('courier_deliveries').select('created_at, delivered_at').not('delivered_at', 'is', null).gte('created_at', thirtyDaysAgo),
      ]);

      // Calculate courier stats
      const deliveries = courierRes.data || [];
      const completedDeliveries = deliveries.filter((d: { status: string }) => d.status === 'delivered').length;

      // Monthly revenue
      const monthlyRevenue = (revenueRes.data ?? []).reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);

      // Alarm response time in minutes
      const alarmRespMins = (alarmResponseRes.data ?? []).map((a: any) => {
        const ms = new Date(a.acknowledged_at).getTime() - new Date(a.triggered_at).getTime();
        return ms / 60000;
      }).filter((m: number) => m > 0 && m < 120);
      const responseTime = alarmRespMins.length > 0
        ? Math.round((alarmRespMins.reduce((a: number, b: number) => a + b, 0) / alarmRespMins.length) * 10) / 10
        : 0;

      // SLA compliance
      const slaData = slaRes.data ?? [];
      const slaTotal = slaData.length;
      const slaOk = slaData.filter((a: any) => !a.sla_breached).length;
      const slaCompliance = slaTotal > 0 ? Math.round((slaOk / slaTotal) * 1000) / 10 : 100;

      // Checkpoint verification
      const cpData = checkpointRes.data ?? [];
      const cpTotal = cpData.length;
      const cpScanned = cpData.filter((c: any) => c.scanned_at !== null).length;
      const checkpointVerification = cpTotal > 0 ? Math.round((cpScanned / cpTotal) * 1000) / 10 : 100;
      const missedCheckpoints = missedCpRes.count ?? 0;

      // CCTV alerts today
      const cctvAlerts = cctvRes.count ?? 0;

      // Courier avg delivery time in minutes
      const deliveryMinutes = (courierTimeRes.data ?? []).map((d: any) => {
        const ms = new Date(d.delivered_at).getTime() - new Date(d.created_at).getTime();
        return ms / 60000;
      }).filter((m: number) => m > 0 && m < 10080); // max 1 week
      const courierAvgDeliveryTime = deliveryMinutes.length > 0
        ? Math.round(deliveryMinutes.reduce((a: number, b: number) => a + b, 0) / deliveryMinutes.length)
        : 0;

      setStats({
        activePersonnel: staffRes.count ?? 0,
        deploymentSites: sitesRes.count ?? 0,
        openIncidents: incidentsRes.count ?? 0,
        activeClients: clientsRes.count ?? 0,
        alarmEvents: alarmsRes.count ?? 0,
        activePatrols: patrolsRes.count ?? attendanceRes.count ?? 0,
        monthlyRevenue,
        responseTime,
        slaCompliance,
        checkpointVerification,
        missedCheckpoints,
        cctvAlerts,
        courierDeliveries: completedDeliveries,
        courierActiveRiders: ridersRes.count ?? 0,
        courierAvgDeliveryTime,
        courierCODCollected: 0,
      });
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Polling interval as backup
    const timer = setInterval(fetchStats, interval);

    // Create unique channel names with timestamp to avoid conflicts
    const channelId = `realtime-stats-${Date.now()}`;
    
    // Subscribe to all relevant tables for real-time updates
    const tables = ['staff', 'sites', 'incidents', 'clients', 'alarm_activations', 'attendance', 'patrols', 'courier_deliveries', 'courier_riders'];
    
    tables.forEach((table) => {
      const channel = supabase
        .channel(`${channelId}-${table}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table }, 
          () => {
            fetchStats();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          }
        });
      
      channelsRef.current.push(channel);
    });

    // Broadcast channel for cross-tab sync
    const broadcastChannel = supabase
      .channel(`${channelId}-broadcast`)
      .on('broadcast', { event: 'stats-update' }, () => {
        fetchStats();
      })
      .subscribe();
    
    channelsRef.current.push(broadcastChannel);

    return () => {
      clearInterval(timer);
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [interval, fetchStats]);

  // Broadcast updates to all connected clients
  const broadcastUpdate = useCallback(() => {
    const channel = supabase.channel('stats-broadcast');
    channel.send({
      type: 'broadcast',
      event: 'stats-update',
      payload: {},
    });
  }, []);

  return { stats, isUpdating, isConnected, refetch: fetchStats, broadcastUpdate };
};
