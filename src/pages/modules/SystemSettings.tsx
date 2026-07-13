import { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { useToast } from "@/hooks/use-toast";
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Row { key: string; value: any; updated_at: string }

const DEFAULT_KEYS = [
  { key: "company.name", label: "Company Name", placeholder: "Black Hawk SOC-OS" },
  { key: "company.timezone", label: "Default Timezone", placeholder: "Africa/Nairobi" },
  { key: "company.currency", label: "Base Currency", placeholder: "KES" },
  { key: "company.fiscal_year_start", label: "Fiscal Year Start (MM-DD)", placeholder: "01-01" },
  { key: "billing.invoice_prefix", label: "Invoice Prefix", placeholder: "INV-" },
];

export default function SystemSettings() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<string, string>>({});
  const load = async () => {
    const { data } = await sb.from("sys_settings").select("*");
    const map: Record<string, string> = {};
    (data as Row[] ?? []).forEach(r => { map[r.key] = typeof r.value === "string" ? r.value : (r.value?.v ?? JSON.stringify(r.value)); });
    setRows(map);
  };
  useEffect(() => { load(); }, []);

  const save = async (key: string) => {
    const value = rows[key] ?? "";
    const { error } = await sb.from("sys_settings").upsert({ key, value: { v: value }, updated_at: new Date().toISOString() });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
  };

  return (
    <ModuleScaffold
      title="System Settings" description="Tenant-level configuration" icon={Settings}
      kpis={[
        { label: "Keys", value: DEFAULT_KEYS.length },
        { label: "Configured", value: Object.values(rows).filter(Boolean).length },
        { label: "Pending", value: DEFAULT_KEYS.length - Object.values(rows).filter(Boolean).length },
        { label: "Tenant", value: rows["company.name"] || "Black Hawk" },
      ]}
    >
      <Card className="p-4 space-y-4">
        {DEFAULT_KEYS.map(k => (
          <div key={k.key} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div className="md:col-span-1"><Label>{k.label}</Label><div className="text-xs text-muted-foreground font-mono">{k.key}</div></div>
            <Input className="md:col-span-1" placeholder={k.placeholder} value={rows[k.key] ?? ""} onChange={(e) => setRows(p => ({ ...p, [k.key]: e.target.value }))} />
            <div><Button size="sm" variant="outline" onClick={() => save(k.key)}><Save className="h-3 w-3 mr-1" />Save</Button></div>
          </div>
        ))}
      </Card>
    </ModuleScaffold>
  );
}
