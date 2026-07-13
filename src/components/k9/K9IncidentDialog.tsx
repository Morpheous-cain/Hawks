import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useK9 } from "@/hooks/useK9";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; unitId: string; }

const K9IncidentDialog = ({ open, onOpenChange, unitId }: Props) => {
  const { actions, byUnit } = useK9();
  const active = byUnit(unitId).activeDeployment;
  const [type, setType] = useState("find");
  const [severity, setSeverity] = useState<any>("low");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(active?.site_name ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (description.trim().length < 5) { toast.error("Description required"); return; }
    try {
      setBusy(true);
      await actions.logIncident({
        k9_unit_id: unitId,
        deployment_id: active?.id ?? null,
        incident_type: type,
        severity,
        description,
        location: location || null,
        occurred_at: new Date().toISOString(),
      });
      toast.success("Incident logged");
      onOpenChange(false);
      setDescription(""); setLocation(""); setType("find"); setSeverity("low");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Log K9 incident
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="find">Positive find / alert</SelectItem>
                  <SelectItem value="bite">Bite</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="refusal">Refusal to engage</SelectItem>
                  <SelectItem value="alert">False alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div><Label>Description *</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Log incident</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default K9IncidentDialog;
