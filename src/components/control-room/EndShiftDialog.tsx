import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any;
  onClosed?: () => void;
}

export const EndShiftDialog = ({ open, onOpenChange, shift, onClosed }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ handover_notes: "", issues_flagged: "", incidents_handled: "0", alarms_acknowledged: "0", dispatches_made: "0" });

  const submit = async () => {
    if (!shift?.id) { toast.error("No active shift"); return; }
    if (!form.handover_notes.trim()) { toast.error("Handover notes required"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("shift_logs").update({
        shift_end: new Date().toISOString(),
        handover_notes: form.handover_notes,
        issues_flagged: form.issues_flagged || null,
        incidents_handled: Number(form.incidents_handled) || 0,
        alarms_acknowledged: Number(form.alarms_acknowledged) || 0,
        dispatches_made: Number(form.dispatches_made) || 0,
        signed_off_at: new Date().toISOString(),
        signed_off_by: user?.id ?? null,
      }).eq("id", shift.id);
      if (error) throw error;
      toast.success("Shift closed and handover saved");
      onOpenChange(false);
      onClosed?.();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to end shift");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><LogOut className="h-5 w-5 text-primary" /> End Shift & Handover</DialogTitle>
          <DialogDescription>Sign off the current shift ({shift?.shift_id ?? "—"}) and log handover notes for the next operator.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Incidents</Label><Input type="number" min={0} value={form.incidents_handled} onChange={(e) => setForm({ ...form, incidents_handled: e.target.value })} /></div>
            <div><Label>Alarms</Label><Input type="number" min={0} value={form.alarms_acknowledged} onChange={(e) => setForm({ ...form, alarms_acknowledged: e.target.value })} /></div>
            <div><Label>Dispatches</Label><Input type="number" min={0} value={form.dispatches_made} onChange={(e) => setForm({ ...form, dispatches_made: e.target.value })} /></div>
          </div>
          <div>
            <Label>Handover Notes *</Label>
            <Textarea rows={5} maxLength={4000} value={form.handover_notes} onChange={(e) => setForm({ ...form, handover_notes: e.target.value })} placeholder="Open incidents, pending callouts, VIP movements, equipment issues…" />
          </div>
          <div>
            <Label>Issues Flagged</Label>
            <Textarea rows={3} maxLength={2000} value={form.issues_flagged} onChange={(e) => setForm({ ...form, issues_flagged: e.target.value })} placeholder="Anything requiring supervisor attention" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Off & Close Shift"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndShiftDialog;
