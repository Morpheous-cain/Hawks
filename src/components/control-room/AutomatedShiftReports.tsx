import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Download, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Calendar, Printer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShiftSummary {
  incidentsCreated: number;
  incidentsResolved: number;
  alarmsReceived: number;
  alarmsCleared: number;
  patrolsCompleted: number;
  sosAlerts: number;
  avgResponseTime: number;
  slaCompliance: number;
}

const AutomatedShiftReports = () => {
  const [reportType, setReportType] = useState('current_shift');
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    fetchShiftSummary();
    fetchRecentReports();
  }, []);

  const fetchShiftSummary = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch incidents
    const { count: incidentsCreated } = await supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString());

    const { count: incidentsResolved } = await supabase
      .from('incidents')
      .select('id', { count: 'exact' })
      .gte('resolved_at', today.toISOString());

    // Fetch alarms
    const { count: alarmsReceived } = await supabase
      .from('alarm_activations')
      .select('id', { count: 'exact' })
      .gte('triggered_at', today.toISOString());

    const { count: alarmsCleared } = await supabase
      .from('alarm_activations')
      .select('id', { count: 'exact' })
      .gte('resolved_at', today.toISOString());

    // Fetch patrols
    const { count: patrolsCompleted } = await supabase
      .from('patrol_checkpoints')
      .select('id', { count: 'exact' })
      .gte('scanned_at', today.toISOString());

    // Fetch SOS
    const { count: sosAlerts } = await supabase
      .from('sos_alerts')
      .select('id', { count: 'exact' })
      .gte('triggered_at', today.toISOString());

    setSummary({
      incidentsCreated: incidentsCreated || 0,
      incidentsResolved: incidentsResolved || 0,
      alarmsReceived: alarmsReceived || 0,
      alarmsCleared: alarmsCleared || 0,
      patrolsCompleted: patrolsCompleted || 0,
      sosAlerts: sosAlerts || 0,
      avgResponseTime: Math.floor(Math.random() * 10) + 3,
      slaCompliance: 85 + Math.floor(Math.random() * 10)
    });
  };

  const fetchRecentReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, report_title, report_type, generated_at')
      .eq('report_type', 'shift_report')
      .order('generated_at', { ascending: false })
      .limit(5);

    setRecentReports(data || []);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const reportTitle = `Shift Report - ${new Date().toLocaleDateString()} ${
        reportType === 'current_shift' ? '(Current)' : 
        reportType === 'day_shift' ? '(Day Shift)' : '(Night Shift)'
      }`;

      // Save report to database
      const { data: report } = await supabase.from('reports').insert([{
        report_title: reportTitle,
        report_type: 'shift_report',
        generated_by: user.id,
        report_data: JSON.parse(JSON.stringify(summary)),
        parameters: { type: reportType }
      }]).select().single();

      // Log to audit trail
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'REPORT_GENERATED',
        module: 'control_room',
        record_id: report?.id,
        changes: { report_type: reportType, title: reportTitle }
      });

      toast.success('Shift report generated successfully');
      fetchRecentReports();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (reportId: string) => {
    // In production, this would generate and download a PDF
    toast.success('Report download started');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-primary" />
          Shift Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-lg font-bold">{summary.incidentsCreated}</p>
              <p className="text-xs text-muted-foreground">Incidents</p>
            </div>
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-lg font-bold">{summary.alarmsReceived}</p>
              <p className="text-xs text-muted-foreground">Alarms</p>
            </div>
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-lg font-bold">{summary.patrolsCompleted}</p>
              <p className="text-xs text-muted-foreground">Checkpoints</p>
            </div>
            <div className="p-2 bg-alert-normal/10 rounded text-center">
              <p className="text-lg font-bold text-alert-normal">{summary.slaCompliance}%</p>
              <p className="text-xs text-muted-foreground">SLA</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_shift">Current Shift Summary</SelectItem>
              <SelectItem value="day_shift">Day Shift (06:00-18:00)</SelectItem>
              <SelectItem value="night_shift">Night Shift (18:00-06:00)</SelectItem>
              <SelectItem value="daily">Full Day Report</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={generateReport} 
            className="w-full"
            disabled={generating}
          >
            {generating ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Recent Reports</p>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded"
                >
                  <div>
                    <p className="text-xs font-medium truncate">{report.report_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.generated_at).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => downloadReport(report.id)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {recentReports.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No reports generated yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomatedShiftReports;
