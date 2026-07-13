import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

export const SiteAuditChecklist = () => {
  const { staffRecord, assignedSites } = useOfficerAssignments();
  const [audits, setAudits] = useState<any[]>([]);
  const [form, setForm] = useState({ score: 80, corrective_actions: "" });
  const siteId = (assignedSites as any)?.[0]?.id;

  const load = async () => {
    const { data } = await (supabase as any).from("site_audits").select("*").order("conducted_at", { ascending: false }).limit(20);
    setAudits(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const grade = form.score >= 90 ? "A" : form.score >= 80 ? "B" : form.score >= 70 ? "C" : "D";
    const { error } = await (supabase as any).from("site_audits").insert({
      site_id: siteId, auditor_staff_id: staffRecord?.id, score: form.score, grade,
      corrective_actions: form.corrective_actions,
    });
    if (error) return toast.error(error.message);
    toast.success("Audit submitted"); setForm({ score: 80, corrective_actions: "" }); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" /> New Site Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Score (0-100)</Label><Input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: +e.target.value })} /></div>
          <div><Label>Corrective Actions</Label><Textarea rows={3} value={form.corrective_actions} onChange={(e) => setForm({ ...form, corrective_actions: e.target.value })} /></div>
          <Button onClick={submit} className="w-full">Submit Audit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Audit History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {audits.length === 0 && <p className="text-xs text-muted-foreground">No audits.</p>}
          {audits.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <span>{new Date(a.conducted_at).toLocaleDateString()}</span>
              <Badge variant="outline">{a.grade ?? "—"} · {a.score ?? 0}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteAuditChecklist;
