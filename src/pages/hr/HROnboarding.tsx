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
import { ClipboardList, Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Onboarding tasks persisted as tasks rows with category='onboarding'.
const TEMPLATE = [
  "Contract signed",
  "Bio-data submitted",
  "Background check cleared",
  "Uniform issued",
  "ID card issued",
  "Induction training booked",
  "Bank details captured",
  "NSSF/NHIF/PAYE registered",
];

export default function HROnboarding() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: "", start_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from("tasks").select("*").eq("category", "onboarding").order("created_at", { ascending: false }),
      supabase.from("staff").select("id, full_name, staff_id").eq("status", "active").order("full_name"),
    ]);
    setRows(t || []); setStaff(s || []); setLoading(false);
  };

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id) { toast.error("Select staff"); return; }
    const member = staff.find(s => s.id === form.staff_id);
    const payload = TEMPLATE.map(step => ({
      title: `[${member?.staff_id ?? "NEW"}] ${step}`,
      description: JSON.stringify({ staff_id: form.staff_id, staff_name: member?.full_name, step, start_date: form.start_date }),
      category: "onboarding", status: "pending", priority: "medium",
    }));
    const { error } = await supabase.from("tasks").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Onboarding started"); setOpen(false); load();
  };

  const complete = async (id: string) => {
    const { error } = await supabase.from("tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  if (loading) return <LoadingPulse />;

  // Group by staff_id
  const groups: Record<string, any[]> = rows.reduce((acc: Record<string, any[]>, r) => {
    let meta: any = {}; try { meta = JSON.parse(r.description || "{}"); } catch {}
    const key = meta.staff_id ?? r.id;
    (acc[key] ||= []).push({ ...r, meta });
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Onboarding" description="Track new-hire checklists from contract to first patrol." icon={ClipboardList} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Active Onboardings</div><div className="text-2xl font-semibold">{Object.keys(groups).length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pending Steps</div><div className="text-2xl font-semibold">{rows.filter(r => r.status === "pending").length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Completed Steps</div><div className="text-2xl font-semibold">{rows.filter(r => r.status === "completed").length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Tasks</div><div className="text-2xl font-semibold">{rows.length}</div></CardContent></Card>
        </div>

        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Start Onboarding</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Start Onboarding</DialogTitle></DialogHeader>
              <form onSubmit={start} className="space-y-3">
                <div><Label>Staff</Label>
                  <Select value={form.staff_id} onValueChange={v => setForm({ ...form, staff_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select new hire" /></SelectTrigger>
                    <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <Button type="submit" className="w-full">Create {TEMPLATE.length}-step checklist</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {Object.entries(groups).map(([key, items]) => {
          const completed = items.filter((i: any) => i.status === "completed").length;
          const name = items[0]?.meta?.staff_name ?? "Unknown";
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{name}</CardTitle>
                <Badge variant={completed === items.length ? "default" : "outline"}>{completed}/{items.length} complete</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((i: any) => (
                    <div key={i.id} className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${i.status === "completed" ? "text-green-500" : "text-muted-foreground"}`} />
                        <span className={i.status === "completed" ? "line-through text-muted-foreground" : ""}>{i.meta?.step ?? i.title}</span>
                      </div>
                      {i.status !== "completed" && <Button size="sm" variant="outline" onClick={() => complete(i.id)}>Mark done</Button>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {Object.keys(groups).length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No active onboardings. Click "Start Onboarding" to create a checklist.</CardContent></Card>}
      </main>
    </div>
  );
}
