import { useEffect, useState } from "react";
import { ShieldCheck, Plus } from "lucide-react";
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
  framework: z.string().min(1), code: z.string().min(1), title: z.string().min(1),
  description: z.string().optional(), status: z.string(),
});

type Control = { id: string; framework: string; code: string; title: string; description: string | null; status: string; last_reviewed: string | null; next_review: string | null; };
const TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "secondary", in_progress: "outline", met: "default", exception: "destructive",
};

export default function ComplianceRegister() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Control[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ framework: "internal", code: "", title: "", description: "", status: "open" });

  const load = async () => {
    const { data } = await sb.from("gov_controls").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Control[]);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("gov_controls-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "gov_controls" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    const parsed = Schema.safeParse(form);
    if (!parsed.success) { toast({ title: parsed.error.issues[0].message, variant: "destructive" }); return; }
    const { error } = await sb.from("gov_controls").insert(parsed.data);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "Control added" }); setOpen(false);
  };

  const setStatus = async (id: string, status: string) => {
    await sb.from("gov_controls").update({ status, last_reviewed: new Date().toISOString().slice(0,10) }).eq("id", id);
  };

  return (
    <ModuleScaffold
      title="Compliance Register" description="Controls, evidence and review status" icon={ShieldCheck}
      kpis={[
        { label: "Controls", value: rows.length },
        { label: "Met", value: rows.filter(r => r.status === "met").length },
        { label: "Open", value: rows.filter(r => r.status === "open").length },
        { label: "Exceptions", value: rows.filter(r => r.status === "exception").length },
      ]}
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Control</Button>}
      onExport={() => exportToCSV(rows, "compliance_register")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Framework</TableHead>
            <TableHead>Status</TableHead><TableHead>Last review</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No controls yet</TableCell></TableRow>
            : rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell>{r.framework}</TableCell>
                <TableCell><Badge variant={TONE[r.status] ?? "secondary"}>{r.status}</Badge></TableCell>
                <TableCell className="text-xs">{r.last_reviewed ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{["open", "in_progress", "met", "exception"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Control</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Framework</Label><Input value={form.framework} onChange={(e) => setForm({ ...form, framework: e.target.value })} /></div>
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleScaffold>
  );
}
