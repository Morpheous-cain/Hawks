import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCMC } from "@/hooks/useCMC";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const CMCStandDownDialog = ({ open, onOpenChange }: Props) => {
  const { actions } = useCMC();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (notes.trim().length < 10) { toast.error("Stand-down summary must be at least 10 characters"); return; }
    try {
      setSubmitting(true);
      await actions.standDown(notes);
      toast.success("CMC stood down. All tiers released.");
      onOpenChange(false);
      setNotes("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to stand down");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Stand down CMC</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Stand-down summary</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Resolution, outstanding actions, hand-back to standard ops…" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>Confirm stand-down</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CMCStandDownDialog;
