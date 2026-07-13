import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gavel, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Disciplinary & grievance cases stored as tasks category='disciplinary'.
const ACTIONS = ["verbal_warning", "written_warning", "suspension", "termination", "grievance", "counselling"] as const;

export default function HRDisciplinary() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: "", action: "written_warning", incident: "", details: "" });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from("tasks").select("*").eq("category", "disciplinary").order("created_at", { ascending: false }),
      supabase.from("staff").select("id, full_name, staff_id").eq("status", "active").order("full_name"),
    ]);
    setRows(t || []); setStaff(s || []); setLoading(false);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id || !form.incident) { toast.error("Staff and incident required"); return; }
    const member = staff.find(s => s.id === form.staff_id);
    const sev = form.action === "termination" ? "high" : form.action === "suspension" ? "high" : "medium";
    const { error } = await supabase.from("tasks").insert([{
      title: `${form.action.replace("_"," ").toUpperCase()} — ${member?.full_name}`,
      description: JSON.stringify({ ...form, staff_name: member?.full_name }),
      category: "disciplinary", status: "open", priority: sev,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Case opened"); setOpen(false); load();
  };

  const resolve = async (id: string) => {
    await supabase.from("tasks").update({ status: "closed", completed_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  if (loading) return <LoadingPulse />;
  const open_count = rows.filter(r => r.status === "open").length;
  const closed = rows.filter(r => r.status === "closed").length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Disciplinary & Grievances" description="Warnings, suspensions, grievances and resolutions." icon={Gavel} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Open Cases</div><div className="text-2xl font-semibold">{open_count}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Closed</div><div className="text-2xl font-semibold">{closed}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold">{rows.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">High Severity</div><div className="text-2xl font-semibold">{rows.filter(r => r.priority === "high").length}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Cases</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Open Case</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Open Disciplinary Case</DialogTitle></DialogHeader>
                <form onSubmit={create} className="space-y-3">
                  <div><Label>Staff</Label>
                    <Select value={form.staff_id} onValueChange={v => setForm({ ...form, staff_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                      <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Action</Label>
                    <Select value={form.action} onValueChange={v => setForm({ ...form, action: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ACTIONS.map(a => <SelectItem key={a} value={a} className="capitalize">{a.replace("_"," ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Incident summary</Label><Input value={form.incident} onChange={e => setForm({ ...form, incident: e.target.value })} /></div>
                  <div><Label>Details</Label><Textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></div>
                  <Button type="submit" className="w-full">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Action</TableHead><TableHead>Incident</TableHead><TableHead>Severity</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No cases opened</TableCell></TableRow>
                ) : rows.map(r => {
                  let m: any = {}; try { m = JSON.parse(r.description || "{}"); } catch {}
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{m.staff_name ?? "—"}</TableCell>
                      <TableCell className="capitalize">{(m.action ?? "").replace("_"," ")}</TableCell>
                      <TableCell className="max-w-xs truncate">{m.incident}</TableCell>
                      <TableCell><Badge variant={r.priority === "high" ? "destructive" : "outline"}>{r.priority}</Badge></TableCell>
                      <TableCell><Badge variant={r.status === "closed" ? "default" : "outline"}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(r.created_at), "dd MMM yy")}</TableCell>
                      <TableCell>{r.status === "open" && <Button size="sm" variant="outline" onClick={() => resolve(r.id)}>Close</Button>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
