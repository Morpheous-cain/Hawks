/**
 * DOBDetailDrawer — read-only detail view for an OB entry.
 * Uses the shared Sheet primitive so it slides in over the table without
 * stealing focus from the page beneath it.
 */
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DOB_TYPE_CONFIG, type DOBEntry } from "@/hooks/useDOBEntries";

interface Props {
  entry: DOBEntry | null;
  onOpenChange: (open: boolean) => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-3 py-2">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="col-span-2 text-sm">{value}</div>
  </div>
);

const DOBDetailDrawer = ({ entry, onOpenChange }: Props) => (
  <Sheet open={!!entry} onOpenChange={onOpenChange}>
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      {entry && (
        <>
          <SheetHeader>
            <SheetTitle>OB Entry {entry.entryNo}</SheetTitle>
            <SheetDescription>{entry.date} · {entry.time}</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <Badge className={`border ${DOB_TYPE_CONFIG[entry.type].color}`}>
              {DOB_TYPE_CONFIG[entry.type].label}
            </Badge>
          </div>
          <Separator className="my-4" />
          <Row label="Officer" value={entry.officer} />
          <Row label="Site"    value={entry.site || "—"} />
          <Row label="Signature" value={<span className="italic">{entry.signature}</span>} />
          <Separator className="my-3" />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Nature of Occurrence</div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.nature}</p>
          </div>
        </>
      )}
    </SheetContent>
  </Sheet>
);

export default DOBDetailDrawer;
