import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, UserCheck, Download, UserPlus, Pencil, Trash2 } from "lucide-react";
import type { OfficerProfile } from "./OfficerProfileDialog";

export interface RosterRow extends OfficerProfile {
  shift: string;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roster: RosterRow[];
  onViewProfile: (officer: OfficerProfile) => void;
  onAdd?: () => void;
  onEdit?: (officer: RosterRow) => void;
  onDelete?: (officer: RosterRow) => void;
}

const accentText: Record<string, string> = {
  cyan: "text-cyan-300", emerald: "text-emerald-300", amber: "text-amber-300",
  violet: "text-violet-300", blue: "text-blue-300", rose: "text-rose-300",
};

export default function FullRosterDialog({ open, onOpenChange, roster, onViewProfile, onAdd, onEdit, onDelete }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "ON DUTY" | "OFF DUTY">("all");
  const [confirmDelete, setConfirmDelete] = useState<RosterRow | null>(null);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    return roster.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!t) return true;
      return [r.name, r.role, r.call, r.location, r.phone].some((v) => v.toLowerCase().includes(t));
    });
  }, [roster, q, filter]);

  const exportCsv = () => {
    const header = ["#", "Role", "Name", "Call Sign", "Location", "Shift", "Status", "Contact"];
    const rows = filtered.map((r, i) => [i + 1, r.role, r.name, r.call, r.location, r.shift, r.status, r.phone]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `duty-roster-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl border-white/10 bg-[#0B1220] p-0 text-slate-200">
          <DialogHeader className="border-b border-white/5 px-5 py-3">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
              <UserCheck className="h-4 w-4" /> Full Duty Roster · {filtered.length} of {roster.length}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-5 py-2.5">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, call sign, role, location…"
                className="h-8 border-white/10 bg-black/30 pl-8 text-xs text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "ON DUTY", "OFF DUTY"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter(f)}
                  className={`h-8 border-white/10 text-[10px] uppercase tracking-wider ${
                    filter === f ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40" : "text-slate-400"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={exportCsv} className="h-8 border-white/10 text-[10px] text-slate-300">
              <Download className="mr-1 h-3 w-3" /> Export CSV
            </Button>
            {onAdd && (
              <Button size="sm" onClick={onAdd} className="h-8 bg-cyan-500/20 text-[10px] text-cyan-200 hover:bg-cyan-500/30">
                <UserPlus className="mr-1 h-3 w-3" /> Add Personnel
              </Button>
            )}
          </div>

          <ScrollArea className="h-[60vh]">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 z-10 bg-[#0B1220]">
                <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Call</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Shift</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.call + i} className="border-b border-white/[0.03] transition hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2 text-slate-200">{r.role}</td>
                    <td className="px-3 py-2 font-medium text-slate-100">{r.name}</td>
                    <td className={`px-3 py-2 font-mono font-bold ${accentText[r.accent] ?? "text-cyan-300"}`}>{r.call}</td>
                    <td className="px-3 py-2 text-slate-400">{r.location}</td>
                    <td className="px-3 py-2 text-slate-400">{r.shift}</td>
                    <td className="px-3 py-2">
                      <Badge className={`border text-[9px] ${
                        r.status === "ON DUTY"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                      }`}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-400">{r.phone}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewProfile(r)}
                          className="h-6 border-cyan-500/30 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/10"
                        >
                          View
                        </Button>
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(r)}
                            className="h-6 border-amber-500/30 px-2 text-[10px] text-amber-300 hover:bg-amber-500/10"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(r)}
                            className="h-6 border-rose-500/30 px-2 text-[10px] text-rose-300 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-10 text-center text-xs text-slate-500">No personnel match your filter.</td></tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-[#0B1220] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-300">Remove from roster?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will remove <span className="font-semibold text-slate-100">{confirmDelete?.name}</span>{" "}
              ({confirmDelete?.call}) from today's duty roster. This action is logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete && onDelete) onDelete(confirmDelete);
                setConfirmDelete(null);
              }}
              className="bg-rose-500/80 text-white hover:bg-rose-500"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
