import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useK9 } from "@/hooks/useK9";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; unitId: string; }

const K9HealthDialog = ({ open, onOpenChange, unitId }: Props) => {
  const { actions } = useK9();
  const [type, setType] = useState<any>("checkup");
  const [vet, setVet] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medications, setMedications] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [cost, setCost] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      await actions.logHealth({
        k9_unit_id: unitId,
        record_type: type,
        vet_name: vet || null,
        performed_at: new Date().toISOString(),
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        medications: medications || null,
        next_due_at: nextDue || null,
        cost: cost ? Number(cost) : null,
      });
      toast.success("Health record saved");
      onOpenChange(false);
      setVet(""); setDiagnosis(""); setTreatment(""); setMedications(""); setNextDue(""); setCost("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" /> Log health record
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="checkup">Routine checkup</SelectItem>
                <SelectItem value="vaccination">Vaccination</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="injury">Injury</SelectItem>
                <SelectItem value="dental">Dental</SelectItem>
                <SelectItem value="grooming">Grooming</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Vet / clinic</Label><Input value={vet} onChange={(e) => setVet(e.target.value)} /></div>
          <div><Label>Diagnosis</Label><Textarea rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></div>
          <div><Label>Treatment</Label><Textarea rows={2} value={treatment} onChange={(e) => setTreatment(e.target.value)} /></div>
          <div><Label>Medications</Label><Input value={medications} onChange={(e) => setMedications(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Next due</Label><Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></div>
            <div><Label>Cost (KES)</Label><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Save record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default K9HealthDialog;
