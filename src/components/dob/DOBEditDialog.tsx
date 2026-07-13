/**
 * DOBEditDialog — small focused edit surface for an existing OB entry.
 * Receives the canonical UI entry shape from useDOBEntries and emits a
 * normalised patch back to the parent (which calls actions.update).
 */
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  DOB_TYPE_CONFIG, type DOBEntry, type DOBEntryType, type DOBUpdateInput,
} from "@/hooks/useDOBEntries";

interface Props {
  entry: DOBEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: DOBUpdateInput) => Promise<void>;
}

const DOBEditDialog = ({ entry, onOpenChange, onSave }: Props) => {
  const [type, setType] = useState<DOBEntryType>("normal");
  const [description, setDescription] = useState("");
  const [site, setSite] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);

  // Re-seed local state every time a new entry is opened.
  useEffect(() => {
    if (!entry) return;
    setType(entry.type);
    setDescription(entry.nature);
    setSite(entry.site);
    // datetime-local needs `yyyy-MM-ddTHH:mm` in *local* time.
    const d = new Date(entry.entryTime);
    const pad = (n: number) => String(n).padStart(2, "0");
    setWhen(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, [entry]);

  const submit = async () => {
    if (!entry) return;
    if (description.trim().length < 3) {
      toast({ title: "Description required", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      await onSave(entry.id, {
        entryType: type,
        description: description.trim(),
        siteName: site.trim(),
        entryTime: when ? new Date(when).toISOString() : undefined,
      });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit OB Entry {entry?.entryNo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as DOBEntryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(DOB_TYPE_CONFIG) as [DOBEntryType, { label: string }][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date / Time</Label>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Site</Label>
            <Input value={site} onChange={(e) => setSite(e.target.value)} />
          </div>
          <div>
            <Label>Nature of Occurrence</Label>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DOBEditDialog;
