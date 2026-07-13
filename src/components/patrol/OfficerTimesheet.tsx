import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";

interface AttendanceRecord {
  id: string;
  check_in: string;
  check_out: string | null;
  site: string;
  status: string | null;
  notes: string | null;
  shift_type: string | null;
}

interface DailySummary {
  date: string;
  hoursWorked: number;
  overtime: number;
  status: 'complete' | 'incomplete' | 'pending' | 'exception';
}

const OfficerTimesheet = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    fetchAttendance();
  }, [weekStart]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('staff_id', user.user.id)
        .gte('check_in', weekStart.toISOString())
        .lte('check_in', weekEnd.toISOString())
        .order('check_in', { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (checkIn: string, checkOut: string | null): number => {
    if (!checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const getWeekDays = () => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getDailySummary = (date: Date): DailySummary => {
    const dayRecords = attendance.filter(a => {
      const recordDate = parseISO(a.check_in);
      return format(recordDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });

    const totalHours = dayRecords.reduce((sum, record) => {
      return sum + calculateHours(record.check_in, record.check_out);
    }, 0);

    const hasException = dayRecords.some(r => r.status === 'rejected' || r.status === 'pending');
    const hasIncomplete = dayRecords.some(r => !r.check_out);

    return {
      date: format(date, 'yyyy-MM-dd'),
      hoursWorked: totalHours,
      overtime: Math.max(0, totalHours - 8),
      status: hasException ? 'exception' : hasIncomplete ? 'incomplete' : totalHours > 0 ? 'complete' : 'pending'
    };
  };

  const totalWeeklyHours = attendance.reduce((sum, record) => {
    return sum + calculateHours(record.check_in, record.check_out);
  }, 0);

  const totalOvertimeHours = Math.max(0, totalWeeklyHours - 40);
  const pendingExceptions = attendance.filter(a => a.status === 'pending' || a.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Weekly Hours</p>
                <p className="text-2xl font-bold">{totalWeeklyHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Overtime</p>
                <p className="text-2xl font-bold">{totalOvertimeHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pending Exceptions</p>
                <p className="text-2xl font-bold">{pendingExceptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Payslip</p>
                <Button variant="link" className="p-0 h-auto text-primary">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timesheet
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
              >
                Previous Week
              </Button>
              <span className="text-sm font-medium px-3">
                {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
              >
                Next Week
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'daily' | 'weekly')}>
            <TabsList className="mb-4">
              <TabsTrigger value="daily">Daily View</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No attendance records for this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(parseISO(record.check_in), 'EEE, MMM d')}</TableCell>
                          <TableCell>{record.site}</TableCell>
                          <TableCell>{format(parseISO(record.check_in), 'HH:mm')}</TableCell>
                          <TableCell>
                            {record.check_out ? format(parseISO(record.check_out), 'HH:mm') : '-'}
                          </TableCell>
                          <TableCell>
                            {calculateHours(record.check_in, record.check_out).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'verified' ? 'default' :
                              record.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {record.status || 'pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="weekly">
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day) => {
                  const summary = getDailySummary(day);
                  return (
                    <Card key={day.toISOString()} className={`
                      ${summary.status === 'complete' ? 'border-green-500/50 bg-green-500/5' : ''}
                      ${summary.status === 'exception' ? 'border-red-500/50 bg-red-500/5' : ''}
                      ${summary.status === 'incomplete' ? 'border-amber-500/50 bg-amber-500/5' : ''}
                    `}>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                        <p className="font-semibold">{format(day, 'd')}</p>
                        <p className="text-lg font-bold mt-2">{summary.hoursWorked.toFixed(1)}h</p>
                        {summary.overtime > 0 && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            +{summary.overtime.toFixed(1)} OT
                          </Badge>
                        )}
                        {summary.status === 'exception' && (
                          <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mt-1" />
                        )}
                        {summary.status === 'complete' && (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pending Exceptions Notice */}
      {pendingExceptions > 0 && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <div className="flex-1">
                <p className="font-semibold">You have {pendingExceptions} pending exception(s)</p>
                <p className="text-sm text-muted-foreground">
                  These require supervisor verification before payroll processing
                </p>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfficerTimesheet;
