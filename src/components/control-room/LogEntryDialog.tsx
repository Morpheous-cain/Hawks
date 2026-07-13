import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const LogEntryDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: "general",
    location: "",
    summary: "",
    details: "",
  });

  const submit = async () => {
    if (!form.summary.trim()) { toast.error("Summary is required"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Log as a comms_record (type=log_entry) so it surfaces in unified timeline.
      const { error } = await supabase.from("comms_records").insert({
        type: "log_entry",
        from_user: user?.id ?? null,
        message_summary: `[${form.category.toUpperCase()}${form.location ? ` · ${form.location}` : ""}] ${form.summary}`,
        full_transcript: form.details || null,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Log entry recorded");
      setForm({ category: "general", location: "", summary: "", details: "" });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to log entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Add Logbook Entry</DialogTitle>
          <DialogDescription>Record a sitrep or shift observation into the operator log.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="sitrep">Situation Report</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="handover">Handover Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} maxLength={120} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Site / sector" />
            </div>
          </div>
          <div>
            <Label>Summary *</Label>
            <Input value={form.summary} maxLength={200} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Short line for the log" />
          </div>
          <div>
            <Label>Details</Label>
            <Textarea rows={5} maxLength={3000} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Optional narrative" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogEntryDialog;
