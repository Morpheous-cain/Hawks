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
import { TrendingUp, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Performance appraisals stored as tasks category='appraisal'.
const RATINGS = [
  { v: "A", label: "A — Outstanding" },
  { v: "B", label: "B — Exceeds" },
  { v: "C", label: "C — Meets" },
  { v: "D", label: "D — Needs improvement" },
  { v: "F", label: "F — Unsatisfactory" },
];

export default function HRPerformance() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: "", period: "2026-Q2", rating: "C", strengths: "", improvements: "", goals: "" });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from("tasks").select("*").eq("category", "appraisal").order("created_at", { ascending: false }),
      supabase.from("staff").select("id, full_name, staff_id").eq("status", "active").order("full_name"),
    ]);
    setRows(t || []); setStaff(s || []); setLoading(false);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id) { toast.error("Select staff"); return; }
    const member = staff.find(s => s.id === form.staff_id);
    const { error } = await supabase.from("tasks").insert([{
      title: `Appraisal — ${member?.full_name} (${form.period})`,
      description: JSON.stringify({ ...form, staff_name: member?.full_name }),
      category: "appraisal",
      status: form.rating === "F" || form.rating === "D" ? "follow_up" : "completed",
      priority: form.rating === "F" ? "high" : "medium",
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Appraisal recorded"); setOpen(false); load();
  };

  if (loading) return <LoadingPulse />;

  const counts = RATINGS.map(r => ({ ...r, count: rows.filter(x => { try { return JSON.parse(x.description || "{}").rating === r.v; } catch { return false; }}).length }));

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Performance & Appraisals" description="Quarterly reviews, ratings and follow-up plans." icon={TrendingUp} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {counts.map(c => (
            <Card key={c.v}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Grade {c.v}</div>
              <div className="text-2xl font-semibold">{c.count}</div>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Appraisals</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Appraisal</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Appraisal</DialogTitle></DialogHeader>
                <form onSubmit={create} className="space-y-3">
                  <div><Label>Staff</Label>
                    <Select value={form.staff_id} onValueChange={v => setForm({ ...form, staff_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                      <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Period</Label><Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} /></div>
                    <div><Label>Rating</Label>
                      <Select value={form.rating} onValueChange={v => setForm({ ...form, rating: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{RATINGS.map(r => <SelectItem key={r.v} value={r.v}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Strengths</Label><Textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} /></div>
                  <div><Label>Improvement areas</Label><Textarea value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} /></div>
                  <div><Label>Goals (next period)</Label><Textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} /></div>
                  <Button type="submit" className="w-full">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Period</TableHead><TableHead>Rating</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No appraisals yet</TableCell></TableRow>
                ) : rows.map(r => {
                  let m: any = {}; try { m = JSON.parse(r.description || "{}"); } catch {}
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{m.staff_name ?? "—"}</TableCell>
                      <TableCell>{m.period ?? "—"}</TableCell>
                      <TableCell><Badge variant={["A","B"].includes(m.rating) ? "default" : ["F"].includes(m.rating) ? "destructive" : "outline"}>{m.rating}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(r.created_at), "dd MMM yy")}</TableCell>
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
