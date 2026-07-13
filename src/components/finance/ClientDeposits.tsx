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
import { Plus, Trash2, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ClientDepositsProps {
  items: any[];
  clients: any[];
  finances: any[];
  onRefresh: () => void;
}

export default function ClientDeposits({ items, clients, finances, onRefresh }: ClientDepositsProps) {
  const [open, setOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [form, setForm] = useState({
    client_id: "", deposit_type: "deposit", amount: 0,
    reference_number: "", received_date: format(new Date(), "yyyy-MM-dd"), notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) { toast.error("Select a client"); return; }
    if (form.amount <= 0) { toast.error("Amount must be > 0"); return; }

    const { error } = await (supabase as any).from("client_deposits").insert([{
      client_id: form.client_id,
      deposit_type: form.deposit_type,
      amount: form.amount,
      balance: form.amount,
      reference_number: form.reference_number || null,
      received_date: form.received_date,
      notes: form.notes || null,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit recorded");
    setOpen(false);
    onRefresh();
  };

  const applyToInvoice = async (depositId: string, invoiceId: string, amount: number) => {
    const deposit = items.find(d => d.id === depositId);
    if (!deposit || deposit.balance < amount) { toast.error("Insufficient balance"); return; }

    const { error: depError } = await (supabase as any).from("client_deposits").update({
      balance: deposit.balance - amount,
      applied_to_invoice_id: invoiceId,
      applied_amount: (deposit.applied_amount || 0) + amount,
      status: deposit.balance - amount <= 0 ? "exhausted" : "active"
    }).eq("id", depositId);

    if (depError) { toast.error(depError.message); return; }

    const inv = finances.find(f => f.id === invoiceId);
    if (inv && amount >= inv.amount) {
      await supabase.from("client_finances").update({
        payment_status: "paid", payment_date: new Date().toISOString()
      }).eq("id", invoiceId);
    }

    toast.success("Deposit applied to invoice");
    setApplyOpen(false);
    onRefresh();
  };

  const deleteItem = async (id: string) => {
    const { error } = await (supabase as any).from("client_deposits").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const totalActive = items.filter(d => d.status === "active").reduce((s, d) => s + (d.balance || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Deposits & Retainers</h3>
          <p className="text-sm text-muted-foreground">Total available: KES {totalActive.toLocaleString()}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Record Deposit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Deposit / Retainer</DialogTitle>
              <DialogDescription>Track client advance payments</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.deposit_type} onValueChange={v => setForm({ ...form, deposit_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="retainer">Retainer</SelectItem>
                      <SelectItem value="advance">Advance Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" required min={1} value={form.amount || ""} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Reference #</Label><Input value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} /></div>
                <div className="space-y-2"><Label>Received Date</Label><Input type="date" value={form.received_date} onChange={e => setForm({ ...form, received_date: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Record</Button>
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
                <TableHead>Client</TableHead><TableHead>Type</TableHead><TableHead>Original</TableHead>
                <TableHead>Balance</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No deposits recorded</TableCell></TableRow>
              ) : items.map(dep => (
                <TableRow key={dep.id}>
                  <TableCell className="font-medium">{dep.clients?.legal_name || "—"}</TableCell>
                  <TableCell className="capitalize">{dep.deposit_type}</TableCell>
                  <TableCell>KES {Number(dep.amount).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">KES {Number(dep.balance).toLocaleString()}</TableCell>
                  <TableCell>{dep.received_date ? format(new Date(dep.received_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={dep.status === "active" ? "default" : "secondary"}>{dep.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {dep.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedDeposit(dep); setApplyOpen(true); }}>
                          <ArrowDown className="h-3 w-3 mr-1" />Apply
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteItem(dep.id)}>
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

      {/* Apply to Invoice Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply Deposit to Invoice</DialogTitle>
            <DialogDescription>
              Balance: KES {Number(selectedDeposit?.balance || 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {finances.filter(f => f.document_type === "invoice" && f.payment_status !== "paid" && f.client_id === selectedDeposit?.client_id).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No unpaid invoices for this client</p>
            ) : finances.filter(f => f.document_type === "invoice" && f.payment_status !== "paid" && f.client_id === selectedDeposit?.client_id).map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">KES {Number(inv.amount).toLocaleString()}</p>
                </div>
                <Button size="sm" onClick={() => applyToInvoice(selectedDeposit.id, inv.id, Math.min(selectedDeposit.balance, inv.amount))}>
                  Apply KES {Math.min(selectedDeposit?.balance || 0, inv.amount).toLocaleString()}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
