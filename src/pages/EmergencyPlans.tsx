import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { ShieldAlert, Plus, Search, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function EmergencyPlans() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    site_id: "", plan_type: "fire", title: "", description: "", procedures: "",
    assembly_point: "", emergency_contacts: "", evacuation_routes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchPlans(), fetchSites()]);
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from("documents")
      .select("*, sites:site_id(site_name)")
      .eq("category", "emergency_plan")
      .order("created_at", { ascending: false });
    setPlans(data || []);
  };

  const fetchSites = async () => {
    const { data } = await supabase.from("sites").select("id, site_name");
    setSites(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const metadata = {
      plan_type: formData.plan_type,
      procedures: formData.procedures,
      assembly_point: formData.assembly_point,
      emergency_contacts: formData.emergency_contacts,
      evacuation_routes: formData.evacuation_routes,
    };
    const { error } = await supabase.from("documents").insert([{
      title: formData.title,
      description: formData.description,
      category: "emergency_plan" as any,
      site_id: formData.site_id || null,
      metadata,
      uploaded_by: user?.id,
      status: "active",
      file_name: "emergency_plan",
      file_url: "#",
      document_number: `EP-${Date.now()}`,
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Emergency plan created");
    setOpen(false);
    fetchPlans();
  };

  if (loading) return <LoadingPulse />;

  const filtered = plans.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    (p.sites as any)?.site_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getPlanMeta = (plan: any) => (plan.metadata || {}) as any;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader icon={ShieldAlert} title="Emergency Response Plans" description="Site-specific emergency procedures and evacuation plans" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Plan</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Emergency Response Plan</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Plan Title *</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Fire Evacuation Plan - Main Office" /></div>
                <div className="space-y-2"><Label>Plan Type</Label>
                  <Select value={formData.plan_type} onValueChange={v => setFormData({ ...formData, plan_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fire">Fire</SelectItem><SelectItem value="intrusion">Intrusion</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem><SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                      <SelectItem value="bomb_threat">Bomb Threat</SelectItem><SelectItem value="active_shooter">Active Shooter</SelectItem>
                      <SelectItem value="evacuation">General Evacuation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2"><Label>Site</Label>
                  <Select value={formData.site_id} onValueChange={v => setFormData({ ...formData, site_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>{sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief overview of this plan..." /></div>
              <div className="space-y-2"><Label>Procedures *</Label><Textarea required rows={5} value={formData.procedures} onChange={e => setFormData({ ...formData, procedures: e.target.value })} placeholder="Step-by-step emergency procedures..." /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Assembly Point</Label><Input value={formData.assembly_point} onChange={e => setFormData({ ...formData, assembly_point: e.target.value })} placeholder="Main car park area" /></div>
                <div className="space-y-2"><Label>Evacuation Routes</Label><Input value={formData.evacuation_routes} onChange={e => setFormData({ ...formData, evacuation_routes: e.target.value })} placeholder="Exit A, Exit B, Fire escape" /></div>
              </div>
              <div className="space-y-2"><Label>Emergency Contacts</Label><Textarea value={formData.emergency_contacts} onChange={e => setFormData({ ...formData, emergency_contacts: e.target.value })} placeholder="Police: 999, Fire: 112, Ambulance: 999..." /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Create Plan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Plans</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{plans.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sites Covered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{new Set(plans.filter(p => p.site_id).map(p => p.site_id)).size}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Plan Types</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Set(plans.map(p => getPlanMeta(p).plan_type)).size}</div></CardContent></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(plan => {
          const meta = getPlanMeta(plan);
          return (
            <Card key={plan.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedPlan(plan)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{plan.title}</CardTitle>
                  <Badge variant="outline" className="capitalize">{meta.plan_type || "general"}</Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{(plan.sites as any)?.site_name || "All Sites"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{plan.description || "No description"}</p>
                {meta.assembly_point && <p className="text-xs text-muted-foreground mt-2">Assembly: {meta.assembly_point}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPlan && (
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selectedPlan.title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">{getPlanMeta(selectedPlan).plan_type}</Badge>
                <Badge variant="secondary">{(selectedPlan.sites as any)?.site_name || "All Sites"}</Badge>
              </div>
              {selectedPlan.description && <p className="text-muted-foreground">{selectedPlan.description}</p>}
              <div><h4 className="font-semibold mb-2">Procedures</h4><p className="text-sm whitespace-pre-wrap">{getPlanMeta(selectedPlan).procedures}</p></div>
              {getPlanMeta(selectedPlan).assembly_point && <div><h4 className="font-semibold mb-1">Assembly Point</h4><p className="text-sm">{getPlanMeta(selectedPlan).assembly_point}</p></div>}
              {getPlanMeta(selectedPlan).evacuation_routes && <div><h4 className="font-semibold mb-1">Evacuation Routes</h4><p className="text-sm">{getPlanMeta(selectedPlan).evacuation_routes}</p></div>}
              {getPlanMeta(selectedPlan).emergency_contacts && <div><h4 className="font-semibold mb-1">Emergency Contacts</h4><p className="text-sm whitespace-pre-wrap">{getPlanMeta(selectedPlan).emergency_contacts}</p></div>}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
