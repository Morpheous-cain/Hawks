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
import { Plus, Trash2, CheckCircle, Link2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BankReconciliationProps {
  items: any[];
  finances: any[];
  onRefresh: () => void;
}

export default function BankReconciliation({ items, finances, onRefresh }: BankReconciliationProps) {
  const [open, setOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [form, setForm] = useState({
    bank_reference: "", bank_date: format(new Date(), "yyyy-MM-dd"),
    bank_amount: 0, bank_description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bank_reference) { toast.error("Bank reference required"); return; }

    const { error } = await (supabase as any).from("bank_reconciliation").insert([{
      bank_reference: form.bank_reference,
      bank_date: form.bank_date,
      bank_amount: form.bank_amount,
      bank_description: form.bank_description || null,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Bank entry added");
    setForm({ bank_reference: "", bank_date: format(new Date(), "yyyy-MM-dd"), bank_amount: 0, bank_description: "" });
    setOpen(false);
    onRefresh();
  };

  const matchToInvoice = async (bankId: string, financeId: string) => {
    const { error } = await (supabase as any).from("bank_reconciliation").update({
      matched_finance_id: financeId,
      match_status: "matched",
      matched_at: new Date().toISOString()
    }).eq("id", bankId);
    if (error) toast.error(error.message);
    else {
      // Also mark the invoice as paid
      await supabase.from("client_finances").update({
        payment_status: "paid",
        payment_date: new Date().toISOString()
      }).eq("id", financeId);
      toast.success("Matched & marked as paid");
      setMatchOpen(false);
      onRefresh();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await (supabase as any).from("bank_reconciliation").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const unmatched = items.filter(i => i.match_status === "unmatched");
  const matched = items.filter(i => i.match_status === "matched");
  const unmatchedInvoices = finances.filter(f => f.document_type === "invoice" && f.payment_status !== "paid");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Bank Reconciliation</h3>
          <p className="text-sm text-muted-foreground">
            {unmatched.length} unmatched · {matched.length} matched
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Bank Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Statement Entry</DialogTitle>
              <DialogDescription>Enter a bank transaction to match against invoices</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Reference *</Label><Input required value={form.bank_reference} onChange={e => setForm({ ...form, bank_reference: e.target.value })} placeholder="Bank reference number" /></div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Date *</Label><Input type="date" required value={form.bank_date} onChange={e => setForm({ ...form, bank_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" required value={form.bank_amount || ""} onChange={e => setForm({ ...form, bank_amount: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.bank_description} onChange={e => setForm({ ...form, bank_description: e.target.value })} placeholder="Payment description" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Add Entry</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Unmatched entries */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Unmatched Bank Entries</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead>
                <TableHead>Description</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmatched.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">All entries matched</TableCell></TableRow>
              ) : unmatched.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.bank_reference}</TableCell>
                  <TableCell>{item.bank_date ? format(new Date(item.bank_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell className="font-medium">KES {Number(item.bank_amount).toLocaleString()}</TableCell>
                  <TableCell>{item.bank_description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setMatchOpen(true); }}>
                        <Link2 className="h-3 w-3 mr-1" />Match
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

      {/* Matched entries */}
      {matched.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Matched Entries</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matched.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.bank_reference}</TableCell>
                    <TableCell>{item.bank_date ? format(new Date(item.bank_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell>KES {Number(item.bank_amount).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Match Dialog */}
      <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match Bank Entry</DialogTitle>
            <DialogDescription>
              Match "{selectedItem?.bank_reference}" (KES {Number(selectedItem?.bank_amount || 0).toLocaleString()}) to an invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {unmatchedInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No unpaid invoices to match</p>
            ) : unmatchedInvoices.map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{inv.clients?.legal_name} · KES {Number(inv.amount).toLocaleString()}</p>
                </div>
                <Button size="sm" onClick={() => matchToInvoice(selectedItem.id, inv.id)}>Match</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
