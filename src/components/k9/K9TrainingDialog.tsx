import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Award } from "lucide-react";
import { toast } from "sonner";
import { useK9 } from "@/hooks/useK9";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; unitId: string; }

const K9TrainingDialog = ({ open, onOpenChange, unitId }: Props) => {
  const { actions } = useK9();
  const [sessionType, setSessionType] = useState("obedience");
  const [instructor, setInstructor] = useState("");
  const [duration, setDuration] = useState("");
  const [score, setScore] = useState("");
  const [pass, setPass] = useState(true);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      await actions.logTraining({
        k9_unit_id: unitId,
        session_type: sessionType,
        instructor: instructor || null,
        performed_at: new Date().toISOString(),
        duration_minutes: duration ? Number(duration) : null,
        score: score ? Number(score) : null,
        pass,
        notes: notes || null,
      });
      toast.success("Training logged");
      onOpenChange(false);
      setInstructor(""); setDuration(""); setScore(""); setNotes("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Log training session
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Session type</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="obedience">Obedience</SelectItem>
                <SelectItem value="detection">Detection</SelectItem>
                <SelectItem value="bitework">Bite-work</SelectItem>
                <SelectItem value="scenario">Scenario drill</SelectItem>
                <SelectItem value="agility">Agility</SelectItem>
                <SelectItem value="recertification">Recertification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Instructor</Label><Input value={instructor} onChange={(e) => setInstructor(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            <div><Label>Score (0-100)</Label><Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={pass} onCheckedChange={(v) => setPass(v === true)} /> Passed
          </label>
          <div><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Save session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default K9TrainingDialog;
