import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useK9, type K9Deployment } from "@/hooks/useK9";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deployment: K9Deployment | null;
}

const K9RecallDialog = ({ open, onOpenChange, deployment }: Props) => {
  const { actions } = useK9();
  const [outcome, setOutcome] = useState("");
  const [finds, setFinds] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!deployment) return;
    if (outcome.trim().length < 5) { toast.error("Outcome summary required"); return; }
    try {
      setBusy(true);
      await actions.completeDeployment(deployment.id, outcome, Number(finds) || 0);
      toast.success("Deployment closed");
      onOpenChange(false);
      setOutcome(""); setFinds(0);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" /> Recall & close deployment
          </DialogTitle>
        </DialogHeader>
        {deployment && (
          <p className="text-xs text-muted-foreground -mt-2">
            {deployment.deployment_number} • {deployment.site_name} • {deployment.purpose}
          </p>
        )}
        <div className="space-y-3">
          <div>
            <Label>Outcome / findings *</Label>
            <Textarea rows={3} value={outcome} onChange={(e) => setOutcome(e.target.value)}
              placeholder="Summary, any alerts, behaviour, condition on return" />
          </div>
          <div>
            <Label>Positive finds / alerts</Label>
            <Input type="number" min={0} value={finds} onChange={(e) => setFinds(parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Close deployment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default K9RecallDialog;
