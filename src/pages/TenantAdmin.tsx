import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Users, Shield, Globe, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TenantAdmin = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('tenants' as any).select('*').order('created_at', { ascending: false });
      setTenants(data || []);
    } catch {
      setTenants([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createTenant = async () => {
    if (!newSlug || !newName) return;
    try {
      const { error } = await supabase.from('tenants' as any).insert({ slug: newSlug, name: newName });
      if (error) throw error;
      toast({ title: "Tenant created", description: `${newName} added.` });
      setNewSlug(""); setNewName("");
      load();
    } catch (e: any) {
      toast({ title: "Could not create tenant", description: e.message || "Run Phase 7 migration first.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Tenant Administration"
        description="Manage SaaS tenants, branding, and members. Each tenant operates an isolated Black Hawk SOC-OS instance."
        icon={Building2}
      />

      <Card className="p-4 bg-amber-500/5 border-amber-500/30">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Database Migration Required</div>
            <p className="text-xs text-muted-foreground mt-1">Run <code className="bg-muted/40 px-1.5 py-0.5 rounded">PHASE7_MIGRATION.md</code> in the Cloud SQL Editor to enable tenant isolation.</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-primary/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" />Create Tenant</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="slug (e.g., g4s)" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
          <Input placeholder="Tenant name" value={newName} onChange={e => setNewName(e.target.value)} />
          <Button onClick={createTenant} disabled={!newSlug || !newName}>Create Tenant</Button>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-primary/20">
        <h3 className="font-semibold mb-3">Tenants</h3>
        {loading ? <p className="text-xs text-muted-foreground">Loading...</p> : tenants.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tenants yet. Create one above (or run the migration).</p>
        ) : (
          <div className="space-y-2">
            {tenants.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded bg-muted/20 border border-border/40">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {t.name}
                    {t.brand_color && <span className="w-3 h-3 rounded-full" style={{ background: t.brand_color }} />}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <code>{t.slug}</code>
                    {t.subdomain && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{t.subdomain}</span>}
                    <Badge variant="outline" className="text-[10px]">{t.plan}</Badge>
                  </div>
                </div>
                <Badge variant="outline" className={t.status === 'active' ? 'text-alert-normal border-alert-normal/40' : ''}>
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TenantAdmin;
