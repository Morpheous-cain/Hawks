import { useState, useMemo } from "react";
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
import { Plus, Check, X, Clock, ShoppingCart, Package, Truck } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

interface PurchaseOrdersProps {
  records: any[];
  clients: any[];
  onRefresh: () => void;
}

function generatePONumber() {
  const now = new Date();
  const r = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${r}`;
}

export default function PurchaseOrders({ records, clients, onRefresh }: PurchaseOrdersProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vendor: "", description: "", amount: 0, tax_amount: 0,
    category: "equipment", currency: "KES", delivery_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
    client_id: "", notes: "",
  });

  const poRecords = useMemo(() =>
    records.filter(r => r.document_type === "purchase_order").sort((a, b) =>
      new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
    ), [records]);

  const stats = useMemo(() => {
    const draft = poRecords.filter(r => r.payment_status === "pending");
    const approved = poRecords.filter(r => r.payment_status === "paid");
    const rejected = poRecords.filter(r => r.payment_status === "overdue");
    return {
      total: poRecords.length,
      draft: draft.length, draftVal: draft.reduce((s, r) => s + (r.amount || 0), 0),
      approved: approved.length, approvedVal: approved.reduce((s, r) => s + (r.amount || 0), 0),
      rejected: rejected.length,
    };
  }, [poRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor) { toast.error("Vendor name is required"); return; }
    if (form.amount <= 0) { toast.error("Amount must be > 0"); return; }

    const totalAmount = form.amount + form.tax_amount;
    const { error } = await supabase.from("client_finances").insert([{
      client_id: form.client_id || null,
      invoice_number: generatePONumber(),
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      due_date: form.delivery_date,
      amount: totalAmount,
      tax_amount: form.tax_amount,
      description: `[PO] ${form.vendor} — ${form.description}`,
      notes: JSON.stringify({ vendor: form.vendor, category: form.category, delivery_date: form.delivery_date }),
      category: form.category,
      document_type: "purchase_order",
      currency: form.currency,
      payment_status: "pending",
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Purchase Order created");
    setOpen(false);
    setForm({ vendor: "", description: "", amount: 0, tax_amount: 0, category: "equipment", currency: "KES", delivery_date: format(addDays(new Date(), 14), "yyyy-MM-dd"), client_id: "", notes: "" });
    onRefresh();
  };

  const updatePOStatus = async (id: string, status: string) => {
    const update: any = { payment_status: status };
    if (status === "paid") update.payment_date = new Date().toISOString();
    const { error } = await supabase.from("client_finances").update(update).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(status === "paid" ? "PO Approved" : "PO Rejected"); onRefresh(); }
  };

  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
    pending: { variant: "secondary", label: "⏳ Draft / Pending", icon: Clock },
    paid: { variant: "default", label: "✓ Approved", icon: Check },
    overdue: { variant: "destructive", label: "✗ Rejected", icon: X },
  };

  const parseVendor = (desc: string) => {
    if (desc?.startsWith("[PO] ")) {
      const parts = desc.replace("[PO] ", "").split(" — ");
      return { vendor: parts[0], desc: parts[1] || "" };
    }
    return { vendor: "—", desc: desc || "" };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Purchase Orders</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Purchase Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>Request approval for procurement</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Vendor / Supplier *</Label>
                <Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Safaricom, Uniform House" required />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. 50x Two-Way Radios" required />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="uniforms">Uniforms</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="office_supplies">Office Supplies</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Charge to Client (optional)</Label>
                  <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Internal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Internal / General</SelectItem>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" required min={1} value={form.amount || ""} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Tax</Label><Input type="number" value={form.tax_amount || ""} onChange={e => setForm({ ...form, tax_amount: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem><SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem><SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Expected Delivery Date</Label><Input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit"><ShoppingCart className="h-4 w-4 mr-2" />Submit PO</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total POs</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold text-amber-600">{stats.draft}</p><p className="text-xs text-muted-foreground">KES {stats.draftVal.toLocaleString()}</p></CardContent></Card>
        <Card className="border-l-4 border-l-emerald-500"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold text-emerald-600">{stats.approved}</p><p className="text-xs text-muted-foreground">KES {stats.approvedVal.toLocaleString()}</p></CardContent></Card>
        <Card className="border-l-4 border-l-destructive"><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-destructive">{stats.rejected}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead><TableHead>Vendor</TableHead><TableHead>Description</TableHead>
                <TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poRecords.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No purchase orders yet</TableCell></TableRow>
              ) : poRecords.map(rec => {
                const parsed = parseVendor(rec.description);
                const sc = statusConfig[rec.payment_status] || statusConfig.pending;
                return (
                  <TableRow key={rec.id}>
                    <TableCell className="font-mono text-sm font-semibold">{rec.invoice_number}</TableCell>
                    <TableCell className="font-medium">{parsed.vendor}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{parsed.desc}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{rec.category || "—"}</Badge></TableCell>
                    <TableCell className="font-semibold">{rec.currency || "KES"} {Number(rec.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{rec.due_date ? format(new Date(rec.due_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell>
                      {rec.payment_status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => updatePOStatus(rec.id, "paid")}>
                            <Check className="h-3 w-3 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => updatePOStatus(rec.id, "overdue")}>
                            <X className="h-3 w-3 mr-1" />Reject
                          </Button>
                        </div>
                      )}
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
