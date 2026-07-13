import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alarm: any | null;
  mode: "resolve" | "false_alarm";
  onConfirm: (alarmId: string, notes: string, isFalseAlarm: boolean, category?: string) => Promise<void>;
}

const FALSE_ALARM_CATEGORIES = [
  "User error",
  "Sensor malfunction",
  "Environmental (wind/animal/insect)",
  "Power/battery fault",
  "Test activation",
  "Other",
];

const RESOLUTION_OUTCOMES = [
  "Site secured – no incident",
  "Trespasser apprehended",
  "Property damage – report filed",
  "Police handover",
  "Medical evacuation",
  "Equipment recovered",
  "Escalated to investigations",
  "Other",
];

export default function AlarmResolveDialog({ open, onOpenChange, alarm, mode, onConfirm }: Props) {
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isFalse = mode === "false_alarm";
  const title = isFalse ? "Mark as False Alarm" : "Resolve Alarm";
  const categories = isFalse ? FALSE_ALARM_CATEGORIES : RESOLUTION_OUTCOMES;

  const handleSubmit = async () => {
    if (!alarm || !category || notes.trim().length < 5) return;
    setSubmitting(true);
    try {
      const composedNotes = `[${category}] ${notes.trim()}`;
      await onConfirm(alarm.id, composedNotes, isFalse, category);
      setCategory("");
      setNotes("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {alarm && (
          <div className="text-sm text-muted-foreground mb-2">
            <span className="font-semibold text-foreground">{alarm.alarm_number}</span> · {alarm.alarm_type} · {alarm.location}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{isFalse ? "Cause" : "Outcome"} *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${isFalse ? "cause" : "outcome"}`} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes * (min 5 chars)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isFalse ? "Describe what was found and confirmation it was not a real incident…" : "Describe response actions, on-scene findings, and disposition…"}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !category || notes.trim().length < 5}
            variant={isFalse ? "outline" : "default"}
          >
            {submitting ? "Saving…" : isFalse ? "Confirm False Alarm" : "Confirm Resolved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
