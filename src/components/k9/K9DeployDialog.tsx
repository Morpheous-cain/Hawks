import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { useK9 } from "@/hooks/useK9";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitId: string;
  defaultHandlerId?: string | null;
}

const K9DeployDialog = ({ open, onOpenChange, unitId, defaultHandlerId }: Props) => {
  const { actions } = useK9();
  const [staff, setStaff] = useState<Array<{ id: string; full_name: string }>>([]);
  const [handlerId, setHandlerId] = useState<string>(defaultHandlerId ?? "");
  const [siteName, setSiteName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHandlerId(defaultHandlerId ?? "");
    (supabase as any).from("staff").select("id, full_name").eq("status", "active").then(({ data }: any) => {
      setStaff(data ?? []);
    });
  }, [open, defaultHandlerId]);

  const submit = async () => {
    if (!siteName.trim() || !purpose.trim()) { toast.error("Site and purpose are required"); return; }
    try {
      setBusy(true);
      await actions.deployUnit({
        k9_unit_id: unitId,
        handler_id: handlerId || null,
        site_name: siteName,
        purpose,
        notes,
      });
      toast.success("K9 deployed");
      onOpenChange(false);
      setSiteName(""); setPurpose(""); setNotes("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Deploy K9 Unit
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Site / location *</Label>
            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. JKIA Terminal 1" />
          </div>
          <div>
            <Label>Purpose *</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Explosives sweep">Explosives sweep</SelectItem>
                <SelectItem value="Narcotics search">Narcotics search</SelectItem>
                <SelectItem value="Patrol / crowd control">Patrol / crowd control</SelectItem>
                <SelectItem value="Search & rescue">Search & rescue</SelectItem>
                <SelectItem value="VIP escort">VIP escort</SelectItem>
                <SelectItem value="Tracking">Tracking</SelectItem>
                <SelectItem value="Training drill">Training drill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Handler</Label>
            <Select value={handlerId} onValueChange={setHandlerId}>
              <SelectTrigger><SelectValue placeholder="Assign handler" /></SelectTrigger>
              <SelectContent>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Deploy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default K9DeployDialog;
