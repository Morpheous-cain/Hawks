import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { ModuleScaffold } from "@/components/platform/ModuleScaffold";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToCSV } from "@/utils/exportData";

type Slip = { staff_id: string; paye: number; nhif: number; nssf: number; nita: number; staff?: { full_name: string; staff_id: string; kra_pin: string | null; nhif_number: string | null; nssf_number: string | null } };
type Run = { id: string; period_month: string };

export default function StatutoryReturns() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState("");
  const [slips, setSlips] = useState<Slip[]>([]);

  useEffect(() => {
    sb.from("pay_runs").select("id,period_month").order("period_month", { ascending: false })
      .then(({ data }) => { setRuns((data ?? []) as Run[]); if (data?.[0]) setRunId(data[0].id); });
  }, []);
  useEffect(() => {
    if (!runId) return;
    sb.from("pay_payslips").select("staff_id,paye,nhif,nssf,nita,staff:staff_id(full_name,staff_id,kra_pin,nhif_number,nssf_number)").eq("run_id", runId)
      .then(({ data }) => setSlips((data ?? []) as Slip[]));
  }, [runId]);

  const totals = useMemo(() => slips.reduce((a, s) => ({
    paye: a.paye + Number(s.paye), nhif: a.nhif + Number(s.nhif),
    nssf: a.nssf + Number(s.nssf), nita: a.nita + Number(s.nita),
  }), { paye: 0, nhif: 0, nssf: 0, nita: 0 }), [slips]);

  return (
    <ModuleScaffold
      title="Statutory Returns" description="PAYE (P10), NHIF, NSSF and NITA filing schedules" icon={ShieldCheck}
      kpis={[
        { label: "PAYE", value: `KES ${totals.paye.toLocaleString()}` },
        { label: "NHIF", value: `KES ${totals.nhif.toLocaleString()}` },
        { label: "NSSF", value: `KES ${totals.nssf.toLocaleString()}` },
        { label: "NITA", value: `KES ${totals.nita.toLocaleString()}` },
      ]}
      actions={
        <Select value={runId} onValueChange={setRunId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Select run" /></SelectTrigger>
          <SelectContent>{runs.map(r => <SelectItem key={r.id} value={r.id}>{r.period_month}</SelectItem>)}</SelectContent>
        </Select>
      }
      onExport={() => exportToCSV(slips.map(s => ({
        staff_id: s.staff?.staff_id, name: s.staff?.full_name, kra_pin: s.staff?.kra_pin,
        nhif_number: s.staff?.nhif_number, nssf_number: s.staff?.nssf_number,
        paye: s.paye, nhif: s.nhif, nssf: s.nssf, nita: s.nita,
      })), "statutory_p10")}
    >
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Staff</TableHead><TableHead>KRA PIN</TableHead><TableHead>NHIF</TableHead><TableHead>NSSF</TableHead>
            <TableHead className="text-right">PAYE</TableHead><TableHead className="text-right">NHIF</TableHead>
            <TableHead className="text-right">NSSF</TableHead><TableHead className="text-right">NITA</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {slips.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payroll data</TableCell></TableRow>
            : slips.map((s, i) => (
              <TableRow key={i}>
                <TableCell>{s.staff?.full_name}</TableCell>
                <TableCell className="text-xs">{s.staff?.kra_pin ?? "—"}</TableCell>
                <TableCell className="text-xs">{s.staff?.nhif_number ?? "—"}</TableCell>
                <TableCell className="text-xs">{s.staff?.nssf_number ?? "—"}</TableCell>
                <TableCell className="text-right">{Number(s.paye).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(s.nhif).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(s.nssf).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(s.nita).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </ModuleScaffold>
  );
}
