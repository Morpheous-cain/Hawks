import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radio, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCMC, type CMCResource } from "@/hooks/useCMC";

const statusColor: Record<CMCResource["status"], string> = {
  standby: "bg-muted text-muted-foreground",
  engaged: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  enroute: "bg-primary/20 text-primary border-primary/30",
  onscene: "bg-destructive/20 text-destructive border-destructive/30",
  offline: "bg-muted text-muted-foreground",
};

const CMCResourcePanel = () => {
  const { resources, activation, actions } = useCMC();
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("qrf_vehicle");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!identifier.trim()) { toast.error("Identifier required"); return; }
    try {
      setAdding(true);
      await actions.addResource({ identifier, resource_type: type, status: "standby" });
      setIdentifier("");
      toast.success("Resource added");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setAdding(false); }
  };

  const cycle = async (r: CMCResource) => {
    const order: CMCResource["status"][] = ["standby", "enroute", "onscene", "engaged", "offline"];
    const next = order[(order.indexOf(r.status) + 1) % order.length];
    try { await actions.updateResource(r.id, { status: next }); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="w-4 h-4 text-primary" /> QRF & Resource Roll-Call
          {resources.length > 0 && <Badge variant="outline" className="ml-1">{resources.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!activation ? (
          <p className="text-xs text-muted-foreground">Activate CMC to manage resources.</p>
        ) : (
          <>
            <div className="flex gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="qrf_vehicle">QRF Vehicle</SelectItem>
                  <SelectItem value="armed_officer">Armed Officer</SelectItem>
                  <SelectItem value="k9">K9 Unit</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                </SelectContent>
              </Select>
              <Input className="h-8 text-xs" placeholder="Unit Alpha-Bravo-Delta"
                value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              <Button size="sm" className="h-8" onClick={add} disabled={adding}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {resources.length === 0 && (
              <p className="text-xs text-muted-foreground">No resources rolled in yet.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {resources.map((r) => (
                <button
                  key={r.id}
                  onClick={() => cycle(r)}
                  className="text-left p-2 rounded border border-border/50 hover:bg-muted/30 transition-colors"
                  title="Click to cycle status"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{r.identifier}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{r.resource_type.replace("_", " ")}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusColor[r.status]}`}>
                      {r.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CMCResourcePanel;
