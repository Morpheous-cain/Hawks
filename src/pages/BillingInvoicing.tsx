import { useEffect, useState, useMemo, lazy, Suspense } from "react";

import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { useBillingInvoicing } from "@/hooks/useBillingInvoicing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, Plus, Search, DollarSign, Clock, CheckCircle, AlertTriangle, Download,
  FileText, Receipt, Wallet, TrendingDown, BarChart3, RefreshCw, Trash2, RotateCcw, Ban,
  LayoutDashboard, Repeat, Landmark, PiggyBank, Calculator, Scale, FileBarChart, ScrollText, FolderOpen,
  ShoppingCart, BellRing, TrendingUp, Users
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Lazy load sub-modules
const FinanceDashboard = lazy(() => import("@/components/finance/FinanceDashboard"));
const RecurringInvoices = lazy(() => import("@/components/finance/RecurringInvoices"));
const BankReconciliation = lazy(() => import("@/components/finance/BankReconciliation"));
const BudgetTracking = lazy(() => import("@/components/finance/BudgetTracking"));
const ClientDeposits = lazy(() => import("@/components/finance/ClientDeposits"));
const ContractBillingRules = lazy(() => import("@/components/finance/ContractBillingRules"));
const ClientStatements = lazy(() => import("@/components/finance/ClientStatements"));
const TaxManagement = lazy(() => import("@/components/finance/TaxManagement"));
const ClientInvoiceFolder = lazy(() => import("@/components/finance/ClientInvoiceFolder"));
const PurchaseOrders = lazy(() => import("@/components/finance/PurchaseOrders"));
const PaymentReminders = lazy(() => import("@/components/finance/PaymentReminders"));
const ProfitLossReport = lazy(() => import("@/components/finance/ProfitLossReport"));
const PayrollSummary = lazy(() => import("@/components/finance/PayrollSummary"));

type DocType = "invoice" | "quotation" | "payment" | "expense" | "credit_note";

interface LineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
}

const SERVICE_OPTIONS = [
  { value: "guarding", label: "Guarding Services" },
  { value: "cctv_installation", label: "CCTV Installation" },
  { value: "cctv_maintenance", label: "CCTV Maintenance" },
  { value: "alarm_installation", label: "Alarm System Installation" },
  { value: "alarm_maintenance", label: "Alarm System Maintenance" },
  { value: "alarm_monitoring", label: "Alarm Monitoring Services" },
  { value: "access_control", label: "Access Control System" },
  { value: "electric_fence", label: "Electric Fence" },
  { value: "patrol_services", label: "Patrol Services" },
  { value: "escort_services", label: "Escort & VIP Protection" },
  { value: "event_security", label: "Event Security" },
  { value: "k9_services", label: "K9 Unit Services" },
  { value: "investigation", label: "Investigation Services" },
  { value: "risk_assessment", label: "Risk Assessment & Consulting" },
  { value: "bodycam", label: "Body Camera Equipment" },
  { value: "equipment_supply", label: "Security Equipment Supply" },
  { value: "training", label: "Security Training" },
  { value: "consultancy", label: "Security Consultancy" },
  { value: "other", label: "Other" },
];

const newLineItem = (): LineItem => ({ id: crypto.randomUUID(), category: "", description: "", quantity: 1, unit_price: 0 });

const DOC_PREFIXES: Record<DocType, string> = {
  invoice: "INV", quotation: "QT", payment: "PAY", expense: "EXP", credit_note: "CN",
};
const DOC_LABELS: Record<DocType, string> = {
  invoice: "Invoice", quotation: "Quotation", payment: "Payment", expense: "Expense", credit_note: "Credit Note",
};

