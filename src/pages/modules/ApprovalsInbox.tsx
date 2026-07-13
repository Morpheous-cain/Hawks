import { useEffect, useState } from "react";
import { ClipboardCheck, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { useToast } from "@/hooks/use-toast";
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/utils/exportData";

type Approval = {
  id: string; kind: string; title: string; amount: number | null; status: string;
  requested_by: string | null; approver_id: string | null; created_at: string;
};
const TONE: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary", approved: "default", rejected: "destructive",
};

export default function ApprovalsInbox() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Approval[]>([]);
  const load = async () => {
    const { data } = await sb.from("gov_approvals").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Approval[]);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("gov_approvals-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "gov_approvals" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { data: u } = await supabase.auth.getUser();
    await sb.from("gov_approvals").update({ status, approver_id: u.user?.id, decided_at: new Date().toISOString() }).eq("id", id);
    toast({ title: status });
  };

  return (
    <ModuleScaffold
      title="Approvals Inbox" description="Cross-module approval queue" icon={ClipboardCheck}
      kpis={[
        { label: "Total", value: rows.length },
        { label: "Pending", value: rows.filter(r => r.status === "pending").length },
        { label: "Approved", value: rows.filter(r => r.status === "approved").length },
        { label: "Rejected", value: rows.filter(r => r.status === "rejected").length },
      ]}
      onExport={() => exportToCSV(rows, "approvals")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Kind</TableHead><TableHead>Title</TableHead><TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nothing awaiting approval</TableCell></TableRow>
            : rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="capitalize">{r.kind}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell className="text-right">{r.amount ? `KES ${Number(r.amount).toLocaleString()}` : "—"}</TableCell>
                <TableCell><Badge variant={TONE[r.status] ?? "secondary"}>{r.status}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  {r.status === "pending" && (<>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, "approved")}><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}><X className="h-3 w-3" /></Button>
                  </>)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </ModuleScaffold>
  );
}
