import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Phone, CheckCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const WhatsAppSMSCenter = () => {
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [replyText, setReplyText] = useState("");

  const { data: whatsappMessages } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: smsMessages } = useQuery({
    queryKey: ["sms-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const handleSendReply = async (messageId: string, senderNumber: string) => {
    if (!replyText.trim()) return;

    try {
      if (activeChannel === "whatsapp") {
        const { error } = await supabase.from("whatsapp_messages").insert([{
          sender_number: "+254711000000", // System number
          message_text: replyText,
          is_incoming: false,
          ticket_id: null,
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sms_messages").insert([{
          sender_number: "+254711000000",
          recipient_number: senderNumber,
          message_text: replyText,
          is_incoming: false,
        }]);
        if (error) throw error;
      }

      toast({
        title: "Message Sent",
        description: `Reply sent via ${activeChannel.toUpperCase()}`,
      });
      setReplyText("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const messages = activeChannel === "whatsapp" ? whatsappMessages : smsMessages;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Messages List */}
      <Card className="p-6 lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            {activeChannel === "whatsapp" ? "WhatsApp" : "SMS"} Messages
          </h3>
          <div className="flex gap-2">
            <Button
              variant={activeChannel === "whatsapp" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveChannel("whatsapp")}
            >
              WhatsApp
            </Button>
            <Button
              variant={activeChannel === "sms" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveChannel("sms")}
            >
              SMS
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {messages?.map((msg: any) => (
            <div
              key={msg.id}
              className={`p-4 border rounded-lg ${
                msg.is_incoming ? "bg-background" : "bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">
                    {msg.sender_number || msg.recipient_number}
                  </span>
                  {msg.sender_name && (
                    <span className="text-sm text-muted-foreground">({msg.sender_name})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {msg.is_incoming ? (
                    <Badge variant="outline">Incoming</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-primary/10">
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Sent
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(msg.created_at), "HH:mm")}
                  </span>
                </div>
              </div>
              <p className="text-sm">{msg.message_text}</p>
              {msg.is_incoming && !msg.replied_by && (
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSendReply(msg.id, msg.sender_number)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {!messages || messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet
            </div>
          )}
        </div>
      </Card>

      {/* Send New Message */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Send New Message
        </h3>

        <div className="space-y-3">
          <Input placeholder="Recipient Number (+254...)" />
          <Textarea placeholder="Message text..." rows={6} />
          <Button className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Quick Templates</h4>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
              "Black Hawk SOC-OS on-site in 5 mins"
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
              "Security check complete - all clear"
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-xs">
              "Patrol completed - no issues"
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WhatsAppSMSCenter;