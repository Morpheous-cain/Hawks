import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, Send, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useCMC, type CMCNotification } from "@/hooks/useCMC";

const channelColor = (c: CMCNotification["channel"]) => ({
  call: "bg-destructive/15 text-destructive",
  sms: "bg-amber-500/15 text-amber-500",
  email: "bg-primary/15 text-primary",
  radio: "bg-purple-500/15 text-purple-500",
  app: "bg-emerald-500/15 text-emerald-500",
}[c]);

const statusBadge = (s: CMCNotification["status"]) => {
  switch (s) {
    case "pending": return <Badge variant="outline">Pending</Badge>;
    case "sent": return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Sent</Badge>;
    case "acknowledged": return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Ack</Badge>;
    case "failed": return <Badge variant="destructive">Failed</Badge>;
  }
};

const CMCNotificationPanel = () => {
  const { notifications, activation, actions } = useCMC();

  if (!activation) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm">
          <ArrowUpCircle className="w-4 h-4 text-primary" /> Executive Notification Chain
        </CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Activate the CMC to seed the escalation chain.
        </CardContent>
      </Card>
    );
  }

  const handle = async (id: string, status: CMCNotification["status"]) => {
    try { await actions.updateNotification(id, { status }); toast.success(`Marked ${status}`); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ArrowUpCircle className="w-4 h-4 text-primary" /> Executive Notification Chain
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{n.role_name}</div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${channelColor(n.channel)}`}>{n.channel.toUpperCase()}</span>
                <span>SLA ≤ {n.sla_minutes}m</span>
              </div>
            </div>
            {statusBadge(n.status)}
            <div className="flex gap-1">
              {n.status === "pending" && (
                <Button size="sm" variant="outline" className="h-7 px-2"
                  onClick={() => handle(n.id, "sent")} title="Mark sent">
                  <Send className="w-3 h-3" />
                </Button>
              )}
              {n.status === "sent" && (
                <Button size="sm" variant="outline" className="h-7 px-2"
                  onClick={() => handle(n.id, "acknowledged")} title="Mark acknowledged">
                  <CheckCircle2 className="w-3 h-3" />
                </Button>
              )}
              {n.status !== "acknowledged" && n.status !== "failed" && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive"
                  onClick={() => handle(n.id, "failed")} title="Mark failed">
                  <XCircle className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CMCNotificationPanel;
