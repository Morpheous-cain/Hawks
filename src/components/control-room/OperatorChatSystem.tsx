import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Send, User, Clock, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  incidentId?: string;
}

const OperatorChatSystem = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      setCurrentUser({ id: user.id, name: profile?.full_name || 'Operator' });
    }
  };

  const fetchMessages = async () => {
    // Fetch recent comms records as chat messages
    const { data } = await supabase
      .from('comms_records')
      .select('id, from_user, message_summary, timestamp, incident_id')
      .eq('type', 'operator_chat')
      .order('timestamp', { ascending: true })
      .limit(50);

    if (data) {
      // Get sender names
      const userIds = [...new Set(data.map(m => m.from_user).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const chatMessages: ChatMessage[] = data.map(m => ({
        id: m.id,
        senderId: m.from_user || '',
        senderName: profileMap.get(m.from_user || '') || 'Unknown',
        message: m.message_summary || '',
        timestamp: m.timestamp,
        incidentId: m.incident_id || undefined
      }));

      setMessages(chatMessages);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('operator-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comms_records',
          filter: 'type=eq.operator_chat'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      await supabase.from('comms_records').insert({
        type: 'operator_chat',
        from_user: currentUser.id,
        message_summary: newMessage.trim(),
        timestamp: new Date().toISOString()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-5 h-5 text-primary" />
          Operator Chat
          <Badge variant="outline" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-64 pr-2" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.senderId === currentUser?.id ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div
                  className={`max-w-[70%] ${
                    msg.senderId === currentUser?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  } rounded-lg p-2`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {msg.senderId === currentUser?.id ? 'You' : msg.senderName}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  {msg.incidentId && (
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                      <AlertCircle className="w-3 h-3" />
                      <span>Re: Incident</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start a conversation with other operators</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperatorChatSystem;
