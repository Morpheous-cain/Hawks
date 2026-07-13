import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface ClientStatementsProps {
  finances: any[];
  deposits: any[];
  clients: any[];
}

export default function ClientStatements({ finances, deposits, clients }: ClientStatementsProps) {
  const [selectedClient, setSelectedClient] = useState("");

  const clientRecords = useMemo(() => {
    if (!selectedClient) return [];
    return finances.filter(f => f.client_id === selectedClient).sort((a, b) =>
      new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime()
    );
  }, [selectedClient, finances]);

  const clientDeposits = useMemo(() => {
    if (!selectedClient) return [];
    return deposits.filter(d => d.client_id === selectedClient);
  }, [selectedClient, deposits]);

  const runningBalance = useMemo(() => {
    let balance = 0;
    return clientRecords.map(rec => {
      if (rec.document_type === "payment" || rec.document_type === "credit_note") {
        balance -= rec.amount || 0;
      } else if (rec.document_type === "invoice") {
        balance += rec.amount || 0;
      }
      return { ...rec, running_balance: balance };
    });
  }, [clientRecords]);

  const totalOwed = runningBalance.length > 0 ? runningBalance[runningBalance.length - 1].running_balance : 0;
  const clientName = clients.find(c => c.id === selectedClient)?.legal_name || "Client";

  const downloadStatement = () => {
    if (!selectedClient) return;
    const doc = new jsPDF("p", "mm", "a4");
    
    doc.setFontSize(18); doc.setTextColor(30, 58, 95);
    doc.text("BLACK HAWK SOC-OS", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text("Client Account Statement", 14, 27);

    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`Client: ${clientName}`, 14, 40);
    doc.text(`Date: ${format(new Date(), "dd MMM yyyy")}`, 14, 47);
    doc.text(`Balance: KES ${totalOwed.toLocaleString()}`, 14, 54);

    doc.setDrawColor(30, 58, 95); doc.setLineWidth(0.5);
    doc.line(14, 60, 196, 60);

    autoTable(doc, {
      startY: 65,
      head: [["Date", "Reference", "Type", "Debit", "Credit", "Balance"]],
      body: runningBalance.map(r => [
        r.invoice_date ? format(new Date(r.invoice_date), "dd MMM yyyy") : "—",
        r.invoice_number || "—",
        (r.document_type || "invoice").toUpperCase(),
        r.document_type === "invoice" ? `KES ${Number(r.amount).toLocaleString()}` : "",
        r.document_type !== "invoice" ? `KES ${Number(r.amount).toLocaleString()}` : "",
        `KES ${r.running_balance.toLocaleString()}`
      ]),
      theme: "grid",
      headStyles: { fillColor: [30, 58, 95], textColor: 255 },
      styles: { fontSize: 9 },
    });

    doc.save(`Statement-${clientName.replace(/\s+/g, "-")}-${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("Statement downloaded");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Client Statements</h3>
        <div className="flex gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}</SelectContent>
          </Select>
          {selectedClient && (
            <Button variant="outline" onClick={downloadStatement}>
              <Download className="h-4 w-4 mr-2" />Download PDF
            </Button>
          )}
        </div>
      </div>

      {!selectedClient ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />Select a client to view their account statement</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total Invoiced</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">KES {clientRecords.filter(r => r.document_type === "invoice").reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total Paid</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold text-emerald-400">KES {clientRecords.filter(r => r.document_type === "payment").reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Balance Owing</CardTitle></CardHeader>
              <CardContent><div className={`text-xl font-bold ${totalOwed > 0 ? "text-destructive" : "text-emerald-400"}`}>KES {totalOwed.toLocaleString()}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Type</TableHead>
                    <TableHead>Debit</TableHead><TableHead>Credit</TableHead><TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runningBalance.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions</TableCell></TableRow>
                  ) : runningBalance.map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell>{rec.invoice_date ? format(new Date(rec.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{rec.invoice_number}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{rec.document_type}</Badge></TableCell>
                      <TableCell>{rec.document_type === "invoice" ? `KES ${Number(rec.amount).toLocaleString()}` : ""}</TableCell>
                      <TableCell className="text-emerald-400">{rec.document_type !== "invoice" ? `KES ${Number(rec.amount).toLocaleString()}` : ""}</TableCell>
                      <TableCell className={`font-medium ${rec.running_balance > 0 ? "text-destructive" : "text-emerald-400"}`}>KES {rec.running_balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {clientDeposits.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Deposits & Retainers</CardTitle></CardHeader>
              <CardContent>
                {clientDeposits.map(dep => (
                  <div key={dep.id} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-sm capitalize">{dep.deposit_type} - {dep.reference_number || "N/A"}</span>
                    <span className="text-sm font-medium">Balance: KES {Number(dep.balance).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
