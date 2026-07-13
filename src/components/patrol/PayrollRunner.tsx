import { useState, useEffect } from "react";
import { DollarSign, Calendar, Download, FileText, AlertTriangle, CheckCircle, Edit, Clock, Users, TrendingUp, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface PayrollEntry {
  id: string;
  officerId: string;
  officerName: string;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  grossPay: number;
  paye: number;
  nhif: number;
  nssf: number;
  housingLevy: number;
  deductions: number;
  netPay: number;
  exceptions: number;
  status: 'pending' | 'adjusted' | 'approved';
  daysWorked: number;
}

interface PayrollSummary {
  totalOfficers: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  pendingExceptions: number;
  totalPAYE: number;
  totalNHIF: number;
  totalNSSF: number;
  totalHousingLevy: number;
}

// Kenyan tax calculation helpers
const calculatePAYE = (grossPay: number): number => {
  // Simplified PAYE calculation (2024 Kenya rates)
  if (grossPay <= 24000) return 0;
  if (grossPay <= 32333) return (grossPay - 24000) * 0.1;
  if (grossPay <= 500000) return 833.3 + (grossPay - 32333) * 0.25;
  if (grossPay <= 800000) return 117249.75 + (grossPay - 500000) * 0.3;
  return 207249.75 + (grossPay - 800000) * 0.35;
};

const calculateNHIF = (grossPay: number): number => {
  if (grossPay <= 5999) return 150;
  if (grossPay <= 7999) return 300;
  if (grossPay <= 11999) return 400;
  if (grossPay <= 14999) return 500;
  if (grossPay <= 19999) return 600;
  if (grossPay <= 24999) return 750;
  if (grossPay <= 29999) return 850;
  if (grossPay <= 34999) return 900;
  if (grossPay <= 39999) return 950;
  if (grossPay <= 44999) return 1000;
  if (grossPay <= 49999) return 1100;
  if (grossPay <= 59999) return 1200;
  if (grossPay <= 69999) return 1300;
  if (grossPay <= 79999) return 1400;
  if (grossPay <= 89999) return 1500;
  if (grossPay <= 99999) return 1600;
  return 1700;
};

const calculateNSSF = (grossPay: number): number => {
  // Tier I: 6% of first KES 7,000
  // Tier II: 6% of KES 7,001 to KES 36,000
  const tierI = Math.min(grossPay, 7000) * 0.06;
  const tierII = grossPay > 7000 ? Math.min(grossPay - 7000, 29000) * 0.06 : 0;
  return Math.round(tierI + tierII);
};

const calculateHousingLevy = (grossPay: number): number => {
  return Math.round(grossPay * 0.015); // 1.5%
};

const PayrollRunner = () => {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [adjustedHours, setAdjustedHours] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    calculatePayroll();
  }, [selectedPeriod]);

  const calculatePayroll = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedPeriod.split('-').map(Number);
      const periodStart = startOfMonth(new Date(year, month - 1));
      const periodEnd = endOfMonth(periodStart);

      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          id,
          check_in,
          check_out,
          site,
          status,
          shift_type,
          staff:staff_id (
            id,
            full_name
          )
        `)
        .gte('check_in', periodStart.toISOString())
        .lte('check_in', periodEnd.toISOString())
        .order('staff_id');

      if (error) throw error;

      const staffHours: { [key: string]: { 
        name: string; 
        regular: number; 
        overtime: number; 
        night: number;
        exceptions: number;
        daysWorked: Set<string>;
      } } = {};

      (attendanceData || []).forEach((record: any) => {
        const staffId = record.staff?.id || 'unknown';
        const staffName = record.staff?.full_name || 'Unknown';

        if (!staffHours[staffId]) {
          staffHours[staffId] = { name: staffName, regular: 0, overtime: 0, night: 0, exceptions: 0, daysWorked: new Set() };
        }

        if (record.check_in && record.check_out) {
          const checkIn = new Date(record.check_in);
          const checkOut = new Date(record.check_out);
          const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          
          staffHours[staffId].daysWorked.add(format(checkIn, 'yyyy-MM-dd'));
          
          // Calculate night hours (10pm - 6am)
          const checkInHour = checkIn.getHours();
          const checkOutHour = checkOut.getHours();
          let nightHours = 0;
          
          if (checkInHour >= 22 || checkInHour < 6 || checkOutHour >= 22 || checkOutHour < 6) {
            nightHours = Math.min(hours, 8); // Simplified night hour calculation
          }
          
          staffHours[staffId].night += nightHours;
          
          if (hours > 8) {
            staffHours[staffId].regular += 8;
            staffHours[staffId].overtime += hours - 8;
          } else {
            staffHours[staffId].regular += hours;
          }
        }

        if (record.status === 'pending' || record.status === 'rejected') {
          staffHours[staffId].exceptions++;
        }
      });

      // Convert to payroll entries (using sample hourly rates)
      const hourlyRate = 500; // KES per hour
      const overtimeMultiplier = 1.5;
      const nightDifferential = 1.25;

      const payrollEntries: PayrollEntry[] = Object.entries(staffHours).map(([id, data], index) => {
        const regularPay = data.regular * hourlyRate;
        const overtimePay = data.overtime * hourlyRate * overtimeMultiplier;
        const nightPay = data.night * hourlyRate * (nightDifferential - 1); // Additional night pay
        const gross = regularPay + overtimePay + nightPay;
        
        const paye = calculatePAYE(gross);
        const nhif = calculateNHIF(gross);
        const nssf = calculateNSSF(gross);
        const housingLevy = calculateHousingLevy(gross);
        const totalDeductions = paye + nhif + nssf + housingLevy;

        return {
          id: `payroll-${index}`,
          officerId: id,
          officerName: data.name,
          regularHours: Math.round(data.regular * 100) / 100,
          overtimeHours: Math.round(data.overtime * 100) / 100,
          nightHours: Math.round(data.night * 100) / 100,
          grossPay: Math.round(gross),
          paye: Math.round(paye),
          nhif,
          nssf,
          housingLevy,
          deductions: Math.round(totalDeductions),
          netPay: Math.round(gross - totalDeductions),
          exceptions: data.exceptions,
          status: data.exceptions > 0 ? 'pending' : 'approved',
          daysWorked: data.daysWorked.size
        };
      });

      setEntries(payrollEntries);
    } catch (error) {
      console.error("Error calculating payroll:", error);
      toast.error("Failed to calculate payroll");
    } finally {
      setLoading(false);
    }
  };

  const summary: PayrollSummary = entries.reduce((acc, entry) => ({
    totalOfficers: acc.totalOfficers + 1,
    totalRegularHours: acc.totalRegularHours + entry.regularHours,
    totalOvertimeHours: acc.totalOvertimeHours + entry.overtimeHours,
    totalGrossPay: acc.totalGrossPay + entry.grossPay,
    totalDeductions: acc.totalDeductions + entry.deductions,
    totalNetPay: acc.totalNetPay + entry.netPay,
    pendingExceptions: acc.pendingExceptions + entry.exceptions,
    totalPAYE: acc.totalPAYE + entry.paye,
    totalNHIF: acc.totalNHIF + entry.nhif,
    totalNSSF: acc.totalNSSF + entry.nssf,
    totalHousingLevy: acc.totalHousingLevy + entry.housingLevy
  }), {
    totalOfficers: 0,
    totalRegularHours: 0,
    totalOvertimeHours: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    pendingExceptions: 0,
    totalPAYE: 0,
    totalNHIF: 0,
    totalNSSF: 0,
    totalHousingLevy: 0
  });

  const handleAdjust = (entry: PayrollEntry) => {
    setSelectedEntry(entry);
    setAdjustedHours(entry.regularHours.toString());
    setAdjustmentNote("");
    setShowAdjustDialog(true);
  };

  const submitAdjustment = () => {
    if (!selectedEntry || !adjustmentNote.trim()) return;

    setEntries(entries.map(e => 
      e.id === selectedEntry.id
        ? { ...e, regularHours: parseFloat(adjustedHours) || e.regularHours, status: 'adjusted' as const }
        : e
    ));

    toast.success("Payroll entry adjusted");
    setShowAdjustDialog(false);
  };

  const exportPayroll = (exportFormat: 'csv' | 'pdf') => {
    if (exportFormat === 'csv') {
      const headers = ['Officer Name', 'Days Worked', 'Regular Hours', 'OT Hours', 'Gross Pay', 'PAYE', 'NHIF', 'NSSF', 'Housing Levy', 'Net Pay'];
      const rows = entries.map(e => [
        e.officerName,
        e.daysWorked,
        e.regularHours.toFixed(1),
        e.overtimeHours.toFixed(1),
        e.grossPay,
        e.paye,
        e.nhif,
        e.nssf,
        e.housingLevy,
        e.netPay
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${selectedPeriod}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Payroll exported as CSV');
    } else {
      toast.success(`Exporting payroll as ${exportFormat.toUpperCase()}...`);
    }
  };

  const approvePayroll = () => {
    if (summary.pendingExceptions > 0) {
      toast.error("Cannot approve payroll with pending exceptions");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setEntries(entries.map(e => ({ ...e, status: 'approved' as const })));
      toast.success("Payroll approved and processed");
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payroll Processing
          </h2>
          <p className="text-muted-foreground text-sm">Calculate and process attendance-based payroll with Kenyan tax compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = format(date, 'yyyy-MM');
                return (
                  <SelectItem key={value} value={value}>
                    {format(date, 'MMM yyyy')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => calculatePayroll()}>
            <Calculator className="h-4 w-4 mr-1" />
            Recalculate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Employee Details</TabsTrigger>
          <TabsTrigger value="statutory">Statutory Deductions</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Officers</p>
                    <p className="text-xl font-bold">{summary.totalOfficers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Regular Hours</p>
                <p className="text-xl font-bold">{summary.totalRegularHours.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Overtime Hours</p>
                <p className="text-xl font-bold text-amber-600">{summary.totalOvertimeHours.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Gross Pay</p>
                <p className="text-xl font-bold">KES {summary.totalGrossPay.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Deductions</p>
                <p className="text-xl font-bold text-red-500">-{summary.totalDeductions.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Net Pay</p>
                <p className="text-xl font-bold text-green-600">KES {summary.totalNetPay.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Exceptions Warning */}
          {summary.pendingExceptions > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/10 mb-4">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-semibold">{summary.pendingExceptions} pending exception(s)</p>
                    <p className="text-sm text-muted-foreground">
                      Resolve all exceptions before approving payroll
                    </p>
                  </div>
                  <Button variant="outline" size="sm">View Exceptions</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details">
          {/* Payroll Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Payroll Preview</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportPayroll('csv')}>
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPayroll('pdf')}>
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Officer</TableHead>
                        <TableHead className="text-right">Days</TableHead>
                        <TableHead className="text-right">Reg Hrs</TableHead>
                        <TableHead className="text-right">OT Hrs</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                            No payroll data for this period
                          </TableCell>
                        </TableRow>
                      ) : (
                        entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.officerName}</TableCell>
                            <TableCell className="text-right">{entry.daysWorked}</TableCell>
                            <TableCell className="text-right">{entry.regularHours.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{entry.overtimeHours.toFixed(1)}</TableCell>
                            <TableCell className="text-right">KES {entry.grossPay.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-red-500">-{entry.deductions.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">KES {entry.netPay.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={
                                entry.status === 'approved' ? 'default' :
                                entry.status === 'adjusted' ? 'secondary' : 'outline'
                              }>
                                {entry.status}
                                {entry.exceptions > 0 && ` (${entry.exceptions})`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleAdjust(entry)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statutory">
          {/* Statutory Deductions Summary */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statutory Deductions Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total PAYE</span>
                  <span className="font-semibold">KES {summary.totalPAYE.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total NHIF</span>
                  <span className="font-semibold">KES {summary.totalNHIF.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total NSSF</span>
                  <span className="font-semibold">KES {summary.totalNSSF.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Housing Levy</span>
                  <span className="font-semibold">KES {summary.totalHousingLevy.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Total Statutory</span>
                  <span className="text-red-600">KES {summary.totalDeductions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payroll Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Gross Pay</span>
                  <span className="font-semibold">KES {summary.totalGrossPay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Deductions</span>
                  <span className="font-semibold text-red-600">-KES {summary.totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Total Net Payable</span>
                  <span className="text-green-600">KES {summary.totalNetPay.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Save Draft</Button>
        <Button
          onClick={approvePayroll}
          disabled={summary.pendingExceptions > 0 || processing}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve & Process Payroll
        </Button>
      </div>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Payroll Entry</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Officer</Label>
                <p className="font-medium">{selectedEntry.officerName}</p>
              </div>
              <div>
                <Label htmlFor="hours">Regular Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  value={adjustedHours}
                  onChange={(e) => setAdjustedHours(e.target.value)}
                  step="0.5"
                />
              </div>
              <div>
                <Label htmlFor="note">Adjustment Note (required for audit)</Label>
                <Textarea
                  id="note"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder="Reason for adjustment..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdjustment} disabled={!adjustmentNote.trim()}>
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollRunner;