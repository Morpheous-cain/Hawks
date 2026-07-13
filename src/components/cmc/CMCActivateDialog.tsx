import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Siren } from "lucide-react";
import { toast } from "sonner";
import { useCMC } from "@/hooks/useCMC";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const CMCActivateDialog = ({ open, onOpenChange }: Props) => {
  const { actions } = useCMC();
  const [tier, setTier] = useState<"tier_1" | "tier_2" | "tier_3">("tier_1");
  const [reason, setReason] = useState("");
  const [goldCommander, setGoldCommander] = useState("");
  const [silverCommander, setSilverCommander] = useState("");
  const [bronzeCommander, setBronzeCommander] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    reason.trim().length > 0 &&
    goldCommander.trim().length > 0 &&
    silverCommander.trim().length > 0 &&
    bronzeCommander.trim().length > 0 &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) { toast.error("All commander fields and reason are required"); return; }
    try {
      setSubmitting(true);
      await actions.activate({
        tier,
        reason,
        gold_commander: goldCommander.trim(),
        silver_commander: silverCommander.trim(),
        bronze_commander: bronzeCommander.trim(),
      });
      toast.success(`CMC ${tier.toUpperCase().replace("_", " ")} activated`);
      onOpenChange(false);
      setReason("");
      setGoldCommander("");
      setSilverCommander("");
      setBronzeCommander("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to activate CMC");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Siren className="w-5 h-5 text-destructive" /> Activate Crisis Management Centre
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tier</Label>
            <Select value={tier} onValueChange={(v: any) => setTier(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tier_1">Tier 1 — Major incident, full command</SelectItem>
                <SelectItem value="tier_2">Tier 2 — Serious, scaled response</SelectItem>
                <SelectItem value="tier_3">Tier 3 — Limited, monitor only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Gold Commander <span className="text-destructive">*</span></Label>
            <Input
              value={goldCommander}
              onChange={(e) => setGoldCommander(e.target.value)}
              placeholder="Strategic (overall command)"
            />
          </div>
          <div>
            <Label>Silver Commander <span className="text-destructive">*</span></Label>
            <Input
              value={silverCommander}
              onChange={(e) => setSilverCommander(e.target.value)}
              placeholder="Tactical (operational)"
            />
          </div>
          <div>
            <Label>Bronze Commander <span className="text-destructive">*</span></Label>
            <Input
              value={bronzeCommander}
              onChange={(e) => setBronzeCommander(e.target.value)}
              placeholder="Operational (on-scene)"
            />
          </div>
          <div>
            <Label>Reason / trigger <span className="text-destructive">*</span></Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Brief description of the triggering event" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={!canSubmit}>
            <Siren className="w-4 h-4 mr-1" /> Activate CMC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CMCActivateDialog;
