import { useEffect, useState } from "react";
import { Wallet, Plus, Check, X } from "lucide-react";
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
import { exportToCSV } from "@/utils/exportData";

const Schema = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().default("KES"),
  description: z.string().min(1).max(500),
});

type Expense = {
  id: string; category: string; amount: number; currency: string; description: string | null;
  status: string; claimant_id: string | null; created_at: string; receipt_url: string | null;
};

const TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary", approved: "default", rejected: "destructive", paid: "outline",
};

export default function Expenses() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "fuel", amount: 0, currency: "KES", description: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await sb.from("fin_expenses").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Expense[]); setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("fin_expenses-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "fin_expenses" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    const parsed = Schema.safeParse(form);
    if (!parsed.success) { toast({ title: "Invalid", description: parsed.error.issues[0].message, variant: "destructive" }); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from("fin_expenses").insert({ ...parsed.data, claimant_id: u.user?.id });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Expense submitted" }); setOpen(false);
    setForm({ category: "fuel", amount: 0, currency: "KES", description: "" });
  };

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { data: u } = await supabase.auth.getUser();
    await sb.from("fin_expenses").update({ status, approver_id: u.user?.id, approved_at: new Date().toISOString() }).eq("id", id);
    toast({ title: status });
  };

  const pendingTotal = rows.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount || 0), 0);
  const approvedTotal = rows.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <ModuleScaffold
      title="Expenses" description="Capture and approve expense claims" icon={Wallet}
      kpis={[
        { label: "Total claims", value: rows.length },
        { label: "Pending", value: rows.filter(r => r.status === "pending").length },
        { label: "Pending KES", value: pendingTotal.toLocaleString() },
        { label: "Approved KES", value: approvedTotal.toLocaleString() },
      ]}
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New Claim</Button>}
      onExport={() => exportToCSV(rows, "expenses")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading…</TableCell></TableRow>
              : rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses yet</TableCell></TableRow>
              : rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                  <TableCell className="text-right">{r.currency} {Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={TONE[r.status] ?? "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {r.status === "pending" && (<>
                      <Button size="sm" variant="outline" onClick={() => decide(r.id, "approved")}><Check className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}><X className="h-3 w-3" /></Button>
                    </>)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Expense Claim</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["fuel", "uniform", "training", "communication", "vehicle_maintenance", "office", "travel", "other"]
                    .map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleScaffold>
  );
}
