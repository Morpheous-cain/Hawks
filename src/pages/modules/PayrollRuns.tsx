import { useEffect, useState } from "react";
import { Banknote, Play, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { useToast } from "@/hooks/use-toast";
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV } from "@/utils/exportData";
import { computePayslip } from "@/utils/payrollCalc";

type Run = {
  id: string; period_month: string; status: string;
  total_gross: number; total_paye: number; total_nhif: number;
  total_nssf: number; total_nita: number; total_net: number; locked_at: string | null;
};

const TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary", processing: "outline", locked: "default", paid: "default",
};

export default function PayrollRuns() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Run[]>([]);
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7) + "-01");

  const load = async () => {
    const { data } = await sb.from("pay_runs").select("*").order("period_month", { ascending: false });
    setRows((data ?? []) as Run[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("pay_runs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "pay_runs" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const create = async () => {
    const { data: existing } = await sb.from("pay_runs").select("id").eq("period_month", period).maybeSingle();
    if (existing) { toast({ title: "Run exists for that month", variant: "destructive" }); return; }
    const { error } = await sb.from("pay_runs").insert({ period_month: period, status: "draft" });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    toast({ title: "Payroll run created" }); setOpen(false);
  };

  const process = async (run: Run) => {
    toast({ title: "Calculating payslips…" });
    const { data: staff } = await sb.from("staff").select("id,full_name").eq("status", "active");
    if (!staff?.length) { toast({ title: "No active staff", variant: "destructive" }); return; }
    const slips = staff.map((s) => {
      const basic = 25000 + Math.floor(Math.random() * 30000); // demo: TODO base on contract
      const allowances = Math.floor(basic * 0.1);
      const calc = computePayslip(basic, allowances);
      return { run_id: run.id, staff_id: s.id, ...calc };
    });
    await sb.from("pay_payslips").delete().eq("run_id", run.id);
    const { error } = await sb.from("pay_payslips").insert(slips);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    const totals = slips.reduce((acc, s) => ({
      total_gross: acc.total_gross + s.gross, total_paye: acc.total_paye + s.paye,
      total_nhif: acc.total_nhif + s.nhif, total_nssf: acc.total_nssf + s.nssf,
      total_nita: acc.total_nita + s.nita, total_net: acc.total_net + s.net,
    }), { total_gross: 0, total_paye: 0, total_nhif: 0, total_nssf: 0, total_nita: 0, total_net: 0 });
    await sb.from("pay_runs").update({ status: "processing", ...totals }).eq("id", run.id);
    toast({ title: `Processed ${slips.length} payslips` });
  };

  const lock = async (run: Run) => {
    await sb.from("pay_runs").update({ status: "locked", locked_at: new Date().toISOString() }).eq("id", run.id);
    toast({ title: "Run locked" });
  };

  return (
    <ModuleScaffold
      title="Payroll Runs" description="Monthly payroll processing — PAYE, NHIF, NSSF, NITA" icon={Banknote}
      kpis={[
        { label: "Total Runs", value: rows.length },
        { label: "Locked", value: rows.filter(r => r.status === "locked").length },
        { label: "Last Net", value: rows[0] ? `KES ${Number(rows[0].total_net).toLocaleString()}` : "—" },
        { label: "Last PAYE", value: rows[0] ? `KES ${Number(rows[0].total_paye).toLocaleString()}` : "—" },
      ]}
      actions={<Button size="sm" onClick={() => setOpen(true)}><Play className="h-4 w-4 mr-1" />New Run</Button>}
      onExport={() => exportToCSV(rows, "payroll_runs")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Period</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="text-right">PAYE</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No runs yet</TableCell></TableRow>
            : rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.period_month}</TableCell>
                <TableCell><Badge variant={TONE[r.status] ?? "secondary"}>{r.status}</Badge></TableCell>
                <TableCell className="text-right">{Number(r.total_gross).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(r.total_net).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(r.total_paye).toLocaleString()}</TableCell>
                <TableCell className="text-right space-x-1">
                  {r.status === "draft" && <Button size="sm" variant="outline" onClick={() => process(r)}>Process</Button>}
                  {r.status === "processing" && <Button size="sm" variant="outline" onClick={() => lock(r)}><Lock className="h-3 w-3 mr-1" />Lock</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Payroll Run</DialogTitle></DialogHeader>
          <div><Label>Period (month)</Label><Input type="month" value={period.slice(0,7)} onChange={(e) => setPeriod(e.target.value + "-01")} /></div>
          <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleScaffold>
  );
}
