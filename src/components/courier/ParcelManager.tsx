import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_address: string;
  recipient_phone: string;
  sender_name: string;
  status: string | null;
  priority: string | null;
  cod_amount: number | null;
  package_type: string | null;
  package_weight: number | null;
  created_at: string;
  assigned_rider_id: string | null;
};

const STATUSES = ["pending", "assigned", "picked_up", "in_transit", "delivered", "failed", "cancelled"];
const NEXT: Record<string, string> = {
  pending: "assigned", assigned: "picked_up",
  picked_up: "in_transit", in_transit: "delivered",
};

const badge: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  assigned: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  picked_up: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  in_transit: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  delivered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export const ParcelManager = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("courier_deliveries")
      .select("id,tracking_number,recipient_name,recipient_address,recipient_phone,sender_name,status,priority,cod_amount,package_type,package_weight,created_at,assigned_rider_id")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("parcel-mgr")
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_deliveries" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (priority !== "all" && r.priority !== priority) return false;
      if (!ql) return true;
      return [r.tracking_number, r.recipient_name, r.recipient_address, r.recipient_phone, r.sender_name]
        .join(" ").toLowerCase().includes(ql);
    });
  }, [rows, q, status, priority]);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    rows.forEach((r) => { t[r.status ?? ""] = (t[r.status ?? ""] ?? 0) + 1; });
    return t;
  }, [rows]);

  const advance = async (r: Row) => {
    const next = NEXT[r.status ?? ""]; if (!next) return;
    setActing(r.id);
    const patch: any = { status: next };
    if (next === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (next === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("courier_deliveries").update(patch).eq("id", r.id);
    setActing(null);
    if (error) toast.error(error.message); else toast.success(`${r.tracking_number} → ${next}`);
  };

  const setStatusManual = async (r: Row, s: string) => {
    setActing(r.id);
    const patch: any = { status: s };
    if (s === "picked_up") patch.picked_up_at = new Date().toISOString();
    if (s === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("courier_deliveries").update(patch).eq("id", r.id);
    setActing(null);
    if (error) toast.error(error.message); else toast.success(`${r.tracking_number} → ${s}`);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-primary" /> Parcel Management
            <span className="text-xs font-normal text-muted-foreground">({filtered.length} of {rows.length})</span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Badge key={s} variant="outline"
              className={`${status === s ? badge[s] : "cursor-pointer"} ${status === s ? "" : "hover:bg-muted"}`}
              onClick={() => setStatus(status === s ? "all" : s)}>
              {s} {totals[s] ? `· ${totals[s]}` : ""}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tracking, recipient, phone, sender..." className="pl-8 h-9" />
          </div>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">COD</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Loading…</TableCell></TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No parcels match.</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.tracking_number}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.recipient_name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[260px]">{r.recipient_address}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.package_type ?? "—"}
                    {r.package_weight ? <div className="text-muted-foreground">{r.package_weight} kg</div> : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={badge[r.status ?? ""] ?? ""}>{r.status ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.priority ?? "normal"}</TableCell>
                  <TableCell className="text-right text-xs">
                    {Number(r.cod_amount) > 0 ? `KES ${Number(r.cod_amount).toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      {NEXT[r.status ?? ""] && (
                        <Button size="sm" className="h-7" disabled={acting === r.id} onClick={() => advance(r)}>
                          {NEXT[r.status ?? ""]} <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      <Select onValueChange={(s) => setStatusManual(r, s)}>
                        <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue placeholder="Set…" /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ParcelManager;
