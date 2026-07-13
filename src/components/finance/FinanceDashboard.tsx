import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, BarChart3, Wallet } from "lucide-react";
import StatsCard from "@/components/StatsCard";

interface FinanceDashboardProps {
  records: any[];
  budgets: any[];
  deposits: any[];
  currencyRates: any[];
}

export default function FinanceDashboard({ records, budgets, deposits, currencyRates }: FinanceDashboardProps) {
  const invoices = records.filter(r => (r.document_type || "invoice") === "invoice");
  const expenses = records.filter(r => r.document_type === "expense");
  const payments = records.filter(r => r.document_type === "payment");

  const totalRevenue = invoices.filter(i => i.payment_status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalOutstanding = invoices.filter(i => i.payment_status !== "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.payment_status === "overdue").reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalBudgetAllocated = budgets.reduce((s, b) => s + (b.allocated_amount || 0), 0);
  const totalBudgetSpent = budgets.reduce((s, b) => s + (b.spent_amount || 0), 0);
  const totalDeposits = deposits.filter(d => d.status === "active").reduce((s, d) => s + (d.balance || 0), 0);

  const collectionRate = invoices.length > 0 ? ((invoices.filter(i => i.payment_status === "paid").length / invoices.length) * 100).toFixed(1) : "0";

  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; expenses: number }> = {};
    invoices.filter(i => i.payment_status === "paid").forEach(inv => {
      const m = inv.invoice_date?.substring(0, 7) || "unknown";
      if (!months[m]) months[m] = { revenue: 0, expenses: 0 };
      months[m].revenue += inv.amount || 0;
    });
    expenses.forEach(exp => {
      const m = exp.invoice_date?.substring(0, 7) || "unknown";
      if (!months[m]) months[m] = { revenue: 0, expenses: 0 };
      months[m].expenses += exp.amount || 0;
    });
    return Object.entries(months).sort().slice(-6);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={DollarSign} trend={`${collectionRate}% collection rate`} />
        <StatsCard title="Outstanding" value={`KES ${totalOutstanding.toLocaleString()}`} icon={Clock} trend={totalOverdue > 0 ? `KES ${totalOverdue.toLocaleString()} overdue` : "No overdue"} />
        <StatsCard title="Net Profit" value={`KES ${netProfit.toLocaleString()}`} icon={netProfit >= 0 ? TrendingUp : TrendingDown} trend={`Expenses: KES ${totalExpenses.toLocaleString()}`} />
        <StatsCard title="Client Deposits" value={`KES ${totalDeposits.toLocaleString()}`} icon={Wallet} trend={`${deposits.filter(d => d.status === "active").length} active retainers`} />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Budget Utilization */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBudgetAllocated > 0 ? ((totalBudgetSpent / totalBudgetAllocated) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              KES {totalBudgetSpent.toLocaleString()} / KES {totalBudgetAllocated.toLocaleString()}
            </p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, totalBudgetAllocated > 0 ? (totalBudgetSpent / totalBudgetAllocated) * 100 : 0)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Overdue Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {invoices.filter(i => i.payment_status === "overdue").length}
            </div>
            <div className="mt-2 space-y-1">
              {invoices.filter(i => i.payment_status === "overdue").slice(0, 3).map(inv => (
                <div key={inv.id} className="flex justify-between text-xs">
                  <span className="truncate">{inv.clients?.legal_name || "N/A"}</span>
                  <span className="text-destructive font-medium">KES {(inv.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Currency Rates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Exchange Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currencyRates.map(r => (
                <div key={r.id} className="flex justify-between text-sm">
                  <span>{r.from_currency} → {r.to_currency}</span>
                  <span className="font-mono font-medium">{Number(r.rate).toFixed(2)}</span>
                </div>
              ))}
              {currencyRates.length === 0 && <p className="text-xs text-muted-foreground">No rates configured</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly Revenue vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monthlyData.map(([month, data]) => (
              <div key={month} className="flex items-center gap-4 text-sm">
                <span className="w-20 text-muted-foreground font-mono">{month}</span>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400">Revenue</span>
                      <span>KES {data.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (data.revenue / Math.max(data.revenue, data.expenses, 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-orange-400">Expenses</span>
                      <span>KES {data.expenses.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (data.expenses / Math.max(data.revenue, data.expenses, 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {monthlyData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
