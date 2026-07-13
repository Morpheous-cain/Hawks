import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const AuditLog = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('audit_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setEntries(data || []);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = entries.filter(e =>
    !search ||
    e.action?.toLowerCase().includes(search.toLowerCase()) ||
    e.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
    e.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Tamper-evident record of every sensitive change across the platform."
        icon={ShieldCheck}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search action, entity, user..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
        <Badge variant="outline" className="ml-auto">{filtered.length} entries</Badge>
      </div>

      <Card className="bg-card/50 border-primary/20">
        <ScrollArea className="h-[600px]">
          {loading ? <p className="p-6 text-xs text-muted-foreground">Loading...</p> : filtered.length === 0 ? (
            <p className="p-6 text-xs text-muted-foreground">No audit entries. Run Phase 7 migration to enable, or perform an action that writes audit data.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border/50">
                <tr className="text-xs text-muted-foreground uppercase">
                  <th className="text-left px-3 py-2">Time</th>
                  <th className="text-left px-3 py-2">User</th>
                  <th className="text-left px-3 py-2">Action</th>
                  <th className="text-left px-3 py-2">Entity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(e.created_at), 'dd MMM HH:mm:ss')}</td>
                    <td className="px-3 py-2 text-xs">{e.user_email || '—'}</td>
                    <td className="px-3 py-2"><Badge variant="outline">{e.action}</Badge></td>
                    <td className="px-3 py-2 text-xs">{e.entity_type} <span className="text-muted-foreground">{e.entity_id?.slice(0, 8)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default AuditLog;
