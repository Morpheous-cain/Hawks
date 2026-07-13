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
import { Briefcase, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Recruitment pipeline persists as tasks rows with category='recruitment'.
// Candidate metadata is JSON-encoded in description.

interface Req { id: string; title: string; description: string | null; status: string; created_at: string; }

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;

function decode(desc: string | null): { candidate?: string; role?: string; source?: string; notes?: string } {
  if (!desc) return {};
  try { return JSON.parse(desc); } catch { return { notes: desc }; }
}

export default function HRRecruitment() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Req[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ candidate: "", role: "Security Guard", source: "Walk-in", notes: "" });

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").eq("category", "recruitment").order("created_at", { ascending: false });
    setRows((data as any) || []); setLoading(false);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidate) { toast.error("Candidate name required"); return; }
    const { error } = await supabase.from("tasks").insert([{
      title: `${form.candidate} — ${form.role}`,
      description: JSON.stringify({ candidate: form.candidate, role: form.role, source: form.source, notes: form.notes }),
      category: "recruitment",
      status: "applied",
      priority: "medium",
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Application recorded"); setOpen(false);
    setForm({ candidate: "", role: "Security Guard", source: "Walk-in", notes: "" });
    load();
  };

  const advance = async (id: string, stage: string) => {
    const { error } = await supabase.from("tasks").update({ status: stage }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Moved to ${stage}`); load();
  };

  if (loading) return <LoadingPulse />;
  const byStage = (s: string) => rows.filter(r => r.status === s).length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Recruitment Pipeline" description="Candidate intake, screening, interviews, offers and hires." icon={Briefcase} />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {STAGES.map(s => (
            <Card key={s}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground capitalize">{s}</div>
              <div className="text-2xl font-semibold">{byStage(s)}</div>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Candidates</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Application</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Application</DialogTitle></DialogHeader>
                <form onSubmit={create} className="space-y-3">
                  <div><Label>Candidate name</Label><Input value={form.candidate} onChange={e => setForm({ ...form, candidate: e.target.value })} /></div>
                  <div><Label>Role</Label>
                    <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Security Guard">Security Guard</SelectItem>
                        <SelectItem value="Patrol Officer">Patrol Officer</SelectItem>
                        <SelectItem value="Control Room Operator">Control Room Operator</SelectItem>
                        <SelectItem value="K9 Handler">K9 Handler</SelectItem>
                        <SelectItem value="Driver">Driver</SelectItem>
                        <SelectItem value="Technician">Technician</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Source</Label>
                    <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                  <Button type="submit" className="w-full">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Role</TableHead><TableHead>Source</TableHead><TableHead>Stage</TableHead><TableHead>Applied</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No applications yet</TableCell></TableRow>
                ) : rows.map(r => {
                  const m = decode(r.description);
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{m.candidate ?? r.title}</TableCell>
                    <TableCell>{m.role ?? "—"}</TableCell>
                    <TableCell>{m.source ?? "—"}</TableCell>
                    <TableCell><Badge variant={r.status === "hired" ? "default" : r.status === "rejected" ? "destructive" : "outline"} className="capitalize">{r.status}</Badge></TableCell>
                    <TableCell className="text-xs">{format(new Date(r.created_at), "dd MMM yy")}</TableCell>
                    <TableCell>
                      <Select value={r.status} onValueChange={v => advance(r.id, v)}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
