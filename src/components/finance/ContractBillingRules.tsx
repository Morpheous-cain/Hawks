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
import { Plus, Trash2, Calculator } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContractBillingRulesProps {
  items: any[];
  clients: any[];
  onRefresh: () => void;
}

export default function ContractBillingRules({ items, clients, onRefresh }: ContractBillingRulesProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", rule_name: "", billing_type: "fixed",
    rate_per_hour: 0, rate_per_shift: 0, fixed_monthly: 0,
    guard_count: 0, shift_hours: 0,
    overtime_rate_multiplier: 1.5, weekend_rate_multiplier: 1.5, holiday_rate_multiplier: 2,
    include_vat: true, vat_percentage: 16, notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.rule_name) { toast.error("Client and rule name required"); return; }

    const { error } = await (supabase as any).from("contract_billing_rules").insert([{
      client_id: form.client_id,
      rule_name: form.rule_name,
      billing_type: form.billing_type,
      rate_per_hour: form.rate_per_hour,
      rate_per_shift: form.rate_per_shift,
      fixed_monthly: form.fixed_monthly,
      guard_count: form.guard_count,
      shift_hours: form.shift_hours,
      overtime_rate_multiplier: form.overtime_rate_multiplier,
      weekend_rate_multiplier: form.weekend_rate_multiplier,
      holiday_rate_multiplier: form.holiday_rate_multiplier,
      include_vat: form.include_vat,
      vat_percentage: form.vat_percentage,
      notes: form.notes || null,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Billing rule created");
    setOpen(false);
    onRefresh();
  };

  const deleteItem = async (id: string) => {
    const { error } = await (supabase as any).from("contract_billing_rules").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); onRefresh(); }
  };

  const calculateMonthly = (rule: any) => {
    let base = 0;
    if (rule.billing_type === "fixed") {
      base = rule.fixed_monthly || 0;
    } else if (rule.billing_type === "hourly") {
      base = (rule.rate_per_hour || 0) * (rule.shift_hours || 0) * (rule.guard_count || 0) * 30;
    } else if (rule.billing_type === "per_shift") {
      base = (rule.rate_per_shift || 0) * (rule.guard_count || 0) * 30;
    }
    if (rule.include_vat) base *= (1 + (rule.vat_percentage || 0) / 100);
    return base;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Contract Billing Rules</h3>
          <p className="text-sm text-muted-foreground">Auto-calculate billing based on guard deployment</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Billing Rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Billing Rule</DialogTitle>
              <DialogDescription>Define how billing is calculated for a client contract</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Rule Name *</Label><Input required value={form.rule_name} onChange={e => setForm({ ...form, rule_name: e.target.value })} placeholder="e.g. Day Shift Guards" /></div>
              <div className="space-y-2">
                <Label>Billing Type</Label>
                <Select value={form.billing_type} onValueChange={v => setForm({ ...form, billing_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Monthly</SelectItem>
                    <SelectItem value="hourly">Per Hour</SelectItem>
                    <SelectItem value="per_shift">Per Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.billing_type === "fixed" && (
                <div className="space-y-2"><Label>Fixed Monthly Amount (KES)</Label><Input type="number" value={form.fixed_monthly || ""} onChange={e => setForm({ ...form, fixed_monthly: parseFloat(e.target.value) || 0 })} /></div>
              )}
              {form.billing_type === "hourly" && (
                <div className="grid gap-4 grid-cols-3">
                  <div className="space-y-2"><Label>Rate/Hour</Label><Input type="number" value={form.rate_per_hour || ""} onChange={e => setForm({ ...form, rate_per_hour: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>Shift Hours</Label><Input type="number" value={form.shift_hours || ""} onChange={e => setForm({ ...form, shift_hours: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>Guards</Label><Input type="number" value={form.guard_count || ""} onChange={e => setForm({ ...form, guard_count: parseInt(e.target.value) || 0 })} /></div>
                </div>
              )}
              {form.billing_type === "per_shift" && (
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2"><Label>Rate/Shift</Label><Input type="number" value={form.rate_per_shift || ""} onChange={e => setForm({ ...form, rate_per_shift: parseFloat(e.target.value) || 0 })} /></div>
                  <div className="space-y-2"><Label>Guards</Label><Input type="number" value={form.guard_count || ""} onChange={e => setForm({ ...form, guard_count: parseInt(e.target.value) || 0 })} /></div>
                </div>
              )}
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-2"><Label>OT Multiplier</Label><Input type="number" step="0.1" value={form.overtime_rate_multiplier} onChange={e => setForm({ ...form, overtime_rate_multiplier: parseFloat(e.target.value) || 1.5 })} /></div>
                <div className="space-y-2"><Label>Weekend ×</Label><Input type="number" step="0.1" value={form.weekend_rate_multiplier} onChange={e => setForm({ ...form, weekend_rate_multiplier: parseFloat(e.target.value) || 1.5 })} /></div>
                <div className="space-y-2"><Label>Holiday ×</Label><Input type="number" step="0.1" value={form.holiday_rate_multiplier} onChange={e => setForm({ ...form, holiday_rate_multiplier: parseFloat(e.target.value) || 2 })} /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Include VAT</Label>
                  <Select value={form.include_vat ? "yes" : "no"} onValueChange={v => setForm({ ...form, include_vat: v === "yes" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.include_vat && (
                  <div className="space-y-2"><Label>VAT %</Label><Input type="number" value={form.vat_percentage} onChange={e => setForm({ ...form, vat_percentage: parseFloat(e.target.value) || 16 })} /></div>
                )}
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Rule</Button>
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
                <TableHead>Client</TableHead><TableHead>Rule</TableHead><TableHead>Type</TableHead>
                <TableHead>Est. Monthly</TableHead><TableHead>VAT</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No billing rules configured</TableCell></TableRow>
              ) : items.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.clients?.legal_name || "—"}</TableCell>
                  <TableCell>{rule.rule_name}</TableCell>
                  <TableCell className="capitalize">{rule.billing_type?.replace("_", " ")}</TableCell>
                  <TableCell className="font-medium">KES {calculateMonthly(rule).toLocaleString()}</TableCell>
                  <TableCell>{rule.include_vat ? `${rule.vat_percentage}%` : "No"}</TableCell>
                  <TableCell><Badge variant={rule.is_active ? "default" : "secondary"}>{rule.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteItem(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
