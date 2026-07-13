import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, RefreshCw, Pause, Play } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface RecurringInvoicesProps {
  items: any[];
  clients: any[];
  onRefresh: () => void;
}

export default function RecurringInvoices({ items, clients, onRefresh }: RecurringInvoicesProps) {
  const [open, setOpen] = useState(false);

  const TAX_BRACKETS = [
    { label: "No Tax (0%)", value: "0" },
    { label: "VAT 16%", value: "16" },
    { label: "WHT 3%", value: "3" },
    { label: "WHT 5%", value: "5" },
    { label: "WHT 10%", value: "10" },
    { label: "WHT 20%", value: "20" },
    { label: "Catering Levy 2%", value: "2" },
    { label: "Custom Rate", value: "custom" },
  ];

  const [form, setForm] = useState({
    client_id: "", description: "", amount: 0, tax_percent: "16", tax_amount: 0, discount_amount: 0,
    frequency: "monthly", next_invoice_date: format(new Date(), "yyyy-MM-dd"), end_date: "", currency: "KES"
  });

  const handleTaxBracketChange = (percent: string) => {
    if (percent === "custom") {
      setForm(prev => ({ ...prev, tax_percent: "custom" }));
    } else {
      const p = parseFloat(percent) || 0;
      const taxAmt = Math.round((form.amount * p) / 100 * 100) / 100;
      setForm(prev => ({ ...prev, tax_percent: percent, tax_amount: taxAmt }));
    }
  };

  const handleAmountChange = (newAmount: number) => {
    const p = form.tax_percent === "custom" ? 0 : parseFloat(form.tax_percent) || 0;
    const taxAmt = form.tax_percent === "custom" ? form.tax_amount : Math.round((newAmount * p) / 100 * 100) / 100;
    setForm(prev => ({ ...prev, amount: newAmount, tax_amount: taxAmt }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) { toast.error("Select a client"); return; }
    if (form.amount <= 0) { toast.error("Amount must be > 0"); return; }

    const { error } = await (supabase as any).from("recurring_invoices").insert([{
      client_id: form.client_id,
      description: form.description || null,
      amount: form.amount,
      tax_amount: form.tax_amount,
      discount_amount: form.discount_amount,
      frequency: form.frequency,
      next_invoice_date: form.next_invoice_date,
      end_date: form.end_date || null,
      currency: form.currency,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Recurring invoice created");
    setOpen(false);
    onRefresh();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await (supabase as any).from("recurring_invoices").update({ is_active: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(current ? "Paused" : "Activated"); onRefresh(); }
  };

  const deleteItem = async (id: string) => {
    const { error } = await (supabase as any).from("recurring_invoices").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const freqLabel: Record<string, string> = { weekly: "Weekly", biweekly: "Bi-Weekly", monthly: "Monthly", quarterly: "Quarterly", annually: "Annually" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recurring Invoices</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Recurring Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Recurring Invoice</DialogTitle>
              <DialogDescription>Auto-generate invoices on a schedule</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Monthly guarding services" />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" required min={1} value={form.amount || ""} onChange={e => handleAmountChange(parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-2"><Label>Discount</Label><Input type="number" value={form.discount_amount || ""} onChange={e => setForm({ ...form, discount_amount: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Tax Bracket</Label>
                  <Select value={form.tax_percent} onValueChange={handleTaxBracketChange}>
                    <SelectTrigger><SelectValue placeholder="Select tax rate" /></SelectTrigger>
                    <SelectContent>
                      {TAX_BRACKETS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax Amount {form.tax_percent !== "custom" && form.amount > 0 ? `(${form.tax_percent}%)` : ""}</Label>
                  <Input type="number" value={form.tax_amount || ""} onChange={e => setForm({ ...form, tax_amount: parseFloat(e.target.value) || 0, tax_percent: "custom" })} readOnly={form.tax_percent !== "custom"} className={form.tax_percent !== "custom" ? "bg-muted" : ""} />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Next Invoice Date *</Label><Input type="date" required value={form.next_invoice_date} onChange={e => setForm({ ...form, next_invoice_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>End Date (optional)</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead><TableHead>Next Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No recurring invoices set up</TableCell></TableRow>
              ) : items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.clients?.legal_name || "—"}</TableCell>
                  <TableCell>{item.description || "—"}</TableCell>
                  <TableCell>{item.currency} {Number(item.amount).toLocaleString()}</TableCell>
                  <TableCell>{freqLabel[item.frequency] || item.frequency}</TableCell>
                  <TableCell>{item.next_invoice_date ? format(new Date(item.next_invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Paused"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => toggleActive(item.id, item.is_active)}>
                        {item.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
