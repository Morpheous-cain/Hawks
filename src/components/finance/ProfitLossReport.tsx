import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface ProfitLossReportProps {
  records: any[];
  clients?: any[];
}

export default function ProfitLossReport({ records }: ProfitLossReportProps) {
  const [period, setPeriod] = useState("3"); // months
  const [view, setView] = useState<"summary" | "breakdown">("summary");

  const periodMonths = parseInt(period);
  const now = new Date();

  const monthlyData = useMemo(() => {
    const months: { key: string; label: string; start: Date; end: Date }[] = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({
        key: format(d, "yyyy-MM"),
        label: format(d, "MMM yyyy"),
        start: startOfMonth(d),
        end: endOfMonth(d),
      });
    }

    return months.map(m => {
      const inRange = records.filter(r => {
        const rd = new Date(r.invoice_date);
        return isWithinInterval(rd, { start: m.start, end: m.end });
      });

      const revenue = inRange
        .filter(r => ["invoice", "payment"].includes(r.document_type || "invoice") && r.payment_status === "paid")
        .reduce((s, r) => s + (r.amount || 0), 0);

      const expenses = inRange
        .filter(r => r.document_type === "expense")
        .reduce((s, r) => s + (r.amount || 0), 0);

      const taxCollected = inRange
        .filter(r => r.document_type !== "expense" && r.payment_status === "paid")
        .reduce((s, r) => s + (r.tax_amount || 0), 0);

      const outstanding = inRange
        .filter(r => (r.document_type || "invoice") === "invoice" && r.payment_status !== "paid")
        .reduce((s, r) => s + (r.amount || 0), 0);

      return { ...m, revenue, expenses, taxCollected, outstanding, profit: revenue - expenses, margin: revenue > 0 ? ((revenue - expenses) / revenue * 100) : 0 };
    });
  }, [records, periodMonths]);

  const totals = useMemo(() => {
    const r = monthlyData.reduce((acc, m) => ({
      revenue: acc.revenue + m.revenue,
      expenses: acc.expenses + m.expenses,
      tax: acc.tax + m.taxCollected,
      outstanding: acc.outstanding + m.outstanding,
    }), { revenue: 0, expenses: 0, tax: 0, outstanding: 0 });
    return { ...r, profit: r.revenue - r.expenses, margin: r.revenue > 0 ? (r.revenue - r.expenses) / r.revenue * 100 : 0 };
  }, [monthlyData]);

  const revenueBreakdown = useMemo(() => {
    const categoryMap: Record<string, { revenue: number; count: number }> = {};
    const periodStart = startOfMonth(subMonths(now, periodMonths - 1));
    records
      .filter(r => r.document_type !== "expense" && r.payment_status === "paid" && new Date(r.invoice_date) >= periodStart)
      .forEach(r => {
        const cat = r.category || r.description || "Uncategorised";
        const label = cat.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        if (!categoryMap[label]) categoryMap[label] = { revenue: 0, count: 0 };
        categoryMap[label].revenue += r.amount || 0;
        categoryMap[label].count += 1;
      });
    return Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [records, periodMonths]);

  const expenseBreakdown = useMemo(() => {
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    const periodStart = startOfMonth(subMonths(now, periodMonths - 1));
    records
      .filter(r => r.document_type === "expense" && new Date(r.invoice_date) >= periodStart)
      .forEach(r => {
        const cat = r.category || r.description || "Uncategorised";
        const label = cat.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        if (!categoryMap[label]) categoryMap[label] = { amount: 0, count: 0 };
        categoryMap[label].amount += r.amount || 0;
        categoryMap[label].count += 1;
      });
    return Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [records, periodMonths]);

  const downloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(18); doc.setTextColor(30, 58, 95);
    doc.text("PROFIT & LOSS STATEMENT", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Black Hawk SOC-OS — ${monthlyData[0]?.label} to ${monthlyData[monthlyData.length - 1]?.label}`, 14, 28);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [["Month", "Revenue (KES)", "Expenses (KES)", "Net Profit (KES)", "Margin %"]],
      body: monthlyData.map(m => [m.label, m.revenue.toLocaleString(), m.expenses.toLocaleString(), m.profit.toLocaleString(), `${m.margin.toFixed(1)}%`]),
      foot: [["TOTAL", totals.revenue.toLocaleString(), totals.expenses.toLocaleString(), totals.profit.toLocaleString(), `${totals.margin.toFixed(1)}%`]],
      headStyles: { fillColor: [30, 58, 95] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    });

    doc.save(`PnL-${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("P&L Report downloaded");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Profit & Loss Report</h3>
        <div className="flex gap-2">
          <Select value={view} onValueChange={(v: "summary" | "breakdown") => setView(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Monthly Summary</SelectItem>
              <SelectItem value="breakdown">Revenue & Expense Breakdown</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={downloadPDF}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-5">
        <Card className="border-l-4 border-l-emerald-500"><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Revenue (Paid)</p>
          <p className="text-xl font-bold text-emerald-600">KES {totals.revenue.toLocaleString()}</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-destructive"><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-xl font-bold text-destructive">KES {totals.expenses.toLocaleString()}</p>
        </CardContent></Card>
        <Card className={`border-l-4 ${totals.profit >= 0 ? "border-l-emerald-500" : "border-l-destructive"}`}><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <p className={`text-xl font-bold ${totals.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>KES {totals.profit.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Margin</p>
          <p className="text-xl font-bold">{totals.margin.toFixed(1)}%</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-xl font-bold text-amber-600">KES {totals.outstanding.toLocaleString()}</p>
        </CardContent></Card>
      </div>

      {view === "summary" ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead><TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead><TableHead className="text-right">Tax Collected</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead><TableHead className="text-right">Margin</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((m, i) => {
                  const prev = i > 0 ? monthlyData[i - 1] : null;
                  const trending = prev ? m.profit > prev.profit : true;
                  return (
                    <TableRow key={m.key}>
                      <TableCell className="font-medium">{m.label}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">KES {m.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-destructive">KES {m.expenses.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-muted-foreground">KES {m.taxCollected.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-bold ${m.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>KES {m.profit.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{m.margin.toFixed(1)}%</TableCell>
                      <TableCell>{trending ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right text-emerald-600">KES {totals.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-destructive">KES {totals.expenses.toLocaleString()}</TableCell>
                  <TableCell className="text-right">KES {totals.tax.toLocaleString()}</TableCell>
                  <TableCell className={`text-right ${totals.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>KES {totals.profit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{totals.margin.toFixed(1)}%</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Category</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead><TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead><TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueBreakdown.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No revenue data</TableCell></TableRow>
                ) : revenueBreakdown.map(r => (
                  <TableRow key={r.category}>
                    <TableCell className="font-medium">{r.category}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">KES {r.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{totals.revenue > 0 ? (r.revenue / totals.revenue * 100).toFixed(1) : 0}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead><TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Expense</TableHead><TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseBreakdown.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No expense data</TableCell></TableRow>
                ) : expenseBreakdown.map(e => (
                  <TableRow key={e.category}>
                    <TableCell className="font-medium">{e.category}</TableCell>
                    <TableCell className="text-right">{e.count}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">KES {e.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{totals.expenses > 0 ? (e.amount / totals.expenses * 100).toFixed(1) : 0}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
