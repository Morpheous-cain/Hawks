import { useEffect, useState } from "react";
import { Receipt, Plus, FileDown } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { useToast } from "@/hooks/use-toast";
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV, exportToPDF } from "@/utils/exportData";

const Schema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  issue_date: z.string(),
  due_date: z.string().optional(),
  currency: z.string().default("KES"),
  subtotal: z.coerce.number().min(0),
  tax: z.coerce.number().min(0),
  notes: z.string().optional(),
});

type Invoice = {
  id: string; invoice_number: string; client_id: string | null;
  issue_date: string; due_date: string | null; currency: string;
  subtotal: number; tax: number; total: number; status: string; notes: string | null;
};

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary", sent: "outline", paid: "default", overdue: "destructive", cancelled: "secondary",
};

export default function Invoices() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    client_id: "", issue_date: new Date().toISOString().slice(0, 10),
    due_date: "", currency: "KES", subtotal: 0, tax: 0, notes: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("fin_invoices").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Invoice[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    sb.from("clients").select("id,name").then(({ data }) => setClients((data ?? []) as any));
    const ch = supabase.channel("fin_invoices-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "fin_invoices" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    const parsed = Schema.safeParse(form);
    if (!parsed.success) { toast({ title: "Invalid", description: parsed.error.issues[0].message, variant: "destructive" }); return; }
    const total = Number(form.subtotal) + Number(form.tax);
    const { error } = await sb.from("fin_invoices").insert({
      ...parsed.data, client_id: form.client_id || null, total,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Invoice created" });
    setOpen(false);
  };

  const setStatus = async (id: string, status: string) => {
    await sb.from("fin_invoices").update({ status }).eq("id", id);
    toast({ title: `Marked ${status}` });
  };

  const totalRevenue = rows.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.total || 0), 0);
  const ar = rows.filter(r => ["sent", "overdue"].includes(r.status)).reduce((s, r) => s + Number(r.total || 0), 0);

  return (
    <ModuleScaffold
      title="Invoices" description="Issue, track and reconcile client invoices" icon={Receipt}
      kpis={[
        { label: "Total Invoices", value: rows.length },
        { label: "Revenue (paid)", value: `KES ${totalRevenue.toLocaleString()}` },
        { label: "Receivables", value: `KES ${ar.toLocaleString()}` },
        { label: "Overdue", value: rows.filter(r => r.status === "overdue").length },
      ]}
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New Invoice</Button>}
      onExport={() => exportToCSV(rows, "invoices")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead><TableHead>Issue</TableHead><TableHead>Due</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No invoices yet</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.invoice_number}</TableCell>
                <TableCell>{r.issue_date}</TableCell>
                <TableCell>{r.due_date ?? "—"}</TableCell>
                <TableCell className="text-right">{r.currency} {Number(r.total).toLocaleString()}</TableCell>
                <TableCell><Badge variant={STATUS_TONE[r.status] ?? "secondary"}>{r.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["draft", "sent", "paid", "overdue", "cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => exportToPDF(rows, "invoices", "Invoice Register")}>
          <FileDown className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
              <div><Label>Subtotal</Label><Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: Number(e.target.value) })} /></div>
              <div><Label>Tax (16%)</Label><Input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleScaffold>
  );
}
