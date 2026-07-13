import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, Search, AlertTriangle, Shield, FileText } from "lucide-react";
import { toast } from "sonner";

export default function SOPLibrary() {
  const [loading, setLoading] = useState(true);
  const [sops, setSops] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedSop, setSelectedSop] = useState<any>(null);
  const [formData, setFormData] = useState({
    incident_type: "",
    default_severity: "medium",
    response_time_target_minutes: 15,
    escalation_time_minutes: 30,
    default_units_required: 1,
    requires_supervisor_approval: false,
    requires_police_notification: false,
    requires_cctv_review: false,
    auto_create_investigation: false,
    steps: [] as { step: string; order: number }[],
  });
  const [newStep, setNewStep] = useState("");

  useEffect(() => {
    fetchSops();
  }, []);

  const fetchSops = async () => {
    const { data } = await supabase.from("sop_configurations")
      .select("*").order("incident_type", { ascending: true });
    setSops(data || []);
    setLoading(false);
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { step: newStep.trim(), order: prev.steps.length + 1 }],
    }));
    setNewStep("");
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      steps: formData.steps as any,
      mandatory_fields: [] as any,
    };
    const { error } = await supabase.from("sop_configurations").insert([payload]);
    if (error) { toast.error(error.message); return; }
    toast.success("SOP created");
    setOpen(false);
    setFormData({ incident_type: "", default_severity: "medium", response_time_target_minutes: 15, escalation_time_minutes: 30, default_units_required: 1, requires_supervisor_approval: false, requires_police_notification: false, requires_cctv_review: false, auto_create_investigation: false, steps: [] });
    fetchSops();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("sop_configurations").update({ active: !active }).eq("id", id);
    toast.success(active ? "SOP deactivated" : "SOP activated");
    fetchSops();
  };

  if (loading) return <LoadingPulse />;

  const filtered = sops.filter(s => s.incident_type?.toLowerCase().includes(search.toLowerCase()));
  const activeSops = sops.filter(s => s.active).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={BookOpen} title="SOP Library" description="Standard Operating Procedures for incident types" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create SOP</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Standard Operating Procedure</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Incident Type *</Label><Input required value={formData.incident_type} onChange={e => setFormData({ ...formData, incident_type: e.target.value })} placeholder="e.g., Intrusion, Fire, Medical" /></div>
                <div className="space-y-2"><Label>Default Severity</Label>
                  <Select value={formData.default_severity} onValueChange={v => setFormData({ ...formData, default_severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Response Time (min)</Label><Input type="number" value={formData.response_time_target_minutes} onChange={e => setFormData({ ...formData, response_time_target_minutes: parseInt(e.target.value) || 15 })} /></div>
                <div className="space-y-2"><Label>Escalation Time (min)</Label><Input type="number" value={formData.escalation_time_minutes} onChange={e => setFormData({ ...formData, escalation_time_minutes: parseInt(e.target.value) || 30 })} /></div>
                <div className="space-y-2"><Label>Units Required</Label><Input type="number" value={formData.default_units_required} onChange={e => setFormData({ ...formData, default_units_required: parseInt(e.target.value) || 1 })} /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2"><Switch checked={formData.requires_supervisor_approval} onCheckedChange={v => setFormData({ ...formData, requires_supervisor_approval: v })} /><Label>Requires Supervisor Approval</Label></div>
                <div className="flex items-center gap-2"><Switch checked={formData.requires_police_notification} onCheckedChange={v => setFormData({ ...formData, requires_police_notification: v })} /><Label>Requires Police Notification</Label></div>
                <div className="flex items-center gap-2"><Switch checked={formData.requires_cctv_review} onCheckedChange={v => setFormData({ ...formData, requires_cctv_review: v })} /><Label>Requires CCTV Review</Label></div>
                <div className="flex items-center gap-2"><Switch checked={formData.auto_create_investigation} onCheckedChange={v => setFormData({ ...formData, auto_create_investigation: v })} /><Label>Auto-Create Investigation</Label></div>
              </div>
              <div className="space-y-2">
                <Label>SOP Steps</Label>
                <div className="flex gap-2">
                  <Input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a step..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStep())} />
                  <Button type="button" onClick={addStep} variant="outline">Add</Button>
                </div>
                <div className="space-y-1">
                  {formData.steps.map((step, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted rounded px-3 py-2 text-sm">
                      <span>{i + 1}. {step.step}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(i)} className="text-destructive">×</Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create SOP</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total SOPs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sops.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{activeSops}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Inactive</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-muted-foreground">{sops.length - activeSops}</div></CardContent></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search SOPs..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(sop => {
          const steps = typeof sop.steps === 'string' ? JSON.parse(sop.steps) : (sop.steps || []);
          return (
            <Card key={sop.id} className={!sop.active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{sop.incident_type}</CardTitle>
                  <Badge variant={sop.active ? "default" : "secondary"}>{sop.active ? "Active" : "Inactive"}</Badge>
                </div>
                <CardDescription>
                  Severity: {sop.default_severity} | Response: {sop.response_time_target_minutes}min | Units: {sop.default_units_required}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {sop.requires_supervisor_approval && <Badge variant="outline" className="text-xs">Supervisor Approval</Badge>}
                  {sop.requires_police_notification && <Badge variant="outline" className="text-xs">Police Notify</Badge>}
                  {sop.requires_cctv_review && <Badge variant="outline" className="text-xs">CCTV Review</Badge>}
                  {sop.auto_create_investigation && <Badge variant="outline" className="text-xs">Auto-Investigation</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{steps.length} steps defined</div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => toggleActive(sop.id, sop.active)}>
                  {sop.active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
