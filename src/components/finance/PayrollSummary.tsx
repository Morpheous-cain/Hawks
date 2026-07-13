import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, TrendingUp, Download, AlertTriangle } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface PayrollSummaryProps {
  records: any[];
  clients: any[];
}

export default function PayrollSummary({ records, clients }: PayrollSummaryProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    const fetchData = async () => {
      const [staffRes, attRes, schedRes] = await Promise.all([
        supabase.from("staff").select("id, full_name, department, rank, hourly_rate, daily_rate, monthly_salary"),
        supabase.from("attendance").select("*"),
        supabase.from("schedules").select("*"),
      ]);
      setStaff(staffRes.data || []);
      setAttendance(attRes.data || []);
      setSchedules(schedRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Estimate labour cost per client from schedules + staff rates
  const clientLabourCosts = useMemo(() => {
    return clients.map(client => {
      // Find staff assigned to this client's sites via schedules
      const clientSchedules = schedules.filter(s => s.site?.includes(client.legal_name) || s.client_id === client.id);
      const assignedStaffIds = [...new Set(clientSchedules.map(s => s.staff_id))];
      const assignedStaff = staff.filter(s => assignedStaffIds.includes(s.id));

      // Estimate monthly cost per officer
      const totalLabourCost = assignedStaff.reduce((sum, s) => {
        const monthlySalary = s.monthly_salary || (s.daily_rate ? s.daily_rate * 26 : (s.hourly_rate ? s.hourly_rate * 12 * 26 : 25000));
        return sum + monthlySalary;
      }, 0);

      // Get revenue from this client
      const clientRevenue = records
        .filter(r => r.client_id === client.id && r.payment_status === "paid" && r.document_type !== "expense")
        .reduce((s, r) => s + (r.amount || 0), 0);

      const clientInvoiced = records
        .filter(r => r.client_id === client.id && (r.document_type || "invoice") === "invoice")
        .reduce((s, r) => s + (r.amount || 0), 0);

      const margin = clientInvoiced > 0 ? ((clientInvoiced - totalLabourCost) / clientInvoiced * 100) : 0;

      return {
        client,
        staffCount: assignedStaff.length,
        labourCost: totalLabourCost,
        revenue: clientRevenue,
        invoiced: clientInvoiced,
        margin,
        profit: clientInvoiced - totalLabourCost,
      };
    }).filter(c => c.staffCount > 0 || c.invoiced > 0).sort((a, b) => b.invoiced - a.invoiced);
  }, [clients, staff, schedules, records]);

  const totals = useMemo(() => ({
    staff: clientLabourCosts.reduce((s, c) => s + c.staffCount, 0),
    labour: clientLabourCosts.reduce((s, c) => s + c.labourCost, 0),
    invoiced: clientLabourCosts.reduce((s, c) => s + c.invoiced, 0),
    revenue: clientLabourCosts.reduce((s, c) => s + c.revenue, 0),
    profit: clientLabourCosts.reduce((s, c) => s + c.profit, 0),
  }), [clientLabourCosts]);

  const overallMargin = totals.invoiced > 0 ? (totals.profit / totals.invoiced * 100) : 0;

  const downloadPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    doc.setFontSize(18); doc.setTextColor(30, 58, 95);
    doc.text("PAYROLL INTEGRATION SUMMARY", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Black Hawk SOC-OS — Labour Cost vs Revenue Analysis`, 14, 28);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [["Client", "Officers", "Labour Cost (KES)", "Invoiced (KES)", "Revenue (KES)", "Margin", "Profit (KES)"]],
      body: clientLabourCosts.map(c => [
        c.client.legal_name, c.staffCount.toString(),
        c.labourCost.toLocaleString(), c.invoiced.toLocaleString(),
        c.revenue.toLocaleString(), `${c.margin.toFixed(1)}%`, c.profit.toLocaleString(),
      ]),
      foot: [["TOTAL", totals.staff.toString(), totals.labour.toLocaleString(), totals.invoiced.toLocaleString(), totals.revenue.toLocaleString(), `${overallMargin.toFixed(1)}%`, totals.profit.toLocaleString()]],
      headStyles: { fillColor: [30, 58, 95] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    });

    doc.save(`Payroll-Summary-${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("Payroll Summary downloaded");
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" />Payroll Integration Summary</h3>
        <Button variant="outline" onClick={downloadPDF}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-5">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total Officers</p><p className="text-2xl font-bold">{totals.staff}</p></CardContent></Card>
        <Card className="border-l-4 border-l-destructive"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total Labour Cost</p><p className="text-xl font-bold text-destructive">KES {totals.labour.toLocaleString()}</p></CardContent></Card>
        <Card className="border-l-4 border-l-primary"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total Invoiced</p><p className="text-xl font-bold">KES {totals.invoiced.toLocaleString()}</p></CardContent></Card>
        <Card className="border-l-4 border-l-emerald-500"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Collected Revenue</p><p className="text-xl font-bold text-emerald-600">KES {totals.revenue.toLocaleString()}</p></CardContent></Card>
        <Card className={`border-l-4 ${totals.profit >= 0 ? "border-l-emerald-500" : "border-l-destructive"}`}><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Net Margin</p>
          <p className={`text-xl font-bold ${overallMargin >= 20 ? "text-emerald-600" : overallMargin >= 0 ? "text-amber-600" : "text-destructive"}`}>{overallMargin.toFixed(1)}%</p>
        </CardContent></Card>
      </div>

      {/* Per-Client Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Labour Cost vs Revenue by Client</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead><TableHead className="text-right">Officers</TableHead>
                <TableHead className="text-right">Monthly Labour Cost</TableHead><TableHead className="text-right">Total Invoiced</TableHead>
                <TableHead className="text-right">Revenue Collected</TableHead><TableHead className="text-right">Margin</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientLabourCosts.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No data — assign staff to client sites and create invoices</TableCell></TableRow>
              ) : clientLabourCosts.map(c => (
                <TableRow key={c.client.id} className={c.margin < 10 ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{c.client.legal_name}</TableCell>
                  <TableCell className="text-right">{c.staffCount}</TableCell>
                  <TableCell className="text-right text-destructive font-semibold">KES {c.labourCost.toLocaleString()}</TableCell>
                  <TableCell className="text-right">KES {c.invoiced.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-emerald-600 font-semibold">KES {c.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">{c.margin.toFixed(1)}%</TableCell>
                  <TableCell>
                    {c.margin < 10 ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3" />At Risk</Badge>
                    ) : c.margin < 25 ? (
                      <Badge variant="secondary">Moderate</Badge>
                    ) : (
                      <Badge variant="default">Healthy</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{totals.staff}</TableCell>
                <TableCell className="text-right text-destructive">KES {totals.labour.toLocaleString()}</TableCell>
                <TableCell className="text-right">KES {totals.invoiced.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-600">KES {totals.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">{overallMargin.toFixed(1)}%</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
