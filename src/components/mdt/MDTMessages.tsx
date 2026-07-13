import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, RefreshCw, Inbox, Send, Radio } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MDTMessagesProps {
  vehicleId: string | null;
}

const priorityColors: Record<string, string> = {
  normal: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
  critical: "bg-red-600",
};

/**
 * Live two-way thread between this MDT (vehicle) and Control Room dispatchers.
 * Reads & writes the `mdt_messages` table so the channel matches the one
 * Control Room writes to in ControlRoomAssignments.
 */
const MDTMessages = ({ vehicleId }: MDTMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [outboundText, setOutboundText] = useState("");
  const [outboundPriority, setOutboundPriority] = useState("normal");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("mdt_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (vehicleId) query = query.eq("vehicle_id", vehicleId);
      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);
    } catch (e: any) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const ch = supabase
      .channel(`mdt-messages-${vehicleId || "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mdt_messages" },
        (payload: any) => {
          if (!vehicleId || payload.new?.vehicle_id === vehicleId || payload.old?.vehicle_id === vehicleId) {
            fetchMessages();
            if (payload.eventType === "INSERT" && payload.new?.sent_by !== user?.id) {
              toast.info(`📡 New message from Control: ${(payload.new.message || "").slice(0, 60)}`);
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("mdt_messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Failed to acknowledge");
    else toast.success("Acknowledged");
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from("mdt_messages")
      .update({ reply: replyText, replied_at: new Date().toISOString(), is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to send reply");
      return;
    }
    setReplyText("");
    setReplyingTo(null);
    toast.success("Reply delivered to control room");
  };

  const sendOutbound = async () => {
    if (!outboundText.trim() || !user?.id) {
      toast.error("Message required");
      return;
    }
    if (!vehicleId) {
      toast.error("No vehicle bound to this terminal");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("mdt_messages").insert({
        vehicle_id: vehicleId,
        sent_by: user.id,
        message_type: "update",
        message: outboundText,
        priority: outboundPriority,
        is_read: false,
      } as any);
      if (error) throw error;
      setOutboundText("");
      setOutboundPriority("normal");
      toast.success("📨 Sent to control room");
    } catch (e: any) {
      toast.error(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Outbound composer — officer → control room */}
      <Card className="p-4 border-primary/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Radio Control Room</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchMessages} className="gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>
        <Textarea
          rows={2}
          value={outboundText}
          onChange={(e) => setOutboundText(e.target.value)}
          placeholder="Type a status update, location report, or request to dispatch…"
        />
        <div className="flex gap-2 mt-2">
          <Select value={outboundPriority} onValueChange={setOutboundPriority}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={sendOutbound} disabled={sending} className="gap-2 flex-1">
            <Send className="w-4 h-4" /> {sending ? "Sending…" : "Transmit"}
          </Button>
        </div>
      </Card>

      {/* Inbound thread */}
      {loading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading transmissions…</p>
        </Card>
      ) : messages.length === 0 ? (
        <Card className="p-8 text-center">
          <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No transmissions yet</p>
        </Card>
      ) : (
        messages.map((m) => {
          const fromControl = m.sent_by !== user?.id;
          return (
            <Card key={m.id} className={`p-4 ${fromControl ? "border-l-4 border-primary" : "border-l-4 border-muted"}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={priorityColors[m.priority] || "bg-blue-500"}>
                    {(m.priority || "normal").toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {(m.message_type || "dispatch").toUpperCase().replace("_", " ")}
                  </Badge>
                  <Badge variant={fromControl ? "default" : "secondary"} className="text-[10px]">
                    {fromControl ? "FROM CONTROL" : "FROM UNIT"}
                  </Badge>
                  {!m.is_read && fromControl && <Badge variant="destructive" className="text-[10px]">NEW</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {m.created_at ? format(new Date(m.created_at), "MMM d, HH:mm") : ""}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{m.message}</p>

              {m.reply && (
                <div className="bg-muted p-3 rounded-md mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Reply • {m.replied_at ? format(new Date(m.replied_at), "MMM d, HH:mm") : ""}
                  </p>
                  <p className="text-sm">{m.reply}</p>
                </div>
              )}

              {fromControl && (
                <div className="flex gap-2 mt-3">
                  {!m.is_read && (
                    <Button size="sm" variant="outline" onClick={() => markAsRead(m.id)} className="gap-2">
                      <CheckCircle className="w-4 h-4" /> Acknowledge
                    </Button>
                  )}
                  {!m.reply && (
                    <Button size="sm" variant="outline" onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}>
                      Quick Reply
                    </Button>
                  )}
                </div>
              )}

              {replyingTo === m.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Type your reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => sendReply(m.id)}>
                      Send Reply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MDTMessages;
