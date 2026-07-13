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
import { Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BudgetTrackingProps {
  items: any[];
  onRefresh: () => void;
}

export default function BudgetTracking({ items, onRefresh }: BudgetTrackingProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", department: "", category: "",
    period_start: format(new Date(), "yyyy-MM-dd"),
    period_end: "",
    allocated_amount: 0, notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Budget name required"); return; }
    if (form.allocated_amount <= 0) { toast.error("Amount must be > 0"); return; }

    const { error } = await (supabase as any).from("budgets").insert([{
      name: form.name,
      department: form.department || null,
      category: form.category || null,
      period_start: form.period_start,
      period_end: form.period_end || form.period_start,
      allocated_amount: form.allocated_amount,
      notes: form.notes || null,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Budget created");
    setOpen(false);
    onRefresh();
  };

  const updateSpent = async (id: string, amount: number) => {
    const { error } = await (supabase as any).from("budgets").update({ spent_amount: amount }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); onRefresh(); }
  };

  const deleteItem = async (id: string) => {
    const { error } = await (supabase as any).from("budgets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const totalAllocated = items.reduce((s, b) => s + (b.allocated_amount || 0), 0);
  const totalSpent = items.reduce((s, b) => s + (b.spent_amount || 0), 0);
  const overBudget = items.filter(b => b.spent_amount > b.allocated_amount);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Budget Tracking</h3>
          <p className="text-sm text-muted-foreground">
            KES {totalSpent.toLocaleString()} spent of KES {totalAllocated.toLocaleString()} allocated
            {overBudget.length > 0 && <span className="text-destructive ml-2">· {overBudget.length} over budget</span>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Budget</DialogTitle>
              <DialogDescription>Set a spending limit for a department or category</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Budget Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q1 Operations" /></div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="uniforms">Uniforms</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2"><Label>Start Date *</Label><Input type="date" required value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Allocated Amount (KES) *</Label><Input type="number" required min={1} value={form.allocated_amount || ""} onChange={e => setForm({ ...form, allocated_amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Budget</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {items.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No budgets created yet</CardContent></Card>
        ) : items.map(budget => {
          const pct = budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0;
          const isOver = pct > 100;
          const isWarning = pct > 80 && pct <= 100;
          return (
            <Card key={budget.id} className={isOver ? "border-destructive/50" : ""}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{budget.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {budget.department || "—"} · {budget.category || "—"} · {budget.period_start ? format(new Date(budget.period_start), "MMM yyyy") : ""}
                      {budget.period_end ? ` – ${format(new Date(budget.period_end), "MMM yyyy")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isOver ? "destructive" : isWarning ? "secondary" : "default"}>
                      {pct.toFixed(0)}% used
                    </Badge>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteItem(budget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>KES {Number(budget.spent_amount).toLocaleString()} spent</span>
                  <span>KES {Number(budget.allocated_amount).toLocaleString()} allocated</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : isWarning ? "bg-yellow-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Remaining: KES {Math.max(0, budget.allocated_amount - budget.spent_amount).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
