import { useEffect, useState } from "react";
import { FileText, Plus, Check } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { useToast } from "@/hooks/use-toast";
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV } from "@/utils/exportData";

const Schema = z.object({ code: z.string().min(1), title: z.string().min(1), version: z.string(), body: z.string().optional() });

type Policy = { id: string; code: string; title: string; version: string; body: string | null; effective_from: string };

export default function PolicyLibrary() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Policy[]>([]);
  const [acks, setAcks] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", version: "1.0", body: "" });

  const load = async () => {
    const { data } = await sb.from("gov_policies").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Policy[]);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const { data: a } = await sb.from("gov_policy_acks").select("policy_id").eq("user_id", u.user.id);
      setAcks(new Set((a ?? []).map((x: any) => x.policy_id)));
    }
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("gov_policies-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "gov_policies" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    const parsed = Schema.safeParse(form);
    if (!parsed.success) { toast({ title: parsed.error.issues[0].message, variant: "destructive" }); return; }
    const { error } = await sb.from("gov_policies").insert(parsed.data);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "Policy published" }); setOpen(false);
  };

  const ack = async (policy_id: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await sb.from("gov_policy_acks").insert({ policy_id, user_id: u.user.id });
    if (error && !error.message.includes("duplicate")) { toast({ title: error.message, variant: "destructive" }); return; }
    setAcks((prev) => new Set(prev).add(policy_id));
    toast({ title: "Acknowledged" });
  };

  return (
    <ModuleScaffold
      title="Policy Library" description="Policies, versions and user acknowledgements" icon={FileText}
      kpis={[
        { label: "Policies", value: rows.length },
        { label: "My Acks", value: acks.size },
        { label: "Pending", value: rows.length - acks.size },
        { label: "Latest", value: rows[0]?.version ?? "—" },
      ]}
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Publish Policy</Button>}
      onExport={() => exportToCSV(rows, "policies")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Version</TableHead>
            <TableHead>Effective</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No policies published</TableCell></TableRow>
            : rows.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.code}</TableCell>
                <TableCell>{p.title}</TableCell>
                <TableCell>{p.version}</TableCell>
                <TableCell className="text-xs">{p.effective_from}</TableCell>
                <TableCell className="text-right">
                  {acks.has(p.id)
                    ? <span className="text-xs text-green-600 inline-flex items-center"><Check className="h-3 w-3 mr-1" />Acknowledged</span>
                    : <Button size="sm" variant="outline" onClick={() => ack(p.id)}>Acknowledge</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Publish Policy</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Version</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></div>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Body</Label><Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit}>Publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleScaffold>
  );
}
