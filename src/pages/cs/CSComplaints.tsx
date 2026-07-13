import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { AlertTriangle, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCustomerService, type ClientComplaint } from "@/hooks/useCustomerService";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_COLOR: Record<string, string> = {
  received: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  investigating: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  escalated: "bg-red-500/20 text-red-400 border-red-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const COMPLAINT_STATUSES = ["received", "investigating", "escalated", "resolved", "closed"] as const;

const CSComplaints = () => {
  const cs = useCustomerService();
  const [selected, setSelected] = useState<ClientComplaint | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { cs.fetchComplaints(); }, [cs.fetchComplaints]);

  const handleEscalate = async () => {
    if (!selected || !escalationNotes.trim()) return;
    setEscalating(true);
    try {
      await cs.escalateComplaint(selected.id, escalationNotes);
      setEscalateOpen(false);
      setEscalationNotes("");
      setSelected(prev => prev ? { ...prev, escalated: true, status: "escalated" } : prev);
    } finally {
      setEscalating(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      await cs.updateComplaint(selected.id, { status: status as ClientComplaint["status"] });
      setSelected(prev => prev ? { ...prev, status: status as ClientComplaint["status"] } : prev);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        description="Client complaint escalation, investigation and resolution"
        icon={AlertTriangle}
      />

      <Card className="border-border overflow-hidden">
        <div className="divide-y divide-border">
          {cs.complaints.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No complaints on record.</div>
          ) : cs.complaints.map((c) => (
            <button
              key={c.id}
              className="w-full p-4 flex items-start justify-between gap-4 text-left hover:bg-muted/40 transition-colors"
              onClick={() => setSelected(c)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{c.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.complaint_number ?? c.id.slice(0, 8)}
                  {c.client_name ? ` · ${c.client_name}` : ""}
                  {" · "}{new Date(c.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{c.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.escalated && (
                  <Badge variant="outline" className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30">
                    Escalated
                  </Badge>
                )}
                <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLOR[c.severity] ?? ""}`}>
                  {c.severity}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[c.status] ?? ""}`}>
                  {c.status}
                </Badge>
                <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Complaint Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selected?.complaint_number ?? selected?.id.slice(0, 8)} — {selected?.subject}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Client</p>
                  <p className="font-medium">{selected.client_name ?? "No client"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Severity</p>
                  <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLOR[selected.severity] ?? ""}`}>
                    {selected.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Received</p>
                  <p className="font-medium">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Escalated</p>
                  <p className="font-medium">{selected.escalated ? "Yes" : "No"}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">Description</p>
                <p className="text-sm bg-muted/30 rounded-md p-3">{selected.description}</p>
              </div>

              {selected.escalation_notes && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Escalation Notes</p>
                  <p className="text-sm bg-muted/30 rounded-md p-3">{selected.escalation_notes}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Update Status</Label>
                <Select value={selected.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selected.escalated && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setEscalateOpen(true)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Escalate Complaint
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escalate Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Provide escalation notes describing why this complaint requires escalation.
            </p>
            <Label htmlFor="esc-notes">Escalation Notes *</Label>
            <Textarea
              id="esc-notes"
              value={escalationNotes}
              onChange={(e) => setEscalationNotes(e.target.value)}
              placeholder="Describe the reason for escalation…"
              className="resize-none h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!escalationNotes.trim() || escalating}
              onClick={handleEscalate}
            >
              {escalating ? "Escalating…" : "Confirm Escalation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CSComplaints;
