import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV, exportToPDF } from "@/utils/exportData";
import { Button } from "@/components/ui/button";

type Slip = {
  id: string; staff_id: string; gross: number; paye: number; nhif: number;
  nssf: number; nita: number; net: number; staff?: { full_name: string; staff_id: string };
};
type Run = { id: string; period_month: string; status: string };

export default function Payslips() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState<string>("");
  const [slips, setSlips] = useState<Slip[]>([]);

  useEffect(() => {
    sb.from("pay_runs").select("*").order("period_month", { ascending: false })
      .then(({ data }) => { setRuns((data ?? []) as Run[]); if (data?.[0]) setRunId(data[0].id); });
  }, []);

  useEffect(() => {
    if (!runId) { setSlips([]); return; }
    sb.from("pay_payslips").select("*, staff:staff_id(full_name,staff_id)").eq("run_id", runId)
      .then(({ data }) => setSlips((data ?? []) as Slip[]));
  }, [runId]);

  const totals = useMemo(() => slips.reduce((a, s) => ({
    gross: a.gross + Number(s.gross), net: a.net + Number(s.net),
    paye: a.paye + Number(s.paye), stat: a.stat + Number(s.nhif) + Number(s.nssf) + Number(s.nita),
  }), { gross: 0, net: 0, paye: 0, stat: 0 }), [slips]);

  return (
    <ModuleScaffold
      title="Payslips" description="Per-officer payslips for the selected payroll run" icon={FileText}
      kpis={[
        { label: "Slips", value: slips.length },
        { label: "Gross", value: `KES ${totals.gross.toLocaleString()}` },
        { label: "PAYE", value: `KES ${totals.paye.toLocaleString()}` },
        { label: "Net", value: `KES ${totals.net.toLocaleString()}` },
      ]}
      actions={
        <Select value={runId} onValueChange={setRunId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Select run…" /></SelectTrigger>
          <SelectContent>{runs.map(r => <SelectItem key={r.id} value={r.id}>{r.period_month} · {r.status}</SelectItem>)}</SelectContent>
        </Select>
      }
      onExport={() => exportToCSV(slips, "payslips")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Staff</TableHead>
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">PAYE</TableHead>
            <TableHead className="text-right">NHIF</TableHead>
            <TableHead className="text-right">NSSF</TableHead>
            <TableHead className="text-right">NITA</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {slips.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payslips for this run</TableCell></TableRow>
            : slips.map(s => (
              <TableRow key={s.id}>
                <TableCell><div className="font-medium">{s.staff?.full_name ?? "—"}</div><div className="text-xs text-muted-foreground">{s.staff?.staff_id}</div></TableCell>
                <TableCell className="text-right">{Number(s.gross).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(s.paye).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(s.nhif).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(s.nssf).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(s.nita).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold">{Number(s.net).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => exportToPDF(slips, "payslips", "Payslip Schedule")}>PDF</Button>
      </div>
    </ModuleScaffold>
  );
}
