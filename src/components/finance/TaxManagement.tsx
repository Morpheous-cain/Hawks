import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TaxManagementProps {
  finances: any[];
}

export default function TaxManagement({ finances }: TaxManagementProps) {
  const invoices = finances.filter(f => f.document_type === "invoice");
  const expenses = finances.filter(f => f.document_type === "expense");

  const vatCollected = invoices.reduce((s, i) => s + (i.tax_amount || 0), 0);
  const vatPaid = expenses.reduce((s, e) => s + (e.tax_amount || 0), 0);
  const netVat = vatCollected - vatPaid;

  const quarterlyData = useMemo(() => {
    const quarters: Record<string, { collected: number; paid: number; invoiceCount: number }> = {};
    invoices.forEach(inv => {
      const d = new Date(inv.invoice_date);
      const q = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
      if (!quarters[q]) quarters[q] = { collected: 0, paid: 0, invoiceCount: 0 };
      quarters[q].collected += inv.tax_amount || 0;
      quarters[q].invoiceCount++;
    });
    expenses.forEach(exp => {
      const d = new Date(exp.invoice_date);
      const q = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
      if (!quarters[q]) quarters[q] = { collected: 0, paid: 0, invoiceCount: 0 };
      quarters[q].paid += exp.tax_amount || 0;
    });
    return Object.entries(quarters).sort().reverse();
  }, [finances]);

  const whtRecords = invoices.filter(i => (i.tax_amount || 0) > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tax Management</h3>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">VAT Collected (Output)</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">KES {vatCollected.toLocaleString()}</div><p className="text-xs text-muted-foreground">{invoices.filter(i => (i.tax_amount || 0) > 0).length} taxable invoices</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">VAT Paid (Input)</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">KES {vatPaid.toLocaleString()}</div><p className="text-xs text-muted-foreground">{expenses.filter(e => (e.tax_amount || 0) > 0).length} taxable expenses</p></CardContent>
        </Card>
        <Card className={netVat > 0 ? "border-destructive/30" : ""}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Net VAT {netVat > 0 ? "Payable" : "Refundable"}</CardTitle></CardHeader>
          <CardContent><div className={`text-xl font-bold ${netVat > 0 ? "text-destructive" : "text-emerald-400"}`}>KES {Math.abs(netVat).toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Quarterly Summary */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Quarterly VAT Summary (KRA-Ready)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead><TableHead>Output VAT</TableHead><TableHead>Input VAT</TableHead>
                <TableHead>Net VAT</TableHead><TableHead>Invoices</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarterlyData.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No tax data</TableCell></TableRow>
              ) : quarterlyData.map(([quarter, data]) => {
                const net = data.collected - data.paid;
                return (
                  <TableRow key={quarter}>
                    <TableCell className="font-medium">{quarter}</TableCell>
                    <TableCell>KES {data.collected.toLocaleString()}</TableCell>
                    <TableCell>KES {data.paid.toLocaleString()}</TableCell>
                    <TableCell className={net > 0 ? "text-destructive font-medium" : "text-emerald-400 font-medium"}>
                      KES {Math.abs(net).toLocaleString()} {net > 0 ? "payable" : "refundable"}
                    </TableCell>
                    <TableCell>{data.invoiceCount}</TableCell>
                    <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* WHT Records */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Withholding Tax Records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead>
                <TableHead>Amount</TableHead><TableHead>Tax</TableHead><TableHead>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {whtRecords.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No WHT records</TableCell></TableRow>
              ) : whtRecords.slice(0, 20).map(rec => (
                <TableRow key={rec.id}>
                  <TableCell className="font-mono text-sm">{rec.invoice_number}</TableCell>
                  <TableCell>{rec.clients?.legal_name || "—"}</TableCell>
                  <TableCell>{rec.invoice_date ? format(new Date(rec.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>KES {Number(rec.amount).toLocaleString()}</TableCell>
                  <TableCell>KES {Number(rec.tax_amount).toLocaleString()}</TableCell>
                  <TableCell>{rec.amount > 0 ? ((rec.tax_amount / rec.amount) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
