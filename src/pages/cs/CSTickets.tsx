import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { ClipboardList, Plus, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerService, type SupportTicket } from "@/hooks/useCustomerService";

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending_client: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const TICKET_STATUSES = ["open", "in_progress", "pending_client", "resolved", "closed"] as const;

const CSTickets = () => {
  const { user, userRole } = useAuth();
  const isManager = userRole === "customer_service_manager";
  const cs = useCustomerService();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [notes, setNotes] = useState<{ id: string; note_text: string; created_at: string }[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", category: "general", priority: "normal" });

  const loadTickets = useCallback(async () => {
    await cs.fetchAll(isManager ? null : user?.id);
  }, [isManager, user?.id, cs.fetchAll]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNoteText("");
    const fetched = await cs.fetchNotes(ticket.id);
    setNotes(fetched);
  }, [cs.fetchNotes]);

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      await cs.updateTicket(selectedTicket.id, { status: status as SupportTicket["status"] });
      setSelectedTicket(prev => prev ? { ...prev, status: status as SupportTicket["status"] } : prev);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await cs.addNote(selectedTicket.id, null, noteText);
      setNoteText("");
      const fetched = await cs.fetchNotes(selectedTicket.id);
      setNotes(fetched);
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim()) return;
    setCreating(true);
    try {
      await cs.createTicket(newTicket);
      setCreateOpen(false);
      setNewTicket({ subject: "", description: "", category: "general", priority: "normal" });
    } finally {
      setCreating(false);
    }
  };

  const filtered = cs.tickets.filter((t) => {
    const matchesSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase())
      || (t.ticket_number ?? "").toLowerCase().includes(search.toLowerCase())
      || (t.client_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManager ? "All Tickets" : "My Tickets"}
        description={isManager ? "View and manage all customer support tickets" : "Your assigned support tickets"}
        icon={ClipboardList}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, ticket number, or client…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isManager && (
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      <Card className="border-border overflow-hidden">
        <div className="divide-y divide-border">
          {cs.loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tickets…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No tickets found.</div>
          ) : filtered.map((ticket) => (
            <button
              key={ticket.id}
              className="w-full p-4 flex items-start justify-between gap-4 text-left hover:bg-muted/40 transition-colors"
              onClick={() => openTicket(ticket)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground truncate">{ticket.subject}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ticket.ticket_number ?? ticket.id.slice(0, 8)}
                  {ticket.client_name ? ` · ${ticket.client_name}` : ""}
                  {" · "}
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
                {ticket.description && (
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{ticket.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLOR[ticket.priority] ?? ""}`}>
                  {ticket.priority}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[ticket.status] ?? ""}`}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(o) => { if (!o) setSelectedTicket(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedTicket?.ticket_number ?? selectedTicket?.id.slice(0, 8)} — {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Client</p>
                  <p className="font-medium">{selectedTicket.client_name ?? "No client"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Category</p>
                  <p className="font-medium capitalize">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Priority</p>
                  <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLOR[selectedTicket.priority] ?? ""}`}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Created</p>
                  <p className="font-medium">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedTicket.description && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Description</p>
                  <p className="text-sm bg-muted/30 rounded-md p-3">{selectedTicket.description}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Update Status</Label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Notes ({notes.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No notes yet.</p>
                  ) : notes.map((n) => (
                    <div key={n.id} className="bg-muted/30 rounded-md p-2 text-xs">
                      <p className="text-foreground">{n.note_text}</p>
                      <p className="text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Textarea
                    placeholder="Add a note…"
                    className="text-sm resize-none h-16"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="self-end"
                    disabled={!noteText.trim() || savingNote}
                    onClick={handleAddNote}
                  >
                    {savingNote ? "Saving…" : "Add"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog (Manager only) */}
      {isManager && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div>
                <Label htmlFor="cs-subject">Subject *</Label>
                <Input
                  id="cs-subject"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket((p) => ({ ...p, subject: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cs-desc">Description</Label>
                <Textarea
                  id="cs-desc"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 resize-none h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newTicket.category} onValueChange={(v) => setNewTicket((p) => ({ ...p, category: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cs.categories.length === 0 ? (
                        <SelectItem value="general">General</SelectItem>
                      ) : cs.categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(v) => setNewTicket((p) => ({ ...p, priority: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating || !newTicket.subject.trim()}>
                  {creating ? "Creating…" : "Create Ticket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CSTickets;
