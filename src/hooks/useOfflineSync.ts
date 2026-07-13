import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  enqueueAction,
  getPendingActions,
  removeAction,
  updateActionStatus,
  getQueueCount,
  isOnline as checkOnline,
  type OfflineAction,
} from '@/utils/offlineQueue';

export const useOfflineSync = () => {
  const [online, setOnline] = useState(checkOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.success('Back online — syncing queued actions...');
      syncPendingActions();
    };
    const handleOffline = () => {
      setOnline(false);
      toast.warning('You are offline. Actions will be queued and synced when back online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync check
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) syncPendingActions();
      refreshCount();
    }, 30000);

    refreshCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  const refreshCount = async () => {
    const count = await getQueueCount();
    setPendingCount(count);
  };

  const syncPendingActions = useCallback(async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);

    try {
      const actions = await getPendingActions();
      if (actions.length === 0) {
        setSyncing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const action of actions) {
        try {
          await updateActionStatus(action.id!, 'syncing');
          await syncSingleAction(action);
          await removeAction(action.id!);
          successCount++;
        } catch (err) {
          console.error(`Failed to sync action ${action.id}:`, err);
          const newRetry = (action.retryCount || 0) + 1;
          if (newRetry >= 5) {
            await updateActionStatus(action.id!, 'failed', newRetry);
          } else {
            await updateActionStatus(action.id!, 'pending', newRetry);
          }
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Synced ${successCount} queued action${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} action${failCount > 1 ? 's' : ''} failed to sync`);
      }
    } finally {
      setSyncing(false);
      await refreshCount();
    }
  }, [syncing]);

  const syncSingleAction = async (action: OfflineAction): Promise<void> => {
    const { type, payload } = action;

    switch (type) {
      case 'clock_in':
        await supabase.from('attendance').insert({
          staff_id: payload.staff_id,
          check_in: payload.check_in || action.timestamp,
          site: payload.site,
          status: 'verified',
          shift_type: payload.shift_type || 'day',
          notes: `${payload.notes || ''} | OFFLINE_SYNC: queued at ${action.timestamp}`,
        });
        break;

      case 'clock_out': {
        const { data: latest } = await supabase
          .from('attendance')
          .select('id')
          .eq('staff_id', payload.staff_id)
          .is('check_out', null)
          .order('check_in', { ascending: false })
          .limit(1)
          .single();

        if (latest) {
          await supabase.from('attendance').update({
            check_out: payload.check_out || action.timestamp,
            notes: `${payload.notes || ''} | OFFLINE_SYNC`,
          }).eq('id', latest.id);
        }
        break;
      }

      case 'checkpoint_scan':
        await supabase.from('patrol_checkpoints').insert({
          checkpoint_id: payload.checkpoint_id,
          scanned_at: payload.scanned_at || action.timestamp,
          scanned_by: payload.scanned_by,
          gps_coordinates: payload.gps_coordinates,
          notes: `OFFLINE_SYNC: ${payload.notes || ''}`,
        } as any);
        break;

      case 'patrol_entry':
        await supabase.from('patrol_entries' as any).insert({
          ...payload,
          created_at: action.timestamp,
        } as any);
        break;

      case 'incident_report':
        await supabase.from('incidents').insert({
          incident_number: payload.incident_number || `MI-SYNC-${Date.now()}`,
          incident_type: payload.incident_type || 'general',
          description: payload.description,
          location: payload.location,
          status: payload.status || 'open',
          reported_by: payload.reported_by,
        } as any);
        break;

      case 'dob_entry':
        await supabase.from('dob_entries').insert({
          entry_type: payload.entry_type || 'general',
          description: payload.description,
          site_name: payload.site_name,
          recorded_by: payload.recorded_by,
        } as any);
        break;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  };

  const queueAction = useCallback(async (
    type: OfflineAction['type'],
    payload: Record<string, any>
  ): Promise<{ queued: boolean; id?: number }> => {
    if (navigator.onLine) {
      return { queued: false };
    }

    const id = await enqueueAction({
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
    await refreshCount();
    toast.info('Action queued — will sync when back online');
    return { queued: true, id };
  }, []);

  return {
    online,
    pendingCount,
    syncing,
    queueAction,
    syncPendingActions,
    refreshCount,
  };
};

export default useOfflineSync;
