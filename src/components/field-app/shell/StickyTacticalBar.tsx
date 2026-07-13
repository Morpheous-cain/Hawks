import { Mic, Phone, Siren, Radio, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  onPTT?: () => void;
  onCall?: () => void;
  onPanic?: () => void;
  onBackup?: () => void;
  onStatus?: () => void;
}

export const StickyTacticalBar = ({ onPTT, onCall, onPanic, onBackup, onStatus }: Props) => {
  const fire = (label: string, fn?: () => void) => {
    if (fn) fn();
    else toast.info(`${label} — opening HQ Connect`);
  };

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border/60 bg-background/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 border-emerald-500/40 hover:bg-emerald-500/10"
          onClick={() => fire("Status", onStatus)}
        >
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">Status</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 border-blue-500/40 hover:bg-blue-500/10"
          onClick={() => fire("PTT", onPTT)}
        >
          <Mic className="h-4 w-4 text-blue-500" />
          <span className="hidden sm:inline">PTT</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 border-cyan-500/40 hover:bg-cyan-500/10"
          onClick={() => fire("Call HQ", onCall)}
        >
          <Phone className="h-4 w-4 text-cyan-500" />
          <span className="hidden sm:inline">Call HQ</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 border-amber-500/40 hover:bg-amber-500/10"
          onClick={() => fire("Backup", onBackup)}
        >
          <Radio className="h-4 w-4 text-amber-500" />
          <span className="hidden sm:inline">Backup</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn("flex-1 gap-1.5 border-red-500/60 bg-red-500/10 hover:bg-red-500/20")}
          onClick={() => fire("PANIC", onPanic)}
        >
          <Siren className="h-4 w-4 text-red-500" />
          <span className="hidden sm:inline font-bold">PANIC</span>
        </Button>
      </div>
    </div>
  );
};

export default StickyTacticalBar;
