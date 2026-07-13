import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const BroadcastDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    audience: "all_units",
    priority: "normal",
    headline: "",
    message: "",
  });

  const reset = () =>
    setForm({ audience: "all_units", priority: "normal", headline: "", message: "" });

  const submit = async () => {
    if (!form.headline.trim() || !form.message.trim()) {
      toast.error("Headline and message are required");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const summary = `[BROADCAST · ${form.audience.toUpperCase()} · ${form.priority.toUpperCase()}] ${form.headline}`;
      const { error } = await supabase.from("comms_records").insert({
        type: "broadcast",
        from_user: user?.id ?? null,
        message_summary: summary,
        full_transcript: form.message,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Broadcast sent to all units");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> All-Units Broadcast</DialogTitle>
          <DialogDescription>Push a priority message to the radio net and operator timeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_units">All Units</SelectItem>
                  <SelectItem value="supervisors">Supervisors Only</SelectItem>
                  <SelectItem value="patrols">Patrols</SelectItem>
                  <SelectItem value="qrf">QRF / Response</SelectItem>
                  <SelectItem value="control_room">Control Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Headline</Label>
            <Input value={form.headline} maxLength={120} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Lockdown lifted at Site Alpha" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={form.message} maxLength={2000} rows={5} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Full broadcast text…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Broadcast"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastDialog;
