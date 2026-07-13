import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { appendContext, uploadContextAttachments } from "@/components/shared/operationalContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RadioCallDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    caller_name: "",
    caller_number: "",
    source_line: "radio",
    priority: "normal",
    purpose: "",
    notes: "",
  });

  const reset = () =>
    setFormData({
      caller_name: "",
      caller_number: "",
      source_line: "radio",
      priority: "normal",
      purpose: "",
      notes: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caller_number.trim()) {
      toast.error("Caller / unit ID is required");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: created, error } = await supabase.from("calls").insert([{
        call_number: `RC-${Date.now()}`,
        caller_name: formData.caller_name || null,
        caller_number: formData.caller_number,
        source_line: formData.source_line,
        priority: formData.priority as any,
        status: "completed" as any,
        purpose: formData.purpose || null,
        notes: appendContext(formData.notes, ctx),
        assigned_operator: user?.id ?? null,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
      }] as any).select("id").single();
      if (error) throw error;
      if (created && ctx.attachments.length > 0) {
        await uploadContextAttachments("calls", (created as any).id, ctx.attachments);
      }
      toast.success("Radio call logged");
      reset();
      setCtx(emptyOperationalContext());
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to log call");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Radio Call</DialogTitle>
          <DialogDescription>Record an inbound or outbound radio communication.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Caller / Unit Name</Label>
              <Input value={formData.caller_name} onChange={(e) => setFormData({ ...formData, caller_name: e.target.value })} placeholder="Officer or unit name" />
            </div>
            <div className="space-y-2">
              <Label>Callsign / Number *</Label>
              <Input value={formData.caller_number} onChange={(e) => setFormData({ ...formData, caller_number: e.target.value })} placeholder="e.g. UNIT-7" required />
            </div>
            <div className="space-y-2">
              <Label>Channel / Source</Label>
              <Select value={formData.source_line} onValueChange={(v) => setFormData({ ...formData, source_line: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="radio">Radio</SelectItem>
                  <SelectItem value="vhf">VHF</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Input value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="Status update, request, alert..." />
          </div>
          <div className="space-y-2">
            <Label>Notes / Transcript *</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} required placeholder="Summary of the radio communication" />
          </div>
          <OperationalContextFields value={ctx} onChange={setCtx} title="Call Context" />
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Logging..." : "Log Call"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
