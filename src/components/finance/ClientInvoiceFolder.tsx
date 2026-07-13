import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  FolderOpen, Search, CheckCircle, AlertTriangle, Clock, Download,
  ChevronRight, User, FileText, TrendingUp, X
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ClientInvoiceFolderProps {
  records: any[];
  clients: any[];
  onRefresh: () => void;
}

export default function ClientInvoiceFolder({ records, clients, onRefresh }: ClientInvoiceFolderProps) {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const getEffectiveStatus = (rec: any) => {
    if (rec.payment_status === "paid") return "paid";
    if (rec.due_date && new Date(rec.due_date) < new Date()) return "overdue";
    return rec.payment_status || "pending";
  };

  // Build per-client summary
  const clientSummaries = useMemo(() => {
    const invoices = records.filter(r => (r.document_type || "invoice") === "invoice");
    const map = new Map<string, { client: any; invoices: any[]; paid: number; unpaid: number; overdue: number; totalOwed: number; totalPaid: number }>();

    invoices.forEach(inv => {
      const cid = inv.client_id;
      if (!cid) return;
      if (!map.has(cid)) {
        const client = clients.find(c => c.id === cid);
        map.set(cid, { client: client || { id: cid, legal_name: inv.clients?.legal_name || "Unknown" }, invoices: [], paid: 0, unpaid: 0, overdue: 0, totalOwed: 0, totalPaid: 0 });
      }
      const entry = map.get(cid)!;
      entry.invoices.push(inv);
      const status = getEffectiveStatus(inv);
      if (status === "paid") { entry.paid++; entry.totalPaid += inv.amount || 0; }
      else { entry.unpaid++; entry.totalOwed += inv.amount || 0; }
      if (status === "overdue") entry.overdue++;
    });

    return Array.from(map.values()).sort((a, b) => b.overdue - a.overdue || b.totalOwed - a.totalOwed);
  }, [records, clients]);

  const filteredClients = clientSummaries.filter(s =>
    s.client.legal_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Client folder detail
  const clientInvoices = useMemo(() => {
    if (!selectedClient) return [];
    return selectedClient.invoices.sort((a: any, b: any) =>
      new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
    );
  }, [selectedClient]);

  // Group by month for timeline view
  const monthlyBreakdown = useMemo(() => {
    if (!clientInvoices.length) return [];
    const months = new Map<string, { label: string; invoices: any[]; paid: number; unpaid: number; total: number }>();
    clientInvoices.forEach((inv: any) => {
      const key = inv.invoice_date?.substring(0, 7) || "unknown";
      const label = inv.invoice_date ? format(new Date(inv.invoice_date), "MMMM yyyy") : "Unknown";
      if (!months.has(key)) months.set(key, { label, invoices: [], paid: 0, unpaid: 0, total: 0 });
      const m = months.get(key)!;
      m.invoices.push(inv);
      m.total += inv.amount || 0;
      if (getEffectiveStatus(inv) === "paid") m.paid += inv.amount || 0;
      else m.unpaid += inv.amount || 0;
    });
    return Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [clientInvoices]);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("client_finances").update({ payment_status: "paid", payment_date: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as paid"); onRefresh(); }
  };

  const downloadStatement = () => {
    if (!selectedClient) return;
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(18); doc.setTextColor(30, 58, 95);
    doc.text("CLIENT ACCOUNT STATEMENT", 14, 20);
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(selectedClient.client.legal_name, 14, 30);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 36);
    doc.text(`Total Owed: KES ${selectedClient.totalOwed.toLocaleString()}`, 14, 42);
    doc.text(`Total Paid: KES ${selectedClient.totalPaid.toLocaleString()}`, 14, 48);

    const rows = clientInvoices.map((inv: any) => [
      inv.invoice_number,
      inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—",
      inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—",
      inv.description || "—",
      `KES ${Number(inv.amount).toLocaleString()}`,
      getEffectiveStatus(inv).toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 55,
      head: [["Invoice #", "Date", "Due", "Description", "Amount", "Status"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 95] },
      styles: { fontSize: 8 },
    });
    doc.save(`Statement-${selectedClient.client.legal_name.replace(/\s+/g, "_")}.pdf`);
    toast.success("Statement downloaded");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Client Invoice Folders
        </h3>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search client..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Client Folder Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">No clients with invoices found</CardContent>
          </Card>
        ) : filteredClients.map(summary => {
          const totalInv = summary.paid + summary.unpaid;
          const paidPct = totalInv > 0 ? (summary.paid / totalInv) * 100 : 0;
          return (
            <Card
              key={summary.client.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${summary.overdue > 0 ? "border-l-4 border-l-destructive" : summary.unpaid > 0 ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-emerald-500"}`}
              onClick={() => setSelectedClient(summary)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{summary.client.legal_name}</p>
                      <p className="text-xs text-muted-foreground">{totalInv} invoice{totalInv !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                </div>

                {/* Payment progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Payment Progress</span>
                    <span className="font-medium">{paidPct.toFixed(0)}%</span>
                  </div>
                  <Progress value={paidPct} className="h-2" />
                </div>

                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span>{summary.paid} paid</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span>{summary.unpaid} unpaid</span>
                  </div>
                  {summary.overdue > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                      <span className="text-destructive font-medium">{summary.overdue} overdue</span>
                    </div>
                  )}
                </div>

                {summary.totalOwed > 0 && (
                  <div className="mt-2 p-2 rounded bg-destructive/5 text-sm">
                    <span className="text-muted-foreground">Outstanding: </span>
                    <span className="font-bold text-destructive">KES {summary.totalOwed.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Client Folder Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={open => { if (!open) setSelectedClient(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  {selectedClient.client.legal_name}
                </DialogTitle>
              </DialogHeader>

              {/* Summary Stats */}
              <div className="grid gap-3 grid-cols-4 mt-2">
                <Card>
                  <CardContent className="pt-3 pb-2 text-center">
                    <p className="text-2xl font-bold">{selectedClient.invoices.length}</p>
                    <p className="text-xs text-muted-foreground">Total Invoices</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-500/30">
                  <CardContent className="pt-3 pb-2 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{selectedClient.paid}</p>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-xs font-medium">KES {selectedClient.totalPaid.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/30">
                  <CardContent className="pt-3 pb-2 text-center">
                    <p className="text-2xl font-bold text-amber-600">{selectedClient.unpaid}</p>
                    <p className="text-xs text-muted-foreground">Unpaid</p>
                    <p className="text-xs font-medium text-destructive">KES {selectedClient.totalOwed.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/30">
                  <CardContent className="pt-3 pb-2 text-center">
                    <p className="text-2xl font-bold text-destructive">{selectedClient.overdue}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={downloadStatement}>
                  <Download className="h-4 w-4 mr-1" />Download Statement
                </Button>
              </div>

              <Separator />

              {/* Monthly Breakdown Timeline */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Invoice Timeline by Month</h4>
                {monthlyBreakdown.map(([key, month]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {month.label}
                      </h5>
                      <div className="flex gap-3 text-xs">
                        {month.unpaid > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            KES {month.unpaid.toLocaleString()} unpaid
                          </Badge>
                        )}
                        {month.paid > 0 && (
                          <Badge variant="default" className="text-xs">
                            KES {month.paid.toLocaleString()} paid
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Days Overdue</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {month.invoices.map((inv: any) => {
                          const status = getEffectiveStatus(inv);
                          const age = inv.due_date ? Math.max(0, differenceInDays(new Date(), new Date(inv.due_date))) : 0;
                          const isOverdue = status === "overdue";
                          return (
                            <TableRow key={inv.id} className={isOverdue ? "bg-destructive/5" : status === "pending" ? "bg-amber-500/5" : ""}>
                              <TableCell className="font-mono text-sm font-semibold">{inv.invoice_number}</TableCell>
                              <TableCell className="text-sm">{inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM") : "—"}</TableCell>
                              <TableCell className={`text-sm ${isOverdue ? "text-destructive font-medium" : ""}`}>
                                {inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{inv.description || "—"}</TableCell>
                              <TableCell className="font-semibold">KES {Number(inv.amount).toLocaleString()}</TableCell>
                              <TableCell>
                                {status === "paid" ? (
                                  <span className="text-xs text-muted-foreground">—</span>
                                ) : age > 0 ? (
                                  <Badge variant={age > 60 ? "destructive" : "secondary"} className="font-mono text-xs">{age}d</Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Not yet due</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status === "paid" ? "default" : status === "overdue" ? "destructive" : "secondary"}>
                                  {status === "paid" ? "✓ Paid" : status === "overdue" ? "⚠ Overdue" : "⏳ Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {status !== "paid" && (
                                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 text-xs" onClick={() => markPaid(inv.id)}>
                                    <CheckCircle className="h-3 w-3 mr-1" />Mark Paid
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
