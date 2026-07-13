import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save, X } from "lucide-react";
import type { RosterRow } from "./FullRosterDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry?: RosterRow | null;
  onSave: (entry: RosterRow, originalCall?: string) => void;
}

const EMPTY: RosterRow = {
  role: "",
  call: "",
  name: "",
  phone: "",
  location: "",
  accent: "cyan",
  shift: "19:00 – 07:00",
  status: "ON DUTY",
};

const ACCENTS = ["cyan", "emerald", "amber", "violet", "blue", "rose"];
const STATUSES = ["ON DUTY", "OFF DUTY", "STANDBY", "ON LEAVE"];
const SHIFTS = ["07:00 – 19:00", "19:00 – 07:00", "06:00 – 14:00", "14:00 – 22:00", "22:00 – 06:00"];

export default function RosterEntryDialog({ open, onOpenChange, entry, onSave }: Props) {
  const [data, setData] = useState<RosterRow>(EMPTY);
  const isEdit = !!entry;

  useEffect(() => {
    setData(entry ? { ...entry } : EMPTY);
  }, [entry, open]);

  const set = <K extends keyof RosterRow>(k: K, v: RosterRow[K]) => setData((d) => ({ ...d, [k]: v }));

  const valid = data.name.trim() && data.role.trim() && data.call.trim();

  const handleSave = () => {
    if (!valid) return;
    onSave(data, entry?.call);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/10 bg-[#0B1220] p-0 text-slate-200">
        <DialogHeader className="border-b border-white/5 px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            <UserPlus className="h-4 w-4" /> {isEdit ? "Edit Roster Entry" : "Add Personnel to Roster"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-2">
          <Fld label="Full Name *" v={data.name} onChange={(v) => set("name", v)} />
          <Fld label="Role *" v={data.role} onChange={(v) => set("role", v)} placeholder="e.g. Duty Officer" />
          <Fld label="Call Sign *" v={data.call} onChange={(v) => set("call", v)} placeholder="e.g. ALPHA-1" mono />
          <Fld label="Phone" v={data.phone} onChange={(v) => set("phone", v)} placeholder="+254 7XX XXX XXX" mono />
          <Fld label="Location / Post" v={data.location} onChange={(v) => set("location", v)} />

          <Sel label="Shift" v={data.shift} onChange={(v) => set("shift", v)} options={SHIFTS} />
          <Sel label="Status" v={data.status} onChange={(v) => set("status", v)} options={STATUSES} />
          <Sel label="Colour Accent" v={data.accent} onChange={(v) => set("accent", v)} options={ACCENTS} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-5 py-3">
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} className="h-8 border-white/10 text-[11px] text-slate-300">
            <X className="mr-1 h-3 w-3" /> Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!valid}
            className="h-8 bg-cyan-500/20 text-[11px] text-cyan-200 hover:bg-cyan-500/30"
          >
            <Save className="mr-1 h-3 w-3" /> {isEdit ? "Save Changes" : "Add to Roster"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Fld = ({ label, v, onChange, mono, placeholder }: { label: string; v: string; onChange: (v: string) => void; mono?: boolean; placeholder?: string }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wider text-slate-500">{label}</Label>
    <Input
      value={v}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`mt-1 h-8 border-white/10 bg-black/40 text-[12px] text-slate-100 ${mono ? "font-mono" : ""}`}
    />
  </div>
);

const Sel = ({ label, v, onChange, options }: { label: string; v: string; onChange: (v: string) => void; options: string[] }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wider text-slate-500">{label}</Label>
    <Select value={v} onValueChange={onChange}>
      <SelectTrigger className="mt-1 h-8 border-white/10 bg-black/40 text-[12px] text-slate-100">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#0B1220] text-slate-200">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-[12px]">{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
