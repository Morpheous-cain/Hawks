/**
 * useBillingInvoicing
 * ============================================================
 * Centralized data + real-time + mutation layer for the Finance &
 * Billing module (`/platform/finance-director/m/billing` and every
 * other portal that consumes `BillingInvoicing`).
 *
 * This hook is the canonical example of the project's "module data
 * hook" pattern (see also: useInvestigationsData, useMdtManagement,
 * useExecutiveDashboard). It exposes a `{ data, loading, actions }`
 * shape so UI components remain purely presentational.
 *
 * --- ARCHITECTURE -------------------------------------------------
 *
 * 1. DATA layer  – fetches every table the module needs in parallel,
 *    keeps the local cache hot via a single Supabase channel, and
 *    exposes typed selectors (records, clients, deposits…).
 *
 * 2. ACTIONS layer – every mutation the UI can perform is implemented
 *    here as a stable, async function with toast feedback + error
 *    recovery. Components never call `supabase.from(...).insert()`
 *    directly — they call `actions.createRecord(...)` etc.
 *
 * 3. LIFECYCLE – `useEffect` mounts subscriptions and tears them down
 *    cleanly. A `reload()` escape hatch is provided for forced sync.
 *
 * --- EXTENDING ---------------------------------------------------
 *
 * To add a new finance table (e.g. `purchase_orders`):
 *   1. Add `purchaseOrders` to the state + an initial `[]`.
 *   2. Add `fetchPurchaseOrders` and include it in `fetchAll`.
 *   3. Add the table name to the realtime channel filters.
 *   4. (optional) Expose mutations via `actions.createPurchaseOrder`.
 *
 * To replicate this hook for another module:
 *   - Copy this file, rename, swap the tables and mutations.
 *   - Keep the `{ data, loading, actions, reload }` return contract.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// `sb` is the un-typed escape hatch for tables not yet in the
// generated `Database` type. All cross-table joins use this.
const sb = supabase as any;

// ---------------------------------------------------------------
// Types — kept loose-but-named so callers get IntelliSense without
// being blocked by schema drift.
// ---------------------------------------------------------------
export type DocType = "invoice" | "quotation" | "payment" | "expense" | "credit_note";

export interface FinanceRecord {
  id: string;
  invoice_number: string;
  client_id: string | null;
  invoice_date: string;
  due_date: string | null;
  amount: number;
  base_amount?: number;
  tax_amount?: number;
  discount_amount?: number;
  currency: string;
  document_type: DocType | string;
  payment_status: "paid" | "pending" | "overdue" | string;
  payment_date: string | null;
  description?: string | null;
  notes?: string | null;
  category?: string | null;
  ageing_days?: number;
  clients?: { legal_name?: string; trading_name?: string } | null;
}

export interface BillingData {
  records: FinanceRecord[];
  clients: Array<{ id: string; legal_name: string }>;
  recurringItems: any[];
  bankItems: any[];
  budgetItems: any[];
  depositItems: any[];
  billingRules: any[];
  currencyRates: any[];
}

export interface CreateRecordInput {
  client_id?: string | null;
  invoice_date: string;
  due_date?: string | null;
  amount: number;
  base_amount?: number;
  tax_amount?: number;
  discount_amount?: number;
  currency: string;
  document_type: DocType;
  payment_status?: "paid" | "pending" | "overdue";
  description?: string | null;
  notes?: string | null;
  category?: string | null;
}

// ---------------------------------------------------------------
// Document numbering — pure helpers; exported so UI/PDF code can
// share one source of truth.
// ---------------------------------------------------------------
const DOC_PREFIXES: Record<DocType, string> = {
  invoice: "INV", quotation: "QT", payment: "PAY", expense: "EXP", credit_note: "CN",
};

export function generateDocNumber(type: DocType): string {
  const now = new Date();
  const prefix = DOC_PREFIXES[type] ?? "DOC";
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const r = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${prefix}-${y}${m}-${r}`;
}

// ---------------------------------------------------------------
// Hook
// ---------------------------------------------------------------
export function useBillingInvoicing() {
  const [data, setData] = useState<BillingData>({
    records: [], clients: [], recurringItems: [], bankItems: [],
    budgetItems: [], depositItems: [], billingRules: [], currencyRates: [],
  });
  const [loading, setLoading] = useState(true);

  // Refs to avoid stale-closure bugs in subscription handlers.
  const mountedRef = useRef(true);
  const safeSet = useCallback(<K extends keyof BillingData>(key: K, value: BillingData[K]) => {
    if (!mountedRef.current) return;
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  // -------------- Fetchers (one per table) --------------------
  const fetchRecords = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from("client_finances")
      .select("*, clients:client_id(legal_name, trading_name)")
      .order("invoice_date", { ascending: false });
    if (error) console.warn("[useBillingInvoicing] fetchRecords:", error.message);
    safeSet("records", (rows ?? []) as FinanceRecord[]);
  }, [safeSet]);

  const fetchClients = useCallback(async () => {
    const { data: rows } = await supabase.from("clients").select("id, legal_name");
    safeSet("clients", (rows ?? []) as any);
  }, [safeSet]);

  const fetchRecurring = useCallback(async () => {
    const { data: rows } = await sb.from("recurring_invoices")
      .select("*, clients:client_id(legal_name)").order("next_invoice_date");
    safeSet("recurringItems", rows ?? []);
  }, [safeSet]);

  const fetchBank = useCallback(async () => {
    const { data: rows } = await sb.from("bank_reconciliation")
      .select("*").order("bank_date", { ascending: false });
    safeSet("bankItems", rows ?? []);
  }, [safeSet]);

  const fetchBudgets = useCallback(async () => {
    const { data: rows } = await sb.from("budgets")
      .select("*").order("period_start", { ascending: false });
    safeSet("budgetItems", rows ?? []);
  }, [safeSet]);

  const fetchDeposits = useCallback(async () => {
    const { data: rows } = await sb.from("client_deposits")
      .select("*, clients:client_id(legal_name)").order("received_date", { ascending: false });
    safeSet("depositItems", rows ?? []);
  }, [safeSet]);

  const fetchBillingRules = useCallback(async () => {
    const { data: rows } = await sb.from("contract_billing_rules")
      .select("*, clients:client_id(legal_name)").order("created_at", { ascending: false });
    safeSet("billingRules", rows ?? []);
  }, [safeSet]);

  const fetchCurrencyRates = useCallback(async () => {
    const { data: rows } = await sb.from("currency_rates")
      .select("*").order("effective_date", { ascending: false });
    safeSet("currencyRates", rows ?? []);
  }, [safeSet]);

  // -------------- Aggregate loaders ---------------------------
  const reload = useCallback(async () => {
    await Promise.all([
      fetchRecords(), fetchClients(), fetchRecurring(), fetchBank(),
      fetchBudgets(), fetchDeposits(), fetchBillingRules(), fetchCurrencyRates(),
    ]);
  }, [fetchRecords, fetchClients, fetchRecurring, fetchBank, fetchBudgets, fetchDeposits, fetchBillingRules, fetchCurrencyRates]);

  // -------------- Lifecycle -----------------------------------
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await reload();
      if (mountedRef.current) setLoading(false);
    })();

    // Single stable channel — multiple tables share it to keep
    // websocket count low. Realtime payloads simply re-fetch the
    // affected table (small + reliable; no fragile diffing).
    const channel = supabase
      .channel("billing-invoicing-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_finances" }, () => fetchRecords())
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_invoices" }, () => fetchRecurring())
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_reconciliation" }, () => fetchBank())
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => fetchBudgets())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_deposits" }, () => fetchDeposits())
      .on("postgres_changes", { event: "*", schema: "public", table: "contract_billing_rules" }, () => fetchBillingRules())
      .on("postgres_changes", { event: "*", schema: "public", table: "currency_rates" }, () => fetchCurrencyRates())
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------- Mutations -----------------------------------
  /**
   * Create a finance document (invoice / quote / payment / expense / credit-note).
   * Auto-generates the document number, computes ageing, and sets
   * paid-on-creation flags for `payment` records.
   */
  const createRecord = useCallback(async (input: CreateRecordInput): Promise<boolean> => {
    if (!input.client_id && input.document_type !== "expense") {
      toast.error("Please select a client");
      return false;
    }
    if (input.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return false;
    }

    const ageDays = input.due_date
      ? Math.max(0, differenceInDays(new Date(), new Date(input.due_date)))
      : 0;

    const payload: any = {
      ...input,
      client_id: input.client_id || null,
      invoice_number: generateDocNumber(input.document_type),
      ageing_days: ageDays,
      payment_status: input.document_type === "payment" ? "paid" : (input.payment_status ?? "pending"),
      payment_date: input.document_type === "payment" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("client_finances").insert([payload]);
    if (error) { toast.error(error.message); return false; }
    toast.success("Document created");
    return true;
  }, []);

  /** Delete a finance record by id. */
  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("client_finances").delete().eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success("Record deleted");
    return true;
  }, []);

  /**
   * Update payment status. When reversing a paid record, the prior
   * note is preserved and a timestamped reversal reason appended,
   * giving an audit trail without a separate table.
   */
  const updatePaymentStatus = useCallback(async (id: string, status: string, reason?: string): Promise<boolean> => {
    const update: any = { payment_status: status };
    if (status === "paid") {
      update.payment_date = new Date().toISOString();
    } else if (reason) {
      update.payment_date = null;
      const rec = data.records.find(r => r.id === id);
      const existingNotes = rec?.notes || "";
      const reversal = `[REVERSED ${format(new Date(), "dd MMM yyyy HH:mm")}] ${reason}`;
      update.notes = existingNotes ? `${existingNotes}\n${reversal}` : reversal;
    }
    const { error } = await supabase.from("client_finances").update(update).eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success(reason ? "Payment reversed — invoice marked unpaid" : "Status updated");
    return true;
  }, [data.records]);

  return {
    data,
    loading,
    actions: { createRecord, deleteRecord, updatePaymentStatus, reload },
  };
}

export default useBillingInvoicing;
