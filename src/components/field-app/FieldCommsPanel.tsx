import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Radio, Send, Phone, MessageSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface CommMessage {
  id: string;
  type: string;
  message_summary: string | null;
  timestamp: string;
  from_user: string | null;
  to_user: string | null;
}

const FieldCommsPanel = () => {
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('field-comms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comms_records' }, (payload) => {
        setMessages(prev => [payload.new as CommMessage, ...prev]);
        toast.info("New message received");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('comms_records')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('comms_records').insert({
        type: 'radio',
        message_summary: newMessage,
        from_user: userData.user?.id,
        timestamp: new Date().toISOString()
      });

      if (error) throw error;

      toast.success("Message sent");
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      radio: Radio,
      phone: Phone,
      message: MessageSquare,
    };
    return icons[type] || MessageSquare;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      radio: "bg-blue-500/20 text-blue-500",
      phone: "bg-green-500/20 text-green-500",
      message: "bg-purple-500/20 text-purple-500",
    };
    return colors[type] || colors.message;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Radio className="h-6 w-6 text-blue-500" />
          <span className="text-xs">Radio Control</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Phone className="h-6 w-6 text-green-500" />
          <span className="text-xs">Call Control Room</span>
        </Button>
      </div>

      {/* Send Message */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Send Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to Control Room..."
            rows={3}
          />
          <Button onClick={handleSendMessage} className="w-full gap-2" disabled={sending}>
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send to Control Room"}
          </Button>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const TypeIcon = getTypeIcon(msg.type);
                  return (
                    <Card key={msg.id} className="bg-card/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <Badge className={getTypeBadge(msg.type)}>
                                {msg.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.timestamp), 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm">
                              {msg.message_summary || "No message content"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(msg.timestamp), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldCommsPanel;
