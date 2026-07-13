import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Plus, Download } from "lucide-react";
import { useCMC, type CMCDecision } from "@/hooks/useCMC";
import { formatDistanceToNow } from "date-fns";

const categoryColor: Record<string, string> = {
  strategic: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  tactical: "bg-primary/15 text-primary border-primary/30",
  operational: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  external: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  welfare: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  statutory: "bg-destructive/15 text-destructive border-destructive/30",
};

interface Props { onAdd: () => void; }

const exportCSV = (rows: CMCDecision[]) => {
  const header = ["Timestamp", "Category", "Role", "Decision", "Rationale"];
  const lines = rows.map((r) => [
    new Date(r.made_at).toISOString(),
    r.category, r.made_by_role ?? "",
    `"${(r.decision || "").replace(/"/g, '""')}"`,
    `"${(r.rationale || "").replace(/"/g, '""')}"`,
  ].join(","));
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `cmc-decisions-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const CMCDecisionLog = ({ onAdd }: Props) => {
  const { decisions, activation } = useCMC();

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="w-4 h-4 text-primary" /> Decision & Audit Log
          {decisions.length > 0 && <Badge variant="outline" className="ml-1">{decisions.length}</Badge>}
        </CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => exportCSV(decisions)}
            disabled={!decisions.length}>
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
          <Button size="sm" className="h-7 px-2" onClick={onAdd} disabled={!activation}>
            <Plus className="w-3 h-3 mr-1" /> Log
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs">
        {!decisions.length && (
          <p className="text-muted-foreground">
            {activation
              ? "No decisions logged yet. Every CMC action is timestamped, signed and exportable."
              : "No active CMC. Decision log will appear here once activated."}
          </p>
        )}
        {decisions.length > 0 && (
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-2">
              {decisions.map((d) => (
                <div key={d.id} className="border border-border/50 rounded p-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`text-[10px] ${categoryColor[d.category] ?? ""}`}>
                      {d.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(d.made_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="font-medium leading-snug">{d.decision}</p>
                  {d.rationale && <p className="text-muted-foreground italic">{d.rationale}</p>}
                  {d.made_by_role && (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{d.made_by_role}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CMCDecisionLog;
