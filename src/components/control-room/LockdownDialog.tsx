import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LockdownDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    site: "",
    level: "partial",
    reason: "",
    duration: "60",
  });

  const submit = async () => {
    if (!form.site.trim() || !form.reason.trim()) { toast.error("Site and reason required"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Stored as a critical broadcast + an incident for traceability.
      const headline = `LOCKDOWN ${form.level.toUpperCase()} · ${form.site}`;
      const body = `${form.reason}\n\nDuration: ${form.duration} minutes\nInitiated by control room.`;
      const [bcast, inc] = await Promise.all([
        supabase.from("comms_records").insert({
          type: "broadcast",
          from_user: user?.id ?? null,
          message_summary: `[CRITICAL] ${headline}`,
          full_transcript: body,
          timestamp: new Date().toISOString(),
        }),
        supabase.from("incidents").insert({
          incident_type: "lockdown",
          severity: "critical",
          status: "open",
          title: headline,
          description: body,
          location: form.site,
          reported_by: user?.id ?? null,
        } as any),
      ]);
      if (bcast.error) throw bcast.error;
      if (inc.error) throw inc.error;
      toast.success(`Lockdown declared for ${form.site}`);
      setForm({ site: "", level: "partial", reason: "", duration: "60" });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to declare lockdown");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Declare Lockdown</DialogTitle>
          <DialogDescription>Triggers a critical broadcast and opens a lockdown incident.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Site / Location *</Label>
            <Input value={form.site} maxLength={120} onChange={(e) => setForm({ ...form, site: e.target.value })} placeholder="e.g. Two Rivers Mall" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="shelter_in_place">Shelter In Place</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Reason *</Label>
            <Textarea rows={4} maxLength={2000} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Threat description / justification" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Declare Lockdown"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LockdownDialog;
