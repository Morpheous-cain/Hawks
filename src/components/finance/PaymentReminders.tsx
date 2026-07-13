import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Send, AlertTriangle, Scale, Clock } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { toast } from "sonner";

interface PaymentRemindersProps {
  records: any[];
  clients: any[];
  onRefresh: () => void;
}

type EscalationLevel = "friendly" | "firm" | "final" | "legal";

const ESCALATION_CONFIG: Record<EscalationLevel, { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline"; daysOverdue: number; template: string }> = {
  friendly: { label: "Friendly Reminder", color: "text-blue-600", variant: "secondary", daysOverdue: 7, template: "Dear Client, this is a friendly reminder that invoice {inv} of {amount} was due on {due}. Please arrange payment at your earliest convenience." },
  firm: { label: "Firm Follow-up", color: "text-amber-600", variant: "outline", daysOverdue: 14, template: "Dear Client, we note that invoice {inv} ({amount}) is now {days} days overdue. Please treat this as urgent and confirm payment date." },
  final: { label: "Final Notice", color: "text-orange-600", variant: "default", daysOverdue: 30, template: "FINAL NOTICE: Invoice {inv} ({amount}) has been outstanding for {days} days. Failure to pay within 7 days may result in service suspension and referral for collection." },
  legal: { label: "Legal Action Notice", color: "text-destructive", variant: "destructive", daysOverdue: 60, template: "LEGAL NOTICE: Invoice {inv} ({amount}) is {days} days overdue. This matter will be referred to our legal team for recovery action if payment is not received within 48 hours." },
};

export default function PaymentReminders({ records, clients, onRefresh }: PaymentRemindersProps) {
  const [sending, setSending] = useState<string | null>(null);

  const overdueInvoices = useMemo(() => {
    return records
      .filter(r => (r.document_type || "invoice") === "invoice" && r.payment_status !== "paid" && r.due_date)
      .map(inv => {
        const daysOverdue = Math.max(0, differenceInDays(new Date(), new Date(inv.due_date)));
        let escalation: EscalationLevel = "friendly";
        if (daysOverdue >= 60) escalation = "legal";
        else if (daysOverdue >= 30) escalation = "final";
        else if (daysOverdue >= 14) escalation = "firm";
        else if (daysOverdue >= 7) escalation = "friendly";
        return { ...inv, daysOverdue, escalation, isOverdue: daysOverdue > 0 };
      })
      .filter(inv => inv.daysOverdue >= 1)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [records]);

  const upcomingDue = useMemo(() => {
    return records
      .filter(r => (r.document_type || "invoice") === "invoice" && r.payment_status !== "paid" && r.due_date)
      .map(inv => {
        const daysToDue = differenceInDays(new Date(inv.due_date), new Date());
        return { ...inv, daysToDue };
      })
      .filter(inv => inv.daysToDue >= 0 && inv.daysToDue <= 7)
      .sort((a, b) => a.daysToDue - b.daysToDue);
  }, [records]);

  const stats = useMemo(() => ({
    overdue: overdueInvoices.length,
    upcoming: upcomingDue.length,
    overdueTotal: overdueInvoices.reduce((s, i) => s + (i.amount || 0), 0),
    friendly: overdueInvoices.filter(i => i.escalation === "friendly").length,
    firm: overdueInvoices.filter(i => i.escalation === "firm").length,
    final: overdueInvoices.filter(i => i.escalation === "final").length,
    legal: overdueInvoices.filter(i => i.escalation === "legal").length,
  }), [overdueInvoices, upcomingDue]);

  const sendReminder = async (inv: any) => {
    setSending(inv.id);
    const config = ESCALATION_CONFIG[inv.escalation as EscalationLevel];
    const message = config.template
      .replace("{inv}", inv.invoice_number)
      .replace("{amount}", `${inv.currency || "KES"} ${Number(inv.amount).toLocaleString()}`)
      .replace("{due}", inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "N/A")
      .replace("{days}", String(inv.daysOverdue));

    const { error } = await (supabase as any).from("payment_reminders").insert([{
      finance_id: inv.id,
      client_id: inv.client_id,
      reminder_type: inv.escalation,
      days_before_due: -inv.daysOverdue,
      status: "sent",
      sent_at: new Date().toISOString(),
      channel: "email",
      message,
    }]);

    if (error) { toast.error(error.message); setSending(null); return; }
    toast.success(`${config.label} logged for ${inv.invoice_number}`);
    setSending(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><BellRing className="h-5 w-5" />Payment Reminders & Escalation</h3>

      {/* Escalation Stats */}
      <div className="grid gap-3 md:grid-cols-5">
        <Card className="border-l-4 border-l-amber-500"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Upcoming (≤7 days)</p><p className="text-2xl font-bold text-amber-600">{stats.upcoming}</p></CardContent></Card>
        <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Friendly (7-13d)</p><p className="text-2xl font-bold text-blue-600">{stats.friendly}</p></CardContent></Card>
        <Card className="border-l-4 border-l-amber-600"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Firm (14-29d)</p><p className="text-2xl font-bold text-amber-600">{stats.firm}</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-600"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Final Notice (30-59d)</p><p className="text-2xl font-bold text-orange-600">{stats.final}</p></CardContent></Card>
        <Card className="border-l-4 border-l-destructive"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Legal Action (60d+)</p><p className="text-2xl font-bold text-destructive">{stats.legal}</p></CardContent></Card>
      </div>

      {/* Upcoming Due */}
      {upcomingDue.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Due Within 7 Days</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Due In</TableHead><TableHead>Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {upcomingDue.map(inv => (
                  <TableRow key={inv.id} className="bg-amber-500/5">
                    <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.clients?.legal_name || "—"}</TableCell>
                    <TableCell className="font-semibold">{inv.currency || "KES"} {Number(inv.amount).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{inv.daysToDue === 0 ? "Due Today" : `${inv.daysToDue}d left`}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => sendReminder({ ...inv, daysOverdue: 0, escalation: "friendly" })} disabled={sending === inv.id}>
                        <Bell className="h-3 w-3 mr-1" />Send Reminder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Overdue Escalation Queue */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Overdue Escalation Queue — KES {stats.overdueTotal.toLocaleString()} Outstanding</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead>
              <TableHead>Days Overdue</TableHead><TableHead>Escalation Level</TableHead><TableHead>Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {overdueInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No overdue invoices 🎉</TableCell></TableRow>
              ) : overdueInvoices.map(inv => {
                const config = ESCALATION_CONFIG[inv.escalation as EscalationLevel];
                return (
                  <TableRow key={inv.id} className={inv.escalation === "legal" ? "bg-destructive/5" : inv.escalation === "final" ? "bg-orange-500/5" : ""}>
                    <TableCell className="font-mono text-sm font-semibold">{inv.invoice_number}</TableCell>
                    <TableCell className="font-medium">{inv.clients?.legal_name || "—"}</TableCell>
                    <TableCell className="font-semibold">{inv.currency || "KES"} {Number(inv.amount).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={inv.daysOverdue > 30 ? "destructive" : "secondary"} className="font-mono">{inv.daysOverdue}d</Badge></TableCell>
                    <TableCell><Badge variant={config.variant} className={config.color}>{config.label}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant={inv.escalation === "legal" ? "destructive" : "outline"} onClick={() => sendReminder(inv)} disabled={sending === inv.id}>
                        <Send className="h-3 w-3 mr-1" />{sending === inv.id ? "Sending..." : "Send Notice"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
