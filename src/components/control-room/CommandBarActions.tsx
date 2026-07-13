import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Radio, Phone, Users, Megaphone, ShieldAlert,
  BookOpen, LogOut, Printer, Download, RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { IncidentCreateDialog } from "./IncidentCreateDialog";
import { RadioCallDialog } from "./RadioCallDialog";
import { RequestBackupDialog } from "./RequestBackupDialog";
import { BroadcastDialog } from "./BroadcastDialog";
import { LockdownDialog } from "./LockdownDialog";
import { LogEntryDialog } from "./LogEntryDialog";
import { EndShiftDialog } from "./EndShiftDialog";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  shift: any;
  onShiftClosed?: () => void;
  onRefresh?: () => void;
}

const CommandBarActions = ({ shift, onShiftClosed, onRefresh }: Props) => {
  const [showIncident, setShowIncident] = useState(false);
  const [showRadio, setShowRadio] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showLockdown, setShowLockdown] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);

  const exportShiftLog = async () => {
    try {
      const since = shift?.shift_start ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("comms_records")
        .select("timestamp,type,message_summary,full_transcript")
        .gte("timestamp", since)
        .order("timestamp", { ascending: true });
      if (error) throw error;
      const rows = [["timestamp", "type", "summary", "details"]].concat(
        (data ?? []).map((r: any) => [
          r.timestamp,
          r.type,
          (r.message_summary ?? "").replace(/"/g, '""'),
          (r.full_transcript ?? "").replace(/"/g, '""'),
        ]),
      );
      const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shift-log-${(shift?.shift_id ?? "current")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Shift log exported");
    } catch (e: any) {
      toast.error(e.message ?? "Export failed");
    }
  };

  const actions = [
    { label: "Incident", icon: AlertTriangle, onClick: () => setShowIncident(true), variant: "destructive" as const },
    { label: "Radio Call", icon: Radio, onClick: () => setShowRadio(true) },
    { label: "Backup", icon: Users, onClick: () => setShowBackup(true) },
    { label: "Broadcast", icon: Megaphone, onClick: () => setShowBroadcast(true) },
    { label: "Lockdown", icon: ShieldAlert, onClick: () => setShowLockdown(true), variant: "destructive" as const },
    { label: "Log Entry", icon: BookOpen, onClick: () => setShowLog(true) },
    { label: "Export Log", icon: Download, onClick: exportShiftLog, variant: "outline" as const },
    { label: "Print", icon: Printer, onClick: () => window.print(), variant: "outline" as const },
    { label: "Refresh", icon: RefreshCcw, onClick: () => { onRefresh?.(); toast.info("Refreshed"); }, variant: "outline" as const },
    { label: "End Shift", icon: LogOut, onClick: () => setShowEndShift(true), variant: "outline" as const },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <Button key={a.label} size="sm" variant={a.variant ?? "default"} onClick={a.onClick} className="gap-1.5">
            <a.icon className="h-3.5 w-3.5" />
            <span className="text-xs">{a.label}</span>
          </Button>
        ))}
      </div>

      <IncidentCreateDialog open={showIncident} onOpenChange={setShowIncident} onSuccess={() => { onRefresh?.(); }} />
      <RadioCallDialog open={showRadio} onOpenChange={setShowRadio} onSuccess={onRefresh} />
      <RequestBackupDialog open={showBackup} onOpenChange={setShowBackup} onSuccess={onRefresh} />
      <BroadcastDialog open={showBroadcast} onOpenChange={setShowBroadcast} onSuccess={onRefresh} />
      <LockdownDialog open={showLockdown} onOpenChange={setShowLockdown} onSuccess={onRefresh} />
      <LogEntryDialog open={showLog} onOpenChange={setShowLog} onSuccess={onRefresh} />
      <EndShiftDialog open={showEndShift} onOpenChange={setShowEndShift} shift={shift} onClosed={onShiftClosed} />
    </>
  );
};

export default CommandBarActions;
