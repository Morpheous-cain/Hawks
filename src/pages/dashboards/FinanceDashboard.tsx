import { useEffect, useState, useMemo } from "react";
import {
  Wallet, Receipt, FileText, AlertTriangle, ShieldCheck, BarChart3, Banknote,
  TrendingUp, TrendingDown, Building2, Users, Coins, Landmark, Clock,
  ArrowUpRight, ArrowDownRight, PieChart, Calculator, Repeat, BellRing,
  ScrollText, Activity, Calendar, Target, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader, KpiGrid, KpiTile, Panel, QuickLink, ListRow, EmptyState, StatusBadge } from "@/components/dashboards/DashboardKit";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";

const fmt = (n: number) => `KES ${Math.round(n).toLocaleString()}`;
const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${Math.round(n)}`;
};

interface Snap {
  clients: any[];
  contracts: any[];
  invoices: any[];
  deposits: any[];
  budgets: any[];
  taxes: any[];
  bank: any[];
  rates: any[];
  audit: any[];
  reminders: any[];
  loss: any[];
  rules: any[];
}

const empty: Snap = {
  clients: [], contracts: [], invoices: [], deposits: [], budgets: [],
  taxes: [], bank: [], rates: [], audit: [], reminders: [], loss: [], rules: [],
};

const FinanceDashboard = () => {
  const [data, setData] = useState<Snap>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [
        clients, contracts, invoices, deposits, budgets, taxes,
        bank, rates, audit, reminders, loss, rules,
      ] = await Promise.all([
        supabase.from("clients").select("id, legal_name, sector, status, annual_value").limit(500),
        supabase.from("contracts").select("*").limit(500),
        supabase.from("recurring_invoices").select("*, clients(legal_name)").order("next_invoice_date", { ascending: true }).limit(200),
        supabase.from("client_deposits").select("*, clients(legal_name)").order("received_date", { ascending: false }).limit(200),
        supabase.from("budgets").select("*").order("period_end", { ascending: true }).limit(100),
        supabase.from("tax_records").select("*").order("period_end", { ascending: false }).limit(100),
        supabase.from("bank_reconciliation").select("*").order("bank_date", { ascending: false }).limit(100),
        supabase.from("currency_rates").select("*").order("effective_date", { ascending: false }).limit(20),
        supabase.from("finance_audit_trail").select("*").order("changed_at", { ascending: false }).limit(20),
        supabase.from("payment_reminders").select("*, clients(legal_name)").order("created_at", { ascending: false }).limit(20),
        supabase.from("loss_control_records").select("*").in("status", ["open", "investigating"]).limit(50),
        supabase.from("contract_billing_rules").select("*").eq("is_active", true).limit(50),
      ]);
      if (!alive) return;
      setData({
        clients: clients.data ?? [],
        contracts: contracts.data ?? [],
        invoices: invoices.data ?? [],
        deposits: deposits.data ?? [],
        budgets: budgets.data ?? [],
        taxes: taxes.data ?? [],
        bank: bank.data ?? [],
        rates: rates.data ?? [],
        audit: audit.data ?? [],
        reminders: reminders.data ?? [],
        loss: loss.data ?? [],
        rules: rules.data ?? [],
      });
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel("finance_dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_invoices" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_deposits" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tax_records" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_reconciliation" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, load)
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const m = useMemo(() => {
    const arr = data.invoices;
    const monthlyBilled = arr.filter(i => i.is_active && i.frequency === "monthly").reduce((s, i) => s + Number(i.amount || 0), 0);
    const quarterlyBilled = arr.filter(i => i.is_active && i.frequency === "quarterly").reduce((s, i) => s + Number(i.amount || 0), 0);
    const annualBilled = arr.filter(i => i.is_active && i.frequency === "annual").reduce((s, i) => s + Number(i.amount || 0), 0);
    const arr_vat = arr.reduce((s, i) => s + Number(i.tax_amount || 0), 0);
    const mrr = monthlyBilled + (quarterlyBilled / 3) + (annualBilled / 12);
    const arr_total = mrr * 12;

    const depositBalance = data.deposits.filter(d => d.status === "active").reduce((s, d) => s + Number(d.balance || 0), 0);
    const depositApplied = data.deposits.reduce((s, d) => s + Number(d.applied_amount || 0), 0);

    const allocated = data.budgets.reduce((s, b) => s + Number(b.allocated_amount || 0), 0);
    const spent = data.budgets.reduce((s, b) => s + Number(b.spent_amount || 0), 0);
    const burnPct = allocated > 0 ? (spent / allocated) * 100 : 0;

    const taxOutstanding = data.taxes.filter(t => t.filing_status !== "paid").reduce((s, t) => s + Number(t.tax_amount || 0), 0);
    const taxPaidYTD = data.taxes.filter(t => t.filing_status === "paid").reduce((s, t) => s + Number(t.tax_amount || 0), 0);
    const taxesPending = data.taxes.filter(t => t.filing_status === "pending").length;

    const bankMatched = data.bank.filter(b => b.match_status === "matched").length;
    const bankTotal = data.bank.length;
    const matchRate = bankTotal > 0 ? (bankMatched / bankTotal) * 100 : 0;
    const bankUnmatchedAmount = data.bank.filter(b => b.match_status !== "matched").reduce((s, b) => s + Number(b.bank_amount || 0), 0);

    const activeContractsValue = data.contracts.filter(c => c.status === "active").reduce((s, c) => s + Number(c.value || 0), 0);

    // AR aging buckets (synthetic from next_invoice_date)
    const today = new Date();
    const aging = { current: 0, "30": 0, "60": 0, "90": 0 };
    data.invoices.forEach(i => {
      const d = new Date(i.next_invoice_date || i.created_at);
      const days = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const amt = Number(i.amount || 0);
      if (days <= 0) aging.current += amt;
      else if (days <= 30) aging["30"] += amt;
      else if (days <= 60) aging["60"] += amt;
      else aging["90"] += amt;
    });
    const totalAR = aging.current + aging["30"] + aging["60"] + aging["90"];

    // Top clients by recurring billing
    const clientTotals = new Map<string, { name: string; amount: number }>();
    data.invoices.forEach(i => {
      const name = i.clients?.legal_name || "Unknown";
      const cur = clientTotals.get(name) || { name, amount: 0 };
      cur.amount += Number(i.amount || 0);
      clientTotals.set(name, cur);
    });
    const topClients = Array.from(clientTotals.values()).sort((a, b) => b.amount - a.amount).slice(0, 5);

    return {
      monthlyBilled, quarterlyBilled, annualBilled, mrr, arr_total, arr_vat,
      depositBalance, depositApplied,
      allocated, spent, burnPct,
      taxOutstanding, taxPaidYTD, taxesPending,
      bankMatched, bankTotal, matchRate, bankUnmatchedAmount,
      activeContractsValue, aging, totalAR, topClients,
    };
  }, [data]);

  const upcomingInvoices = data.invoices.filter(i => i.is_active).slice(0, 6);
  const recentDeposits = data.deposits.slice(0, 5);
  const pendingTaxes = data.taxes.filter(t => t.filing_status !== "paid").slice(0, 5);
  const unmatchedBank = data.bank.filter(b => b.match_status !== "matched").slice(0, 5);

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Finance Command"
        title="Finance Operations Cockpit"
        description="Monthly recurring revenue, AR aging, budget burn, statutory deadlines, bank reconciliation and audit trail — live."
        icon={Wallet}
        gradient="from-emerald-500 to-green-600"
      >
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
          <Activity className="mr-1 h-3 w-3" /> Live · {data.audit.length > 0 ? formatDistanceToNow(new Date(data.audit[0].changed_at), { addSuffix: true }) : "—"}
        </Badge>
      </DashboardHeader>

      {/* Headline KPIs — financial health */}
      <KpiGrid cols={4}>
        <KpiTile label="Monthly Recurring Revenue" value={fmtShort(m.mrr)} hint={`ARR ${fmtShort(m.arr_total)}`} loading={loading} icon={TrendingUp} tone="good" />
        <KpiTile label="Total AR Outstanding" value={fmtShort(m.totalAR)} hint={`${data.invoices.filter(i=>i.is_active).length} open schedules`} loading={loading} icon={Receipt} tone={m.aging["90"] > 0 ? "warn" : "default"} />
        <KpiTile label="Client Deposits Held" value={fmtShort(m.depositBalance)} hint={`${data.deposits.filter(d=>d.status==="active").length} active retainers`} loading={loading} icon={Coins} />
        <KpiTile label="Contract Book Value" value={fmtShort(m.activeContractsValue)} hint={`${data.contracts.filter(c=>c.status==="active").length} live contracts`} loading={loading} icon={FileText} />
      </KpiGrid>

      {/* Operational KPIs */}
      <KpiGrid cols={6}>
        <KpiTile label="Budget Allocated" value={fmtShort(m.allocated)} loading={loading} icon={Target} />
        <KpiTile label="Budget Spent" value={fmtShort(m.spent)} hint={`${m.burnPct.toFixed(0)}% burn`} loading={loading} tone={m.burnPct > 85 ? "warn" : "default"} icon={TrendingDown} />
        <KpiTile label="Tax Outstanding" value={fmtShort(m.taxOutstanding)} hint={`${m.taxesPending} pending filings`} loading={loading} tone={m.taxOutstanding > 0 ? "warn" : "good"} icon={Banknote} />
        <KpiTile label="Tax Paid YTD" value={fmtShort(m.taxPaidYTD)} loading={loading} icon={CheckCircle2} tone="good" />
        <KpiTile label="Bank Match Rate" value={`${m.matchRate.toFixed(0)}%`} hint={`${m.bankMatched}/${m.bankTotal} reconciled`} loading={loading} tone={m.matchRate > 80 ? "good" : "warn"} icon={Landmark} />
        <KpiTile label="Open Loss Cases" value={data.loss.length} loading={loading} tone={data.loss.length ? "warn" : "good"} icon={AlertTriangle} />
      </KpiGrid>

      {/* AR Aging + Budget Burn + Tax */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="AR Aging">
          <div className="space-y-3">
            {[
              { k: "current", label: "Current (not due)", v: m.aging.current, tone: "bg-emerald-500" },
              { k: "30", label: "1–30 days", v: m.aging["30"], tone: "bg-blue-500" },
              { k: "60", label: "31–60 days", v: m.aging["60"], tone: "bg-amber-500" },
              { k: "90", label: "60+ days overdue", v: m.aging["90"], tone: "bg-red-500" },
            ].map(b => {
              const pct = m.totalAR > 0 ? (b.v / m.totalAR) * 100 : 0;
              return (
                <div key={b.k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">{b.label}</span>
                    <span className="font-mono tabular-nums">{fmtShort(b.v)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${b.tone} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 mt-2 border-t flex justify-between text-sm">
              <span className="font-medium">Total AR</span>
              <span className="font-mono font-bold">{fmt(m.totalAR)}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Budget Burn by Department">
          <div className="space-y-2.5">
            {data.budgets.slice(0, 6).map(b => {
              const pct = Number(b.allocated_amount) > 0 ? (Number(b.spent_amount) / Number(b.allocated_amount)) * 100 : 0;
              const tone = pct > 90 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate text-text-muted">{b.name}</span>
                    <span className="font-mono tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="text-2xs text-text-dim mt-0.5">{fmtShort(Number(b.spent_amount))} of {fmtShort(Number(b.allocated_amount))}</div>
                </div>
              );
            })}
            {data.budgets.length === 0 && <EmptyState message="No budgets configured." />}
          </div>
        </Panel>

        <Panel title="Statutory Tax Calendar">
          {pendingTaxes.length === 0 ? (
            <EmptyState message="All taxes filed and paid." />
          ) : (
            <div className="space-y-2">
              {pendingTaxes.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-border p-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{t.tax_type}</div>
                    <div className="text-2xs text-text-muted">Period {t.period_start} → {t.period_end}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums">{fmtShort(Number(t.tax_amount))}</div>
                    <StatusBadge status={t.filing_status} tone={t.filing_status === "filed" ? "info" : "warn"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Top clients + Bank recon + FX */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Top Revenue Clients">
          {m.topClients.length === 0 ? <EmptyState message="No client revenue yet." /> : (
            <div className="space-y-2">
              {m.topClients.map((c, i) => {
                const max = m.topClients[0].amount || 1;
                const pct = (c.amount / max) * 100;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate"><span className="text-text-dim mr-2">#{i + 1}</span>{c.name}</span>
                      <span className="font-mono tabular-nums">{fmtShort(c.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-green-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Unmatched Bank Entries">
          {unmatchedBank.length === 0 ? <EmptyState message="All bank entries reconciled." /> : (
            <div className="space-y-1">
              {unmatchedBank.map(b => (
                <ListRow
                  key={b.id}
                  primary={b.bank_description || "Bank entry"}
                  secondary={`${b.bank_reference ?? "—"} · ${b.bank_date}`}
                  trailing={<span className="font-mono text-sm tabular-nums text-amber-500">{fmtShort(Number(b.bank_amount))}</span>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="FX Rates (CBK)">
          <div className="space-y-1.5">
            {data.rates.slice(0, 6).map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-surface-2">
                <div className="text-sm font-medium">{r.from_currency} → {r.to_currency}</div>
                <div className="text-right">
                  <div className="font-mono text-sm tabular-nums">{Number(r.rate).toFixed(2)}</div>
                  <div className="text-2xs text-text-dim">{r.source ?? "—"}</div>
                </div>
              </div>
            ))}
            {data.rates.length === 0 && <EmptyState message="No FX rates configured." />}
          </div>
        </Panel>
      </div>

      {/* Upcoming invoices + Recent deposits + Audit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Upcoming Invoice Schedules">
          {upcomingInvoices.length === 0 ? <EmptyState message="No upcoming invoices." /> : (
            <div className="space-y-1">
              {upcomingInvoices.map(i => (
                <ListRow
                  key={i.id}
                  primary={i.clients?.legal_name || i.description || "Invoice"}
                  secondary={`${i.frequency ?? "—"} · due ${i.next_invoice_date ? format(new Date(i.next_invoice_date), "dd MMM") : "—"}`}
                  trailing={<span className="font-mono text-sm tabular-nums">{fmtShort(Number(i.amount))}</span>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Client Deposits">
          {recentDeposits.length === 0 ? <EmptyState message="No deposits recorded." /> : (
            <div className="space-y-1">
              {recentDeposits.map(d => (
                <ListRow
                  key={d.id}
                  primary={d.clients?.legal_name || "Client"}
                  secondary={`${d.deposit_type ?? "—"} · ${d.received_date ?? "—"} · Bal ${fmtShort(Number(d.balance || 0))}`}
                  trailing={<span className="font-mono text-sm tabular-nums text-emerald-500">{fmtShort(Number(d.amount))}</span>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Audit Trail">
          {data.audit.length === 0 ? <EmptyState message="No recent finance actions." /> : (
            <div className="space-y-1">
              {data.audit.slice(0, 6).map(a => (
                <ListRow
                  key={a.id}
                  primary={a.notes || a.action}
                  secondary={`${a.record_type} · ${formatDistanceToNow(new Date(a.changed_at), { addSuffix: true })}`}
                  trailing={<StatusBadge status={a.action} tone="info" />}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Quick links */}
      <Panel title="Finance Quick Access">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/platform/finance-manager/m/billing" label="Billing & Invoicing" desc="AR, invoices, receipts" icon={Wallet} />
          <QuickLink to="/platform/finance-manager/m/billing" label="Recurring Schedules" desc="Auto-billing rules" icon={Repeat} />
          <QuickLink to="/platform/finance-manager/m/billing" label="Bank Reconciliation" desc="Match deposits" icon={Landmark} />
          <QuickLink to="/platform/finance-manager/m/billing" label="Tax Management" desc="VAT, PAYE, WHT" icon={Calculator} />
          <QuickLink to="/platform/finance-manager/m/billing" label="Budget Tracking" desc="Departmental burn" icon={BarChart3} />
          <QuickLink to="/platform/finance-manager/m/billing" label="Client Deposits" desc="Retainers & escrow" icon={Coins} />
          <QuickLink to="/platform/finance-manager/m/loss-control" label="Loss Control" desc="Shrinkage & risk" icon={AlertTriangle} />
          <QuickLink to="/platform/finance-manager/m/audit-log" label="Audit Log" desc="Transaction history" icon={ScrollText} />
        </div>
      </Panel>
    </div>
  );
};

export default FinanceDashboard;
