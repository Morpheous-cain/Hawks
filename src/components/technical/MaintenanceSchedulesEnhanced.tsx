import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, AlertTriangle, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceCalendar } from "./MaintenanceCalendar";
import { exportToCSV, exportToPDF } from "@/utils/exportData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MaintenanceSchedulesEnhanced = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
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
      setSchedules(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();

    const channel = supabase
      .channel('maintenance-schedules-enhanced')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_maintenance_schedules' }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredSchedules = schedules.filter(schedule =>
    searchTerm === "" ||
    schedule.technical_equipment?.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.schedule_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const summaryStats = {
    dueToday: schedules.filter(s => s.status === 'due-today').length,
    dueThisWeek: schedules.filter(s => s.status === 'scheduled' || s.status === 'due-today').length,
    overdue: schedules.filter(s => s.status === 'overdue').length,
    completed: schedules.filter(s => s.status === 'completed').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue": return "bg-alert-critical text-primary-foreground";
      case "due-today": return "bg-alert-caution text-primary-foreground";
      case "scheduled": return "bg-blue-500 text-primary-foreground";
      case "completed": return "bg-alert-normal text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredSchedules.map(schedule => ({
      'Schedule ID': schedule.schedule_id,
      'Equipment': schedule.technical_equipment?.equipment_id || 'N/A',
      'Location': schedule.technical_equipment?.location_description || 'N/A',
      'Type': schedule.maintenance_type,
      'Frequency': schedule.frequency,
      'Last Service': schedule.last_service_date || 'N/A',
      'Next Due': schedule.next_service_date,
      'Status': schedule.status,
      'Est. Hours': schedule.estimated_hours || 'N/A',
    }));
    exportToCSV(exportData, 'maintenance_schedules');
  };

  const handleExportPDF = () => {
    const exportData = filteredSchedules.map(schedule => ({
      'Schedule ID': schedule.schedule_id,
      'Equipment': schedule.technical_equipment?.equipment_id || 'N/A',
      'Type': schedule.maintenance_type,
      'Next Due': schedule.next_service_date,
      'Status': schedule.status,
    }));
    exportToPDF(exportData, 'maintenance_schedules', 'Maintenance Schedules Report');
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Due Today</p>
          <p className="text-3xl font-bold text-alert-caution mt-1">{summaryStats.dueToday}</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Due This Week</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">{summaryStats.dueThisWeek}</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Overdue</p>
          <p className="text-3xl font-bold text-alert-critical mt-1">{summaryStats.overdue}</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Completed (30d)</p>
          <p className="text-3xl font-bold text-alert-normal mt-1">{summaryStats.completed}</p>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search & Export */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search schedules..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Schedules List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No maintenance schedules found</div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((schedule) => (
                <Card key={schedule.id} className="p-4 border-border hover:border-primary/50 transition-colors">
                  <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            {schedule.technical_equipment?.equipment_id || 'Equipment'} - {schedule.technical_equipment?.location_description || 'Location'}
                          </h3>
                          {schedule.status === "overdue" && (
                            <AlertTriangle className="w-4 h-4 text-alert-critical" />
                          )}
                        </div>
                          <p className="text-sm text-muted-foreground">
                            {schedule.schedule_id} • {schedule.maintenance_type.charAt(0).toUpperCase() + schedule.maintenance_type.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 text-foreground font-medium capitalize">{schedule.technical_equipment?.equipment_type || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequency:</span>
                          <span className="ml-2 text-foreground font-medium">{schedule.frequency}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Last Service:</span>
                          <span className="ml-1 text-foreground font-medium">{schedule.last_service_date || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Next Due:</span>
                          <span className="ml-1 text-foreground font-medium">{schedule.next_service_date}</span>
                        </div>
                        {schedule.estimated_hours && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Est. Time:</span>
                            <span className="ml-1 text-foreground font-medium">{schedule.estimated_hours}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                      <Badge className={getStatusColor(schedule.status)}>
                        {schedule.status.replace("-", " ")}
                      </Badge>
                      <Button variant="outline" size="sm" className="w-full">
                        Schedule Work
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <MaintenanceCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceSchedulesEnhanced;
