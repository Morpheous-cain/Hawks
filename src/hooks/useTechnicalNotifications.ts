import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './useNotifications';

export const useTechnicalNotifications = () => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    const checkOverdueTasks = async () => {
      try {
        const { data: overdueMaintenance } = await supabase
          .from('technical_maintenance_schedules')
          .select('*')
          .eq('status', 'overdue')
          .limit(5);

        const { data: criticalWorkOrders } = await supabase
          .from('technical_work_orders')
          .select('*')
          .eq('priority', 'critical')
          .in('status', ['pending', 'assigned'])
          .limit(5);

        if (overdueMaintenance && overdueMaintenance.length > 0) {
          addNotification({
            title: 'Overdue Maintenance',
            message: `${overdueMaintenance.length} maintenance task(s) are overdue`,
            type: 'warning',
          });
        }

        if (criticalWorkOrders && criticalWorkOrders.length > 0) {
          addNotification({
            title: 'Critical Work Orders',
            message: `${criticalWorkOrders.length} critical work order(s) pending`,
            type: 'critical',
          });
        }
      } catch (error) {
        console.error('Error checking technical tasks:', error);
      }
    };

    // Check immediately
    checkOverdueTasks();

    // Check every 5 minutes
    const interval = setInterval(checkOverdueTasks, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
