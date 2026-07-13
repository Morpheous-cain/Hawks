import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MaintenanceTask {
  id: string;
  schedule_id: string;
  equipment_id: string;
  maintenance_type: string;
  next_service_date: string;
  status: string;
  estimated_hours: number;
  technical_equipment?: {
    equipment_id: string;
    equipment_type: string;
    location_description: string;
  };
}

export const MaintenanceCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [selectedDateTasks, setSelectedDateTasks] = useState<MaintenanceTask[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('technical_maintenance_schedules')
        .select(`
          *,
          technical_equipment (
            equipment_id,
            equipment_type,
            location_description
          )
        `)
        .order('next_service_date', { ascending: true });

      if (!error && data) {
        setTasks(data as MaintenanceTask[]);
      }
    };

    fetchTasks();

    const channel = supabase
      .channel('maintenance-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_maintenance_schedules' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const filtered = tasks.filter(task => task.next_service_date === dateStr);
      setSelectedDateTasks(filtered);
    }
  }, [date, tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue": return "bg-alert-critical text-primary-foreground";
      case "due-today": return "bg-alert-caution text-primary-foreground";
      case "scheduled": return "bg-blue-500 text-primary-foreground";
      case "completed": return "bg-alert-normal text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const hasTasksOnDate = (checkDate: Date) => {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    return tasks.some(task => task.next_service_date === dateStr);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Maintenance Calendar</h3>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border border-border"
          modifiers={{
            hasTask: (date) => hasTasksOnDate(date),
          }}
          modifiersStyles={{
            hasTask: { fontWeight: 'bold', color: 'hsl(var(--primary))' },
          }}
        />
      </Card>

      <Card className="p-6 border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Tasks for {date ? format(date, 'PPP') : 'Selected Date'}
        </h3>
        {selectedDateTasks.length > 0 ? (
          <div className="space-y-3">
            {selectedDateTasks.map((task) => (
              <div key={task.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {task.technical_equipment?.equipment_id || 'Equipment'} - {task.technical_equipment?.location_description || 'Location'}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {task.maintenance_type} • {task.estimated_hours}h
                  </p>
                </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tasks scheduled for this date</p>
        )}
      </Card>
    </div>
  );
};
