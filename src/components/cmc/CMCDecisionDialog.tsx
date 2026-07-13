import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useCMC } from "@/hooks/useCMC";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const CMCDecisionDialog = ({ open, onOpenChange }: Props) => {
  const { actions, activation } = useCMC();
  const [category, setCategory] = useState<any>("tactical");
  const [role, setRole] = useState("silver");
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!activation) { toast.error("CMC must be active first"); return; }
    if (decision.trim().length < 5) { toast.error("Decision text too short"); return; }
    try {
      setSubmitting(true);
      await actions.logDecision({ category, decision, rationale, role });
      toast.success("Decision logged");
      onOpenChange(false);
      setDecision(""); setRationale("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Log command decision
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic">Strategic</SelectItem>
                  <SelectItem value="tactical">Tactical</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="external">External liaison</SelectItem>
                  <SelectItem value="welfare">Welfare</SelectItem>
                  <SelectItem value="statutory">Statutory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Command tier</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Gold (Strategic)</SelectItem>
                  <SelectItem value="silver">Silver (Tactical)</SelectItem>
                  <SelectItem value="bronze">Bronze (Operational)</SelectItem>
                  <SelectItem value="operator">Control room operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Decision</Label>
            <Input value={decision} onChange={(e) => setDecision(e.target.value)}
              placeholder="e.g. Deploy QRF-2 to Northgate site" />
          </div>
          <div>
            <Label>Rationale (optional)</Label>
            <Textarea rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)}
              placeholder="Why this decision was made — for post-incident review" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>Log decision</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CMCDecisionDialog;
