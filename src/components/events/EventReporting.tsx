import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, BarChart3, Users, Clock, 
  CheckCircle, AlertTriangle, TrendingUp, Calendar,
  Printer, Mail, Shield
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportToCSV, exportToPDF } from "@/utils/exportData";

interface EventReportingProps {
  event: any;
  assignments?: any[];
  incidents?: any[];
}

const EventReporting = ({ event, assignments = [], incidents = [] }: EventReportingProps) => {
  const [selectedReport, setSelectedReport] = useState("summary");

  // Calculate metrics
  const totalStaff = event?.staff_required || 0;
  const assignedStaff = event?.staff_assigned || 0;
  const staffingRate = totalStaff > 0 ? (assignedStaff / totalStaff) * 100 : 0;
  const incidentCount = incidents.length;
  const resolvedIncidents = incidents.filter((i: any) => i.status === 'resolved' || i.status === 'closed').length;
  const resolutionRate = incidentCount > 0 ? (resolvedIncidents / incidentCount) * 100 : 100;

  const reportTypes = [
    { id: 'summary', label: 'Summary Report', icon: FileText },
    { id: 'attendance', label: 'Attendance Report', icon: Users },
    { id: 'incidents', label: 'Incident Report', icon: AlertTriangle },
    { id: 'performance', label: 'Performance Report', icon: TrendingUp },
  ];

  const handleExport = (format: 'pdf' | 'csv') => {
    const reportData = {
      eventName: event?.event_name,
      date: event?.event_date,
      venue: event?.venue,
      staffRequired: totalStaff,
      staffAssigned: assignedStaff,
      incidents: incidentCount,
      incidentsResolved: resolvedIncidents
    };

    if (format === 'csv') {
      exportToCSV([reportData], `event_report_${event?.id}`);
    } else {
      exportToPDF([reportData], `event_report_${event?.id}`, `Event Report: ${event?.event_name}`);
    }
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const performanceMetrics = [
    { label: 'Staffing Completion', value: staffingRate, target: 100 },
    { label: 'Incident Resolution', value: resolutionRate, target: 95 },
    { label: 'Response Time Avg', value: 85, target: 90 },
    { label: 'Patrol Compliance', value: 92, target: 90 },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff Deployed</p>
              <p className="text-xl font-bold">{assignedStaff}/{totalStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Incidents</p>
              <p className="text-xl font-bold">{incidentCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-xl font-bold">{resolvedIncidents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolution Rate</p>
              <p className="text-xl font-bold">{resolutionRate.toFixed(0)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Tabs */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Event Reports
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('pdf')}>
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedReport} onValueChange={setSelectedReport}>
            <TabsList className="grid w-full grid-cols-4">
              {reportTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="gap-2">
                  <type.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="summary" className="mt-6">
              <div className="space-y-6">
                {/* Event Overview */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Event Name</p>
                    <p className="font-semibold">{event?.event_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {event?.event_date ? format(new Date(event.event_date), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-semibold">{event?.venue || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Security Level</p>
                    <Badge className={
                      event?.security_level === 'high' ? 'bg-alert-critical/20 text-alert-critical' :
                      event?.security_level === 'medium' ? 'bg-alert-caution/20 text-alert-caution' :
                      'bg-alert-normal/20 text-alert-normal'
                    }>
                      {event?.security_level || 'N/A'}
                    </Badge>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="font-semibold mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    {performanceMetrics.map((metric, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{metric.label}</span>
                          <span className={metric.value >= metric.target ? 'text-green-500' : 'text-amber-500'}>
                            {metric.value.toFixed(0)}% (Target: {metric.target}%)
                          </span>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lessons Learned */}
                <div>
                  <h3 className="font-semibold mb-4">Lessons Learned</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Crowd management at main entrance was effective</p>
                    <p>• VIP zone required additional personnel</p>
                    <p>• Communication protocols worked smoothly</p>
                    <p>• Consider earlier deployment for high-traffic events</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Staff Attendance Log</h3>
                  <Badge variant="secondary">{assignedStaff} Personnel</Badge>
                </div>
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No attendance records</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{a.staff?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{a.role}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={a.check_in_time ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}>
                            {a.check_in_time ? 'Checked In' : 'Pending'}
                          </Badge>
                          {a.check_in_time && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(a.check_in_time), 'HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="incidents" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Incident Summary</h3>
                  <Badge variant="secondary">{incidentCount} Incidents</Badge>
                </div>
                {incidentCount === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
                    <p className="text-muted-foreground">No incidents recorded</p>
                    <p className="text-sm text-muted-foreground mt-1">Event completed without incidents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidents.slice(0, 5).map((incident: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{incident.title}</p>
                            <p className="text-sm text-muted-foreground">{incident.incident_type}</p>
                          </div>
                          <Badge className={
                            incident.status === 'resolved' ? 'bg-green-500/20 text-green-500' :
                            incident.status === 'open' ? 'bg-red-500/20 text-red-500' :
                            'bg-amber-500/20 text-amber-500'
                          }>
                            {incident.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="text-sm text-muted-foreground mb-2">Average Response Time</h4>
                    <p className="text-3xl font-bold text-primary">4.2 min</p>
                    <p className="text-xs text-green-500 mt-1">↓ 12% from previous event</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm text-muted-foreground mb-2">Patrol Completion</h4>
                    <p className="text-3xl font-bold text-primary">98%</p>
                    <p className="text-xs text-green-500 mt-1">Above 95% target</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm text-muted-foreground mb-2">CCTV Coverage</h4>
                    <p className="text-3xl font-bold text-primary">100%</p>
                    <p className="text-xs text-muted-foreground mt-1">All zones monitored</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm text-muted-foreground mb-2">Client Satisfaction</h4>
                    <p className="text-3xl font-bold text-primary">4.8/5</p>
                    <p className="text-xs text-green-500 mt-1">Excellent rating</p>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Guard Performance Rankings</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'John Kamau', role: 'Team Leader', score: 98 },
                      { name: 'Mary Wanjiku', role: 'Access Control', score: 95 },
                      { name: 'Peter Ochieng', role: 'VIP Protection', score: 92 },
                    ].map((guard, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <span className="text-lg font-bold text-primary">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{guard.name}</p>
                          <p className="text-sm text-muted-foreground">{guard.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{guard.score}%</p>
                          <p className="text-xs text-muted-foreground">Performance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventReporting;
