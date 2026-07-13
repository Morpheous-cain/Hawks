import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SupportTicket {
  id: string;
  ticket_number: string | null;
  client_id: string | null;
  client_name: string | null;
  subject: string;
  description: string | null;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "pending_client" | "resolved" | "closed";
  assigned_to: string | null;
  assigned_name: string | null;
  created_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientComplaint {
  id: string;
  complaint_number: string | null;
  client_id: string | null;
  client_name: string | null;
  ticket_id: string | null;
  subject: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "received" | "investigating" | "escalated" | "resolved" | "closed";
  escalated: boolean;
  escalated_at: string | null;
  escalation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CSNote {
  id: string;
  ticket_id: string | null;
  complaint_id: string | null;
  note_text: string;
  created_by: string | null;
  created_at: string;
}

export interface CSCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  escalation_sla_hours: number;
}

export const useCustomerService = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [complaints, setComplaints] = useState<ClientComplaint[]>([]);
  const [categories, setCategories] = useState<CSCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async (assignedTo?: string | null) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("support_tickets") as any)
      .select("*, clients(legal_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (assignedTo) query = query.eq("assigned_to", assignedTo);

    const { data, error } = await query;
    if (error) { console.error("[useCustomerService] fetchTickets:", error); return; }
    setTickets(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((t: any) => ({
        ...t,
        client_name: t.clients?.legal_name ?? null,
        assigned_name: null,
      }))
    );
  }, []);

  const fetchComplaints = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("client_complaints") as any)
      .select("*, clients(legal_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) { console.error("[useCustomerService] fetchComplaints:", error); return; }
    setComplaints(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((c: any) => ({
        ...c,
        client_name: c.clients?.legal_name ?? null,
      }))
    );
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("cs_categories")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) { console.error("[useCustomerService] fetchCategories:", error); return; }
    setCategories(data ?? []);
  }, []);

  const fetchAll = useCallback(async (userId?: string | null) => {
    setLoading(true);
    await Promise.all([fetchTickets(userId), fetchComplaints(), fetchCategories()]);
    setLoading(false);
  }, [fetchTickets, fetchComplaints, fetchCategories]);

  const fetchNotes = useCallback(async (ticketId: string): Promise<CSNote[]> => {
    const { data, error } = await supabase
      .from("cs_notes")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) { console.error("[useCustomerService] fetchNotes:", error); return []; }
    return (data ?? []) as CSNote[];
  }, []);

  const createTicket = async (payload: {
    client_id?: string;
    subject: string;
    description?: string;
    category: string;
    priority: string;
  }) => {
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("support_tickets")
      .insert({ ...payload, created_by: userRes.user?.id ?? null, status: "open" });
    if (error) {
      toast({ title: "Error creating ticket", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Ticket created" });
    await fetchTickets();
  };

  const updateTicket = async (id: string, updates: Partial<Pick<SupportTicket, "status" | "assigned_to" | "priority" | "category">>) => {
    const { data: userRes } = await supabase.auth.getUser();
    const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    if (updates.status === "resolved") {
      payload.resolved_at = new Date().toISOString();
      payload.resolved_by = userRes.user?.id ?? null;
    }
    const { error } = await supabase
      .from("support_tickets")
      .update(payload)
      .eq("id", id)
      .is("deleted_at", null);
    if (error) {
      toast({ title: "Error updating ticket", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Ticket updated" });
    await fetchTickets();
  };

  const addNote = async (ticketId: string | null, complaintId: string | null, noteText: string) => {
    if (!noteText.trim()) return;
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("cs_notes")
      .insert({
        ticket_id: ticketId,
        complaint_id: complaintId,
        note_text: noteText.trim(),
        created_by: userRes.user?.id ?? null,
      });
    if (error) {
      toast({ title: "Error adding note", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Note added" });
  };

  const escalateComplaint = async (complaintId: string, escalationNotes: string) => {
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("client_complaints")
      .update({
        escalated: true,
        escalated_at: new Date().toISOString(),
        escalated_by: userRes.user?.id ?? null,
        escalation_notes: escalationNotes.trim(),
        status: "escalated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaintId)
      .is("deleted_at", null);
    if (error) {
      toast({ title: "Error escalating complaint", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Complaint escalated" });
    await fetchComplaints();
  };

  const updateComplaint = async (id: string, updates: Partial<Pick<ClientComplaint, "status" | "severity">>) => {
    const { error } = await supabase
      .from("client_complaints")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) {
      toast({ title: "Error updating complaint", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Complaint updated" });
    await fetchComplaints();
  };

  const createCategory = async (payload: { name: string; description?: string; escalation_sla_hours?: number }) => {
    const { error } = await supabase
      .from("cs_categories")
      .insert({ ...payload, is_active: true });
    if (error) {
      toast({ title: "Error creating category", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Category created" });
    await fetchCategories();
  };

  const updateCategory = async (id: string, updates: Partial<Pick<CSCategory, "name" | "description" | "is_active" | "escalation_sla_hours">>) => {
    const { error } = await supabase
      .from("cs_categories")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast({ title: "Error updating category", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Category updated" });
    await fetchCategories();
  };

  return {
    tickets, complaints, categories, loading,
    fetchAll, fetchTickets, fetchComplaints, fetchCategories, fetchNotes,
    createTicket, updateTicket, addNote,
    escalateComplaint, updateComplaint,
    createCategory, updateCategory,
  };
};
