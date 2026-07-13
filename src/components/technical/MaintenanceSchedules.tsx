import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

const MaintenanceSchedules = () => {
  const schedules = [
    {
      id: "MS-2025-001",
      equipment: "CCTV Main Server",
      site: "JKIA Terminal 2",
      type: "preventive",
      frequency: "monthly",
      lastService: "2025-10-23",
      nextDue: "2025-11-23",
      status: "due-today",
      assignedTo: "John Kamau",
      estimatedHours: 4
    },
    {
      id: "MS-2025-002",
      equipment: "Access Control Panel",
      site: "Villa Rosa Kempinski",
      type: "statutory",
      frequency: "quarterly",
      lastService: "2025-08-15",
      nextDue: "2025-11-25",
      status: "upcoming",
      assignedTo: "Mary Wanjiku",
      estimatedHours: 2
    },
    {
      id: "MS-2025-003",
      equipment: "Electric Fence Energizer",
      site: "Two Rivers Mall",
      type: "preventive",
      frequency: "monthly",
      lastService: "2025-10-10",
      nextDue: "2025-11-20",
      status: "overdue",
      assignedTo: "Peter Omondi",
      estimatedHours: 3
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue": return "bg-alert-critical text-primary-foreground";
      case "due-today": return "bg-alert-caution text-primary-foreground";
      case "upcoming": return "bg-blue-500 text-primary-foreground";
      case "completed": return "bg-alert-normal text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Due Today</p>
          <p className="text-3xl font-bold text-alert-caution mt-1">3</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Due This Week</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">12</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Overdue</p>
          <p className="text-3xl font-bold text-alert-critical mt-1">5</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground font-medium">Completed (30d)</p>
          <p className="text-3xl font-bold text-alert-normal mt-1">48</p>
        </Card>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="p-4 border-border hover:border-primary/50 transition-colors">
            <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{schedule.equipment}</h3>
                      {schedule.status === "overdue" && (
                        <AlertTriangle className="w-4 h-4 text-alert-critical" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {schedule.id} • {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Site:</span>
                    <span className="ml-2 text-foreground font-medium">{schedule.site}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="ml-2 text-foreground font-medium">{schedule.frequency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Service:</span>
                    <span className="ml-1 text-foreground font-medium">{schedule.lastService}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Next Due:</span>
                    <span className="ml-1 text-foreground font-medium">{schedule.nextDue}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assigned:</span>
                    <span className="ml-2 text-foreground font-medium">{schedule.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Est. Time:</span>
                    <span className="ml-1 text-foreground font-medium">{schedule.estimatedHours}h</span>
                  </div>
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
    </div>
  );
};

export default MaintenanceSchedules;