function generateDocNumber(type: DocType) {
  const now = new Date();
  const prefix = DOC_PREFIXES[type];
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const r = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${prefix}-${y}${m}-${r}`;
}

const SubLoader = () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

export default function BillingInvoicing() {
  // ---- Centralized data + realtime + mutations (template pattern) ----
  // All fetches, channel subs, and CRUD live in `useBillingInvoicing`.
  // This page stays a presentational/UI-state component.
  const { data: bData, loading, actions } = useBillingInvoicing();
  const records = bData.records;
  const clients = bData.clients;
  const recurringItems = bData.recurringItems;
  const bankItems = bData.bankItems;
  const budgetItems = bData.budgetItems;
  const depositItems = bData.depositItems;
  const billingRules = bData.billingRules;
  const currencyRates = bData.currencyRates;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [docTab, setDocTab] = useState<DocType>("invoice");
  const [open, setOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [reversalDialog, setReversalDialog] = useState<{ open: boolean; id: string; invoiceNumber: string }>({ open: false, id: "", invoiceNumber: "" });
  const [reversalReason, setReversalReason] = useState("Bounced cheque");
  const TAX_BRACKETS = [
    { label: "No Tax (0%)", value: "0" },
    { label: "VAT 16%", value: "16" },
    { label: "WHT 3%", value: "3" },
    { label: "WHT 5%", value: "5" },
    { label: "WHT 10%", value: "10" },
    { label: "WHT 20%", value: "20" },
    { label: "Catering Levy 2%", value: "2" },
    { label: "Custom Rate", value: "custom" },
  ];

  const defaultDueDate = (invoiceDate: string) => format(addDays(new Date(invoiceDate), 30), "yyyy-MM-dd");

  const [formData, setFormData] = useState({
    client_id: "", invoice_date: format(new Date(), "yyyy-MM-dd"), due_date: defaultDueDate(format(new Date(), "yyyy-MM-dd")),
    amount: 0, tax_percent: "16", tax_amount: 0, discount_amount: 0, notes: "",
    category: "", currency: "KES",
    payment_status: "pending" as "paid" | "pending" | "overdue",
  });

  const handleInvoiceDateChange = (newDate: string) => {
    setFormData(prev => ({ ...prev, invoice_date: newDate, due_date: defaultDueDate(newDate) }));
  };

  const handleTaxBracketChange = (percent: string) => {
    if (percent === "custom") {
      setFormData(prev => ({ ...prev, tax_percent: "custom" }));
    } else {
      const p = parseFloat(percent) || 0;
      const taxAmt = Math.round((formData.amount * p) / 100 * 100) / 100;
      setFormData(prev => ({ ...prev, tax_percent: percent, tax_amount: taxAmt }));
    }
  };

  const handleAmountChange = (newAmount: number) => {
    const p = formData.tax_percent === "custom" ? 0 : parseFloat(formData.tax_percent) || 0;
    const taxAmt = formData.tax_percent === "custom" ? formData.tax_amount : Math.round((newAmount * p) / 100 * 100) / 100;
    setFormData(prev => ({ ...prev, amount: newAmount, tax_amount: taxAmt }));
  };

  // Data fetching, realtime subs, and table mutations are all handled
  // by `useBillingInvoicing()` above. A manual reload escape hatch is
  // exposed via `actions.reload()` if a tab needs forced sync.
  const fetchRecords = actions.reload;
  const fetchRecurring = actions.reload;
  const fetchBank = actions.reload;
  const fetchBudgets = actions.reload;
  const fetchDeposits = actions.reload;
  const fetchBillingRules = actions.reload;

  const resetForm = () => {
    setFormData({
      client_id: "", invoice_date: format(new Date(), "yyyy-MM-dd"), due_date: defaultDueDate(format(new Date(), "yyyy-MM-dd")),
      amount: 0, tax_percent: "16", tax_amount: 0, discount_amount: 0, notes: "", category: "", currency: "KES",
      payment_status: "pending",
    });
    setLineItems([newLineItem()]);
  };

  const lineItemsSubtotal = useMemo(() => lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0), [lineItems]);

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(li => {
      if (li.id !== id) return li;
      const updated = { ...li, [field]: value };
      if (field === "category") {
        const opt = SERVICE_OPTIONS.find(o => o.value === value);
        updated.description = opt?.label || "";
      }
      return updated;
    }));
  };

  const addLineItem = () => setLineItems(prev => [...prev, newLineItem()]);
  const removeLineItem = (id: string) => setLineItems(prev => prev.length > 1 ? prev.filter(li => li.id !== id) : prev);

  // Sync subtotal → amount whenever lineItems change
  useEffect(() => {
    const sub = lineItemsSubtotal;
    setFormData(prev => {
      const p = prev.tax_percent === "custom" ? 0 : parseFloat(prev.tax_percent) || 0;
      const taxAmt = prev.tax_percent === "custom" ? prev.tax_amount : Math.round((sub * p) / 100 * 100) / 100;
      return { ...prev, amount: sub, tax_amount: taxAmt };
    });
  }, [lineItemsSubtotal]);

  /**
   * Submit handler — builds the document payload from line items + form
   * state, then delegates persistence to `actions.createRecord`. All
   * validation, numbering, ageing, and toast feedback happen inside
   * the hook so this component stays presentational.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const subtotal = lineItemsSubtotal;
    if (subtotal <= 0 && docTab !== "expense") {
      toast.error("Add at least one line item with a price");
      return;
    }

    const totalAmount = subtotal + formData.tax_amount - formData.discount_amount;

    // Build a human-readable description from the line-items grid.
    const descriptionLines = lineItems
      .filter(li => li.quantity > 0 && li.unit_price > 0)
      .map((li, i) => `${i + 1}. ${li.description || "Item"} — Qty: ${li.quantity} × ${formData.currency} ${li.unit_price.toLocaleString()} = ${formData.currency} ${(li.quantity * li.unit_price).toLocaleString()}`)
      .join("\n");
    const categories = [...new Set(lineItems.map(li => li.category).filter(Boolean))].join(", ");

    const ok = await actions.createRecord({
      client_id: formData.client_id || null,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date || null,
      amount: totalAmount,
      base_amount: subtotal,
      tax_amount: formData.tax_amount,
      discount_amount: formData.discount_amount,
      currency: formData.currency,
      document_type: docTab,
      payment_status: formData.payment_status,
      description: descriptionLines || null,
      notes: formData.notes || null,
      category: categories || formData.category || null,
    });

    if (ok) {
      resetForm();
      setOpen(false);
    }
  };

  // Thin pass-throughs to keep call sites identical to the prior API.
  const deleteRecord = (id: string) => actions.deleteRecord(id);
  const updatePaymentStatus = (id: string, status: string, reason?: string) =>
    actions.updatePaymentStatus(id, status, reason);


  const downloadPDF = (rec: any) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;
    const clientName = rec.clients?.legal_name || "N/A";
    const docDate = rec.invoice_date ? format(new Date(rec.invoice_date), "dd/MM/yyyy") : "—";
    const dueDate = rec.due_date ? format(new Date(rec.due_date), "dd/MM/yyyy") : "—";
    const docLabel = DOC_LABELS[rec.document_type as DocType] || "Document";
    const cur = rec.currency || "KES";
    const totalAmount = rec.amount || 0;
    const taxAmount = rec.tax_amount || 0;
    const discountAmount = rec.discount_amount || 0;
    const subtotal = totalAmount - taxAmount + discountAmount;
    const balanceDue = rec.payment_status === "paid" ? 0 : totalAmount;

    // --- Try to load logo ---
    try {
      const logo = new Image();
      logo.src = "/images/black-hawk-logo.jpg";
      doc.addImage(logo, "JPEG", 14, 10, 30, 30);
    } catch { /* logo skipped if not available */ }

    // --- Header: logo only (text removed) ---

    // --- Document type label (top right) ---
    doc.setFontSize(22); doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.text(docLabel.toUpperCase(), pageW - 14, 20, { align: "right" });

    // --- Invoice number ---
    doc.setFontSize(14); doc.setTextColor(80);
    doc.setFont("helvetica", "normal");
    doc.text(`# ${rec.invoice_number}`, pageW - 14, 28, { align: "right" });

    // --- Balance Due box (right side) ---
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(pageW - 80, 34, 66, 18, 2, 2, "F");
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text("Balance Due", pageW - 47, 40, { align: "center" });
    doc.setFontSize(14); doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`${cur}${balanceDue.toLocaleString()}`, pageW - 47, 49, { align: "center" });

    // --- Company info (left, below header) ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8); doc.setTextColor(80);
    doc.text("Black Hawk SOC-OS.", 14, 48);
    doc.text("Kenya", 14, 53);
    doc.text("admin@blackhawksecurity.co.ke", 14, 58);

    // --- Invoice details (right side) ---
    let infoY = 60;
    doc.setFontSize(9); doc.setTextColor(60);
    doc.text(`${docLabel} Date :`, pageW - 80, infoY);
    doc.text(docDate, pageW - 14, infoY, { align: "right" });
    infoY += 6;
    doc.text("Terms :", pageW - 80, infoY);
    doc.text("Due on Receipt", pageW - 14, infoY, { align: "right" });
    infoY += 6;
    doc.text("Due Date :", pageW - 80, infoY);
    doc.text(dueDate, pageW - 14, infoY, { align: "right" });

    // --- Divider ---
    doc.setDrawColor(30, 58, 95); doc.setLineWidth(0.5);
    doc.line(14, 78, pageW - 14, 78);

    // --- Bill To ---
    doc.setFontSize(10); doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To", 14, 86);
    doc.setFontSize(11); doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(clientName, 14, 93);

    // --- Parse line items from description ---
    const lineItemRows: string[][] = [];
    const descText = rec.description || "";
    const descLines = descText.split("\n").filter((l: string) => l.trim());

    if (descLines.length > 0 && descLines[0].match(/^\d+\./)) {
      // Multi-line item format: "1. Description — Qty: 2 × KES 50,000 = KES 100,000"
      descLines.forEach((line: string) => {
        const match = line.match(/^(\d+)\.\s*(.+?)\s*—\s*Qty:\s*([\d,.]+)\s*×\s*\w+\s*([\d,.]+)\s*=\s*\w+\s*([\d,.]+)/);
        if (match) {
          lineItemRows.push([
            match[1],
            match[2].trim(),
            match[3].replace(/,/g, ""),
            Number(match[4].replace(/,/g, "")).toLocaleString(),
            Number(match[5].replace(/,/g, "")).toLocaleString(),
          ]);
        } else {
          // Fallback: unnumbered line
          const num = line.match(/^(\d+)\.\s*(.*)/);
          lineItemRows.push([
            num ? num[1] : String(lineItemRows.length + 1),
            num ? num[2].trim() : line.trim(),
            "1",
            subtotal.toLocaleString(),
            subtotal.toLocaleString(),
          ]);
        }
      });
    } else {
      // Single item fallback
      lineItemRows.push(["1", descText || "Security Services", "1", subtotal.toLocaleString(), subtotal.toLocaleString()]);
    }

    // --- Items table ---
    autoTable(doc, {
      startY: 100,
      head: [["#", "Item & Description", "Qty", "Rate", "Amount"]],
      body: lineItemRows,
      theme: "plain",
      headStyles: {
        fillColor: [30, 58, 95],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { cellWidth: 90 },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "right", cellWidth: 30 },
      },
      styles: { lineColor: [220, 220, 220], lineWidth: 0.3 },
    });

    let finalY = (doc as any).lastAutoTable?.finalY || 180;

    // --- Totals as a table extension (right-aligned, matching item table width) ---
    const totalsBody: string[][] = [];
    totalsBody.push(["Sub Total:", `${subtotal.toLocaleString()}`]);
    if (taxAmount > 0) totalsBody.push(["VAT/Tax:", `${taxAmount.toLocaleString()}`]);
    if (discountAmount > 0) totalsBody.push(["Discount:", `-${discountAmount.toLocaleString()}`]);
    totalsBody.push(["Total:", `${cur}${totalAmount.toLocaleString()}`]);
    totalsBody.push(["Balance Due:", `${cur}${balanceDue.toLocaleString()}`]);

    autoTable(doc, {
      startY: finalY,
      body: totalsBody,
      theme: "plain",
      tableWidth: 80,
      margin: { left: pageW - 94 },
      bodyStyles: { fontSize: 9, cellPadding: 2.5, textColor: [60, 60, 60] },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: "normal" },
        1: { cellWidth: 40, halign: "right" },
      },
      styles: { lineColor: [220, 220, 220], lineWidth: 0.3 },
      didParseCell: (data: any) => {
        const rowIdx = data.row.index;
        const isTotalRow = rowIdx === totalsBody.length - 2;
        const isBalanceRow = rowIdx === totalsBody.length - 1;
        if (isTotalRow) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 10;
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fillColor = [240, 240, 240];
        }
        if (isBalanceRow) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 10;
          data.cell.styles.textColor = [30, 58, 95];
          data.cell.styles.fillColor = [230, 237, 247];
        }
      },
    });

    finalY = (doc as any).lastAutoTable?.finalY || finalY + 40;
    finalY += 8;

    // --- Notes ---
    if (rec.notes) {
      doc.setFontSize(10); doc.setTextColor(30, 58, 95);
      doc.setFont("helvetica", "bold");
      doc.text("Notes", 14, finalY);
      doc.setFontSize(9); doc.setTextColor(60);
      doc.setFont("helvetica", "normal");
      doc.text(rec.notes, 14, finalY + 6, { maxWidth: pageW / 2 - 20 });
      finalY += 14;
    }

    // --- Terms & Conditions ---
    doc.setFontSize(10); doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 14, finalY);
    finalY += 6;
    doc.setFontSize(8); doc.setTextColor(60);
    doc.setFont("helvetica", "bold");
    doc.text("Lipa Na M-Pesa", 14, finalY);
    doc.setFont("helvetica", "normal");
    finalY += 5;
    doc.text("Pay Bill", 14, finalY);
    finalY += 5;
    doc.text("Business Number: 247247", 14, finalY);
    finalY += 5;
    doc.text("Account: 0260284832013", 14, finalY);
    finalY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Kindly Note:", 14, finalY);
    doc.setFont("helvetica", "normal");
    finalY += 5;
    const terms = [
      "Client to provide adequate Sentry box & toilets.",
      "Deployment Time: depending on the days from contract signing.",
      "Uniform: As per client's request.",
      "Black Hawk SOC-OS will provide; Radios, LED Flashlights.",
    ];
    terms.forEach(t => {
      doc.text(`• ${t}`, 16, finalY);
      finalY += 5;
    });

    // --- Footer ---
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text("Thank you for your business.", 14, pageH - 12);
    doc.text("Black Hawk SOC-OS  |  admin@blackhawksecurity.co.ke", 14, pageH - 8);

    doc.save(`${rec.invoice_number || "document"}.pdf`);
    toast.success("PDF downloaded");
  };

  const byType = (type: string) => records.filter(r => (r.document_type || "invoice") === type);

  const agingBuckets = useMemo(() => {
    const invoices = byType("invoice");
    const buckets = { current: [] as any[], "1-30": [] as any[], "31-60": [] as any[], "61-90": [] as any[], "90+": [] as any[] };
    invoices.filter(i => i.payment_status !== "paid").forEach(inv => {
      const age = inv.ageing_days || 0;
      if (age === 0) buckets.current.push(inv);
      else if (age <= 30) buckets["1-30"].push(inv);
      else if (age <= 60) buckets["31-60"].push(inv);
      else if (age <= 90) buckets["61-90"].push(inv);
      else buckets["90+"].push(inv);
    });
    return buckets;
  }, [records]);

  // Invoice tracking stats — must be before early return
  const invoiceStats = useMemo(() => {
    const invoices = records.filter(r => (r.document_type || "invoice") === "invoice");
    const total = invoices.length;
    const paid = invoices.filter(i => i.payment_status === "paid").length;
    const unpaid = invoices.filter(i => i.payment_status !== "paid");
    const overdue = unpaid.filter(i => i.due_date && new Date(i.due_date) < new Date());
    const pending = unpaid.filter(i => !i.due_date || new Date(i.due_date) >= new Date());
    const unpaidTotal = unpaid.reduce((s, i) => s + (i.amount || 0), 0);
    const overdueTotal = overdue.reduce((s, i) => s + (i.amount || 0), 0);
    const paidTotal = invoices.filter(i => i.payment_status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
    return { total, paid, unpaid: unpaid.length, overdue: overdue.length, pending: pending.length, unpaidTotal, overdueTotal, paidTotal };
  }, [records]);

  if (loading) return <LoadingPulse />;

  const getInvoiceAge = (rec: any) => {
    if (!rec.due_date) return 0;
    return Math.max(0, differenceInDays(new Date(), new Date(rec.due_date)));
  };

  const getEffectiveStatus = (rec: any) => {
    if (rec.payment_status === "paid") return "paid";
    if (rec.due_date && new Date(rec.due_date) < new Date()) return "overdue";
    return rec.payment_status || "pending";
  };

  const currentDocRecords = byType(docTab);
  const filtered = currentDocRecords.filter(rec => {
    const matchSearch = rec.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      rec.clients?.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
      rec.description?.toLowerCase().includes(search.toLowerCase());
    const effectiveStatus = getEffectiveStatus(rec);
    const matchStatus = statusFilter === "all" || effectiveStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string, dueDate?: string) => {
    const effectiveStatus = status === "paid" ? "paid" : (dueDate && new Date(dueDate) < new Date() ? "overdue" : status);
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid: { variant: "default", label: "✓ Paid" },
      pending: { variant: "secondary", label: "⏳ Pending" },
      overdue: { variant: "destructive", label: "⚠ Overdue" },
    };
    const c = config[effectiveStatus] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Finance & Billing" description="Comprehensive financial management suite" icon={CreditCard} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-1"><LayoutDashboard className="h-3 w-3" />Dashboard</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1"><FileText className="h-3 w-3" />Documents</TabsTrigger>
          <TabsTrigger value="client-folders" className="gap-1"><FolderOpen className="h-3 w-3" />Client Folders</TabsTrigger>
          <TabsTrigger value="purchase-orders" className="gap-1"><ShoppingCart className="h-3 w-3" />Purchase Orders</TabsTrigger>
          <TabsTrigger value="recurring" className="gap-1"><Repeat className="h-3 w-3" />Recurring</TabsTrigger>
          <TabsTrigger value="reminders" className="gap-1"><BellRing className="h-3 w-3" />Reminders</TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-1"><Landmark className="h-3 w-3" />Reconciliation</TabsTrigger>
          <TabsTrigger value="budgets" className="gap-1"><BarChart3 className="h-3 w-3" />Budgets</TabsTrigger>
          <TabsTrigger value="deposits" className="gap-1"><PiggyBank className="h-3 w-3" />Deposits</TabsTrigger>
          <TabsTrigger value="billing-rules" className="gap-1"><Calculator className="h-3 w-3" />Billing Rules</TabsTrigger>
          <TabsTrigger value="tax" className="gap-1"><Scale className="h-3 w-3" />Tax</TabsTrigger>
          <TabsTrigger value="pnl" className="gap-1"><TrendingUp className="h-3 w-3" />P&L</TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1"><Users className="h-3 w-3" />Payroll</TabsTrigger>
          <TabsTrigger value="statements" className="gap-1"><FileBarChart className="h-3 w-3" />Statements</TabsTrigger>
          <TabsTrigger value="aging" className="gap-1"><Clock className="h-3 w-3" />Aging</TabsTrigger>
        </TabsList>

        <Suspense fallback={<SubLoader />}>
          <TabsContent value="dashboard">
            <FinanceDashboard records={records} budgets={budgetItems} deposits={depositItems} currencyRates={currencyRates} />
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-4">
              {/* Invoice Tracking Summary Cards — only show for invoice tab */}
              {docTab === "invoice" && (
                <div className="grid gap-3 md:grid-cols-4">
                  <Card className="border-l-4 border-l-primary cursor-pointer" onClick={() => setStatusFilter("all")}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Total Invoices</p>
                          <p className="text-2xl font-bold">{invoiceStats.total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-primary opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-emerald-500 cursor-pointer" onClick={() => setStatusFilter("paid")}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Paid</p>
                          <p className="text-2xl font-bold text-emerald-600">{invoiceStats.paid}</p>
                          <p className="text-xs text-muted-foreground">KES {invoiceStats.paidTotal.toLocaleString()}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500 cursor-pointer" onClick={() => setStatusFilter("pending")}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Unpaid / Pending</p>
                          <p className="text-2xl font-bold text-amber-600">{invoiceStats.unpaid}</p>
                          <p className="text-xs text-muted-foreground">KES {invoiceStats.unpaidTotal.toLocaleString()}</p>
                        </div>
                        <Clock className="h-8 w-8 text-amber-500 opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-destructive cursor-pointer" onClick={() => setStatusFilter("overdue")}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                          <p className="text-2xl font-bold text-destructive">{invoiceStats.overdue}</p>
                          <p className="text-xs text-muted-foreground">KES {invoiceStats.overdueTotal.toLocaleString()}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center justify-between">
                <Tabs value={docTab} onValueChange={v => { setDocTab(v as DocType); setStatusFilter("all"); }}>
                  <TabsList>
                    <TabsTrigger value="invoice">Invoices</TabsTrigger>
                    <TabsTrigger value="quotation">Quotations</TabsTrigger>
                    <TabsTrigger value="payment">Payments</TabsTrigger>
                    <TabsTrigger value="expense">Expenses</TabsTrigger>
                    <TabsTrigger value="credit_note">Credit Notes</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />New {DOC_LABELS[docTab]}</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Create {DOC_LABELS[docTab]}</DialogTitle>
                      <DialogDescription>Number will be auto-generated.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {docTab !== "expense" && (
                        <div className="space-y-2">
                          <Label>Client *</Label>
                          <Select value={formData.client_id} onValueChange={v => setFormData({ ...formData, client_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}
                      {/* Line Items */}
                      {docTab !== "expense" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Line Items</Label>
                            <Button type="button" size="sm" variant="outline" onClick={addLineItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="w-10">#</TableHead>
                                  <TableHead>Service / Product</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="w-20">Qty</TableHead>
                                  <TableHead className="w-28">Unit Price</TableHead>
                                  <TableHead className="w-28 text-right">Line Total</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {lineItems.map((li, idx) => (
                                  <TableRow key={li.id}>
                                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                                    <TableCell>
                                      <Select value={li.category} onValueChange={v => updateLineItem(li.id, "category", v)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                          {SERVICE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input className="h-8 text-xs" value={li.description} onChange={e => updateLineItem(li.id, "description", e.target.value)} placeholder="Details..." />
                                    </TableCell>
                                    <TableCell>
                                      <Input className="h-8 text-xs" type="number" min={1} value={li.quantity || ""} onChange={e => updateLineItem(li.id, "quantity", parseInt(e.target.value) || 1)} />
                                    </TableCell>
                                    <TableCell>
                                      <Input className="h-8 text-xs" type="number" min={0} value={li.unit_price || ""} onChange={e => updateLineItem(li.id, "unit_price", parseFloat(e.target.value) || 0)} />
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-sm">{formData.currency} {(li.quantity * li.unit_price).toLocaleString()}</TableCell>
                                    <TableCell>
                                      {lineItems.length > 1 && (
                                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeLineItem(li.id)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={5} className="text-right font-semibold text-sm">Subtotal:</TableCell>
                                  <TableCell className="text-right font-bold">{formData.currency} {lineItemsSubtotal.toLocaleString()}</TableCell>
                                  <TableCell />
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                      {docTab === "expense" && (
                        <div className="space-y-2">
                          <Label>Expense Category</Label>
                          <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="transport">Transport</SelectItem>
                              <SelectItem value="uniforms">Uniforms</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="utilities">Utilities</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {docTab === "expense" && (
                        <div className="space-y-2"><Label>Amount *</Label><Input type="number" required min={1} value={formData.amount || ""} onChange={e => handleAmountChange(parseFloat(e.target.value) || 0)} /></div>
                      )}
                      <div className="grid gap-4 grid-cols-3">
                        <div className="space-y-2"><Label>Date *</Label><Input type="date" required value={formData.invoice_date} onChange={e => handleInvoiceDateChange(e.target.value)} /></div>
                        {(docTab === "invoice" || docTab === "quotation") && (
                          <div className="space-y-2"><Label>Due Date (30 days)</Label><Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} /></div>
                        )}
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select value={formData.currency} onValueChange={v => setFormData({ ...formData, currency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KES">KES</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2"><Label>Discount</Label><Input type="number" value={formData.discount_amount || ""} onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })} /></div>
                      </div>
                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                          <Label>Tax Bracket</Label>
                          <Select value={formData.tax_percent} onValueChange={handleTaxBracketChange}>
                            <SelectTrigger><SelectValue placeholder="Select tax rate" /></SelectTrigger>
                            <SelectContent>
                              {TAX_BRACKETS.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tax Amount {formData.tax_percent !== "custom" && formData.amount > 0 ? `(${formData.tax_percent}%)` : ""}</Label>
                          <Input
                            type="number"
                            value={formData.tax_amount || ""}
                            onChange={e => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0, tax_percent: "custom" })}
                            readOnly={formData.tax_percent !== "custom"}
                            className={formData.tax_percent !== "custom" ? "bg-muted" : ""}
                          />
                        </div>
                      </div>
                      {formData.amount > 0 && (
                        <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{formData.currency} {formData.amount.toLocaleString()}</span></div>
                          {formData.tax_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({formData.tax_percent !== "custom" ? `${formData.tax_percent}%` : "custom"}):</span><span>+ {formData.currency} {formData.tax_amount.toLocaleString()}</span></div>}
                          {formData.discount_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span><span>- {formData.currency} {formData.discount_amount.toLocaleString()}</span></div>}
                          <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total:</span><span>{formData.currency} {(formData.amount + formData.tax_amount - formData.discount_amount).toLocaleString()}</span></div>
                        </div>
                      )}
                      {(docTab === "invoice" || docTab === "quotation") && (
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={formData.payment_status} onValueChange={(v: "paid" | "pending" | "overdue") => setFormData({ ...formData, payment_status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" type="button" onClick={() => { resetForm(); setOpen(false); }}>Cancel</Button>
                        <Button type="submit">Create {DOC_LABELS[docTab]}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by invoice #, client, or description..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="paid">✓ Paid</SelectItem>
                    <SelectItem value="overdue">⚠ Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Table with tracking */}
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                      ) : filtered.map((rec, idx) => {
                        const effective = getEffectiveStatus(rec);
                        const age = getInvoiceAge(rec);
                        const isOverdue = effective === "overdue";
                        const isPending = effective === "pending";
                        return (
                          <TableRow key={rec.id} className={isOverdue ? "bg-destructive/5" : isPending ? "bg-amber-500/5" : ""}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-sm font-semibold">{rec.invoice_number}</TableCell>
                            <TableCell className="font-medium">{rec.clients?.legal_name || "—"}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{rec.description || "—"}</TableCell>
                            <TableCell className="text-sm">{rec.invoice_date ? format(new Date(rec.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-sm">
                              {rec.due_date ? (
                                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                                  {format(new Date(rec.due_date), "dd MMM yyyy")}
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="font-semibold">{rec.currency || "KES"} {Number(rec.amount).toLocaleString()}</TableCell>
                            <TableCell>
                              {effective === "paid" ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : age > 0 ? (
                                <Badge variant={age > 60 ? "destructive" : age > 30 ? "secondary" : "outline"} className="font-mono">
                                  {age}d overdue
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not yet due</span>
                              )}
                            </TableCell>
                            <TableCell>{statusBadge(rec.payment_status || "pending", rec.due_date)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {effective !== "paid" ? (
                                  <>
                                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => updatePaymentStatus(rec.id, "paid")}>
                                      <CheckCircle className="h-3 w-3 mr-1" />Mark Paid
                                    </Button>
                                    {effective === "pending" && (
                                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => updatePaymentStatus(rec.id, "overdue")}>
                                        <AlertTriangle className="h-3 w-3 mr-1" />Overdue
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => setReversalDialog({ open: true, id: rec.id, invoiceNumber: rec.invoice_number })}>
                                    <RotateCcw className="h-3 w-3 mr-1" />Reverse
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => downloadPDF(rec)}><Download className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteRecord(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment Reversal Dialog */}
              <Dialog open={reversalDialog.open} onOpenChange={o => { if (!o) setReversalDialog({ open: false, id: "", invoiceNumber: "" }); }}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Ban className="h-5 w-5 text-destructive" />Reverse Payment</DialogTitle>
                    <DialogDescription>
                      This will mark <span className="font-semibold">{reversalDialog.invoiceNumber}</span> as unpaid and log the reason in the invoice notes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Reason for reversal *</Label>
                      <Select value={reversalReason} onValueChange={setReversalReason}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bounced cheque">Bounced Cheque</SelectItem>
                          <SelectItem value="Payment reversed by bank">Payment Reversed by Bank</SelectItem>
                          <SelectItem value="Duplicate payment recorded">Duplicate Payment Recorded</SelectItem>
                          <SelectItem value="Incorrect amount applied">Incorrect Amount Applied</SelectItem>
                          <SelectItem value="Client dispute">Client Dispute</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setReversalDialog({ open: false, id: "", invoiceNumber: "" })}>Cancel</Button>
                      <Button variant="destructive" onClick={() => {
                        updatePaymentStatus(reversalDialog.id, "pending", reversalReason);
                        setReversalDialog({ open: false, id: "", invoiceNumber: "" });
                        setReversalReason("Bounced cheque");
                      }}>
                        <RotateCcw className="h-4 w-4 mr-2" />Confirm Reversal
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="client-folders">
            <ClientInvoiceFolder records={records} clients={clients} onRefresh={fetchRecords} />
          </TabsContent>

          <TabsContent value="purchase-orders">
            <PurchaseOrders records={records} clients={clients} onRefresh={fetchRecords} />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringInvoices items={recurringItems} clients={clients} onRefresh={fetchRecurring} />
          </TabsContent>

          <TabsContent value="reminders">
            <PaymentReminders records={records} clients={clients} onRefresh={fetchRecords} />
          </TabsContent>

          <TabsContent value="reconciliation">
            <BankReconciliation items={bankItems} finances={records} onRefresh={() => { fetchBank(); fetchRecords(); }} />
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetTracking items={budgetItems} onRefresh={fetchBudgets} />
          </TabsContent>

          <TabsContent value="deposits">
            <ClientDeposits items={depositItems} clients={clients} finances={records} onRefresh={() => { fetchDeposits(); fetchRecords(); }} />
          </TabsContent>

          <TabsContent value="billing-rules">
            <ContractBillingRules items={billingRules} clients={clients} onRefresh={fetchBillingRules} />
          </TabsContent>

          <TabsContent value="tax">
            <TaxManagement finances={records} />
          </TabsContent>


          <TabsContent value="pnl">
            <ProfitLossReport records={records} clients={clients} />
          </TabsContent>

          <TabsContent value="payroll">
            <PayrollSummary records={records} clients={clients} />
          </TabsContent>

          <TabsContent value="statements">
            <ClientStatements finances={records} deposits={depositItems} clients={clients} />
          </TabsContent>

          <TabsContent value="aging">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Aging Report</h3>
              <div className="grid gap-4 md:grid-cols-5">
                {Object.entries(agingBuckets).map(([label, items]) => {
                  const total = items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
                  return (
                    <Card key={label}>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{label === "current" ? "Current" : `${label} Days`}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">KES {total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{items.length} invoice{items.length !== 1 ? "s" : ""}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Aging Summary by Client */}
              {(() => {
                const outstanding = byType("invoice").filter(i => i.payment_status !== "paid");
                const summaryMap = new Map<string, { name: string; current: number; d30: number; d60: number; d90: number; d90plus: number; total: number; count: number }>();
                outstanding.forEach(inv => {
                  const cid = inv.client_id || "unknown";
                  const cname = inv.clients?.legal_name || "Unknown Client";
                  if (!summaryMap.has(cid)) summaryMap.set(cid, { name: cname, current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0, total: 0, count: 0 });
                  const entry = summaryMap.get(cid)!;
                  const age = getInvoiceAge(inv);
                  const amt = inv.amount || 0;
                  entry.total += amt;
                  entry.count++;
                  if (age <= 0) entry.current += amt;
                  else if (age <= 30) entry.d30 += amt;
                  else if (age <= 60) entry.d60 += amt;
                  else if (age <= 90) entry.d90 += amt;
                  else entry.d90plus += amt;
                });
                const summaryRows = Array.from(summaryMap.values()).sort((a, b) => b.total - a.total);
                const grandTotal = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0, total: 0 };
                summaryRows.forEach(r => { grandTotal.current += r.current; grandTotal.d30 += r.d30; grandTotal.d60 += r.d60; grandTotal.d90 += r.d90; grandTotal.d90plus += r.d90plus; grandTotal.total += r.total; });

                if (summaryRows.length === 0) return null;

                const fmtK = (v: number) => v > 0 ? `KES ${v.toLocaleString()}` : "—";
                const fmtCsv = (v: number) => v > 0 ? v.toFixed(2) : "0.00";

                const downloadAgingSummaryExcel = () => {
                  const headers = ["Client", "Invoices", "Current (KES)", "1-30 Days (KES)", "31-60 Days (KES)", "61-90 Days (KES)", "90+ Days (KES)", "Total Outstanding (KES)"];
                  const rows = summaryRows.map(r => [r.name, String(r.count), fmtCsv(r.current), fmtCsv(r.d30), fmtCsv(r.d60), fmtCsv(r.d90), fmtCsv(r.d90plus), fmtCsv(r.total)]);
                  rows.push(["GRAND TOTAL", "", fmtCsv(grandTotal.current), fmtCsv(grandTotal.d30), fmtCsv(grandTotal.d60), fmtCsv(grandTotal.d90), fmtCsv(grandTotal.d90plus), fmtCsv(grandTotal.total)]);
                  const csvContent = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
                  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `Aging_Summary_All_Clients_${format(new Date(), "yyyy-MM-dd")}.csv`;
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("Aging summary downloaded");
                };

                return (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Aging Summary — All Clients
                        </CardTitle>
                        <Button size="sm" variant="outline" onClick={downloadAgingSummaryExcel}>
                          <Download className="h-3 w-3 mr-1" />Excel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Current</TableHead>
                            <TableHead className="text-right">1-30 Days</TableHead>
                            <TableHead className="text-right">31-60 Days</TableHead>
                            <TableHead className="text-right">61-90 Days</TableHead>
                            <TableHead className="text-right">90+ Days</TableHead>
                            <TableHead className="text-right">Total Outstanding</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summaryRows.map(row => (
                            <TableRow key={row.name}>
                              <TableCell className="font-medium">{row.name} <span className="text-xs text-muted-foreground">({row.count})</span></TableCell>
                              <TableCell className="text-right">{fmtK(row.current)}</TableCell>
                              <TableCell className="text-right">{fmtK(row.d30)}</TableCell>
                              <TableCell className="text-right">{fmtK(row.d60)}</TableCell>
                              <TableCell className="text-right">{fmtK(row.d90)}</TableCell>
                              <TableCell className="text-right font-medium text-destructive">{fmtK(row.d90plus)}</TableCell>
                              <TableCell className="text-right font-bold">KES {row.total.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold border-t-2">
                            <TableCell>GRAND TOTAL</TableCell>
                            <TableCell className="text-right">{fmtK(grandTotal.current)}</TableCell>
                            <TableCell className="text-right">{fmtK(grandTotal.d30)}</TableCell>
                            <TableCell className="text-right">{fmtK(grandTotal.d60)}</TableCell>
                            <TableCell className="text-right">{fmtK(grandTotal.d90)}</TableCell>
                            <TableCell className="text-right text-destructive">{fmtK(grandTotal.d90plus)}</TableCell>
                            <TableCell className="text-right text-destructive">KES {grandTotal.total.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Aging Summary by Client */}
              {(() => {
                const outstanding = byType("invoice").filter(i => i.payment_status !== "paid");
                const clientMap = new Map<string, { name: string; invoices: any[] }>();
                outstanding.forEach(inv => {
                  const cid = inv.client_id || "unknown";
                  const cname = inv.clients?.legal_name || "Unknown Client";
                  if (!clientMap.has(cid)) clientMap.set(cid, { name: cname, invoices: [] });
                  clientMap.get(cid)!.invoices.push(inv);
                });
                const clientGroups = Array.from(clientMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));

                const downloadClientExcel = (clientName: string, invoices: any[]) => {
                  const headers = ["Invoice #", "Invoice Date", "Due Date", "Description", "Amount (KES)", "Age (Days)", "Status"];
                  const rows = invoices.map(inv => {
                    const age = getInvoiceAge(inv);
                    const status = inv.due_date && new Date(inv.due_date) < new Date() ? "Overdue" : "Pending";
                    return [
                      inv.invoice_number || "",
                      inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "",
                      inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "",
                      inv.description || "",
                      Number(inv.amount || 0).toFixed(2),
                      String(age),
                      status,
                    ];
                  });
                  const totalAmount = invoices.reduce((s: number, i: any) => s + (i.amount || 0), 0);
                  rows.push(["", "", "", "TOTAL", totalAmount.toFixed(2), "", ""]);

                  const csvContent = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
                  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `Aging_Report_${clientName.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`;
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`Excel downloaded for ${clientName}`);
                };

                if (clientGroups.length === 0) {
                  return (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">No outstanding invoices</CardContent>
                    </Card>
                  );
                }

                return clientGroups.map(([cid, { name, invoices }]) => {
                  const clientTotal = invoices.reduce((s: number, i: any) => s + (i.amount || 0), 0);
                  return (
                    <Card key={cid}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-primary" />
                            {name}
                            <Badge variant="secondary" className="ml-1">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</Badge>
                            <span className="text-destructive font-bold ml-2">KES {clientTotal.toLocaleString()}</span>
                          </CardTitle>
                          <Button size="sm" variant="outline" onClick={() => downloadClientExcel(name, invoices)}>
                            <Download className="h-3 w-3 mr-1" />Excel
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Invoice #</TableHead><TableHead>Date</TableHead>
                              <TableHead>Due</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Age</TableHead><TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.map((inv: any, idx: number) => (
                              <TableRow key={inv.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                                <TableCell>{inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                                <TableCell>{inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}</TableCell>
                                <TableCell className="text-muted-foreground max-w-[180px] truncate">{inv.description || "—"}</TableCell>
                                <TableCell>KES {Number(inv.amount).toLocaleString()}</TableCell>
                                <TableCell><Badge variant={getInvoiceAge(inv) > 60 ? "destructive" : getInvoiceAge(inv) > 30 ? "secondary" : "outline"}>{getInvoiceAge(inv)}d</Badge></TableCell>
                                <TableCell>{statusBadge(inv.payment_status, inv.due_date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </div>
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
